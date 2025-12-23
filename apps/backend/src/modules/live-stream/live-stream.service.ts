import {
  Injectable,
  BadRequestException,
  NotFoundException,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../../infra/prisma.service';
import { RoomManagerService } from './services/room-manager.service';
import { HlsGeneratorService } from './services/hls-generator.service';
import { RecordingService } from './services/recording.service';
import { CreateStreamDto } from './dto/create-stream.dto';
import {
  StreamResponseDto,
  ActiveStreamResponseDto,
  StreamStatsDto,
} from './dto/stream-response.dto';
import { LiveStreamStatus, UserRole } from '@prisma/client';

@Injectable()
export class LiveStreamService {
  private readonly logger = new Logger(LiveStreamService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly roomManager: RoomManagerService,
    private readonly hlsGenerator: HlsGeneratorService,
    private readonly recording: RecordingService,
  ) {}

  // ==================== HOCA İŞLEMLERİ ====================

  /**
   * Yeni yayın oluştur (planla)
   */
  async createStream(
    hostId: string,
    dto: CreateStreamDto,
    tenantId: string,
  ): Promise<ActiveStreamResponseDto> {
    // Host yetkisi kontrol (ADMIN veya CREATOR)
    const host = await this.prisma.user.findUnique({
      where: { id: hostId },
      select: { role: true, name: true, avatarUrl: true },
    });

    if (!host || ![UserRole.ADMIN, UserRole.CREATOR].includes(host.role)) {
      throw new ForbiddenException('Yayın yapma yetkiniz yok');
    }

    // Aktif yayın var mı kontrol
    const activeStream = await this.prisma.liveStream.findFirst({
      where: {
        hostId,
        status: {
          in: [
            LiveStreamStatus.SCHEDULED,
            LiveStreamStatus.PREPARING,
            LiveStreamStatus.LIVE,
            LiveStreamStatus.PAUSED,
          ],
        },
      },
    });

    if (activeStream) {
      throw new BadRequestException('Zaten aktif bir yayınınız var');
    }

    // Yayın oluştur
    const stream = await this.prisma.liveStream.create({
      data: {
        tenantId,
        hostId,
        title: dto.title,
        description: dto.description,
        scheduledAt: dto.scheduledAt ? new Date(dto.scheduledAt) : null,
        isRecorded: dto.isRecorded ?? true,
        status: dto.scheduledAt
          ? LiveStreamStatus.SCHEDULED
          : LiveStreamStatus.PREPARING,
      },
      include: {
        host: {
          select: { id: true, name: true, avatarUrl: true },
        },
      },
    });

    // İlk odayı oluştur
    await this.roomManager.createRoom(stream.id, 1);

    this.logger.log(`Yayın oluşturuldu: ${stream.id} (Host: ${hostId})`);

    return this.formatStreamResponse(stream, true) as ActiveStreamResponseDto;
  }

  /**
   * Yayını başlat (Hoca mikrofonu açtı)
   */
  async startStream(
    streamId: string,
    hostId: string,
  ): Promise<ActiveStreamResponseDto> {
    const stream = await this.prisma.liveStream.findUnique({
      where: { id: streamId },
      include: {
        host: { select: { id: true, name: true, avatarUrl: true } },
      },
    });

    if (!stream) {
      throw new NotFoundException('Yayın bulunamadı');
    }

    if (stream.hostId !== hostId) {
      throw new ForbiddenException('Bu yayını başlatma yetkiniz yok');
    }

    if (
      ![
        LiveStreamStatus.SCHEDULED,
        LiveStreamStatus.PREPARING,
        LiveStreamStatus.PAUSED,
      ].includes(stream.status)
    ) {
      throw new BadRequestException('Yayın başlatılamaz');
    }

    // HLS encoding başlat
    await this.hlsGenerator.startEncoding(streamId);

    // HLS URL oluştur
    const hlsUrl = this.hlsGenerator.getHlsUrl(streamId);
    const hlsPath = `streams/${streamId}/live.m3u8`;

    // Yayını başlat
    const updatedStream = await this.prisma.liveStream.update({
      where: { id: streamId },
      data: {
        status: LiveStreamStatus.LIVE,
        startedAt: stream.startedAt || new Date(),
        hlsUrl,
        hlsPath,
      },
      include: {
        host: { select: { id: true, name: true, avatarUrl: true } },
      },
    });

    // Kayıt başlat
    if (stream.isRecorded) {
      // Biraz bekle ki HLS hazır olsun
      setTimeout(() => {
        this.recording.startRecording(streamId);
      }, 5000);
    }

    this.logger.log(`Yayın başladı: ${streamId}`);

    return this.formatStreamResponse(
      updatedStream,
      true,
    ) as ActiveStreamResponseDto;
  }

  /**
   * Yayını duraklat
   */
  async pauseStream(streamId: string, hostId: string): Promise<void> {
    const stream = await this.validateHostAccess(streamId, hostId);

    if (stream.status !== LiveStreamStatus.LIVE) {
      throw new BadRequestException('Yayın canlı değil');
    }

    await this.prisma.liveStream.update({
      where: { id: streamId },
      data: { status: LiveStreamStatus.PAUSED },
    });

    this.logger.log(`Yayın duraklatıldı: ${streamId}`);
  }

  /**
   * Yayını devam ettir
   */
  async resumeStream(streamId: string, hostId: string): Promise<void> {
    const stream = await this.validateHostAccess(streamId, hostId);

    if (stream.status !== LiveStreamStatus.PAUSED) {
      throw new BadRequestException('Yayın duraklatılmamış');
    }

    await this.prisma.liveStream.update({
      where: { id: streamId },
      data: { status: LiveStreamStatus.LIVE },
    });

    this.logger.log(`Yayın devam ediyor: ${streamId}`);
  }

  /**
   * Yayını bitir
   */
  async endStream(streamId: string, hostId: string): Promise<void> {
    const stream = await this.validateHostAccess(streamId, hostId);

    if (
      ![LiveStreamStatus.LIVE, LiveStreamStatus.PAUSED].includes(stream.status)
    ) {
      throw new BadRequestException('Yayın sonlandırılamaz');
    }

    const endedAt = new Date();
    const duration = stream.startedAt
      ? Math.floor((endedAt.getTime() - stream.startedAt.getTime()) / 1000)
      : 0;

    // HLS encoding durdur
    this.hlsGenerator.stopEncoding(streamId);

    // Kayıt durdur ve VOD URL al
    let recordingUrl: string | null = null;
    let recordingPath: string | null = null;

    if (stream.isRecorded) {
      const recording = await this.recording.stopRecording(streamId);
      recordingUrl = recording.cdnUrl || null;
      recordingPath = recording.path || null;
    }

    // Yayını sonlandır
    await this.prisma.liveStream.update({
      where: { id: streamId },
      data: {
        status: LiveStreamStatus.ENDED,
        endedAt,
        duration,
        recordingUrl,
        recordingPath,
      },
    });

    // Tüm odaları kapat
    await this.roomManager.closeAllRooms(streamId);

    // HLS dosyalarını temizle (kayıt yoksa)
    if (!stream.isRecorded) {
      await this.hlsGenerator.cleanup(streamId);
    }

    this.logger.log(`Yayın sona erdi: ${streamId} (Süre: ${duration}s)`);
  }

  /**
   * Yayını iptal et
   */
  async cancelStream(streamId: string, hostId: string): Promise<void> {
    const stream = await this.validateHostAccess(streamId, hostId);

    if (
      ![LiveStreamStatus.SCHEDULED, LiveStreamStatus.PREPARING].includes(
        stream.status,
      )
    ) {
      throw new BadRequestException('Yayın iptal edilemez');
    }

    await this.prisma.liveStream.update({
      where: { id: streamId },
      data: { status: LiveStreamStatus.CANCELLED },
    });

    // Odaları kapat
    await this.roomManager.closeAllRooms(streamId);

    this.logger.log(`Yayın iptal edildi: ${streamId}`);
  }

  // ==================== DİNLEYİCİ İŞLEMLERİ ====================

  /**
   * Aktif yayınları listele
   */
  async getActiveStreams(tenantId: string): Promise<StreamResponseDto[]> {
    const streams = await this.prisma.liveStream.findMany({
      where: {
        tenantId,
        status: LiveStreamStatus.LIVE,
      },
      include: {
        host: { select: { id: true, name: true, avatarUrl: true } },
        _count: { select: { listeners: true, rooms: true } },
      },
      orderBy: { startedAt: 'desc' },
    });

    return streams.map((s) => ({
      ...this.formatStreamResponse(s, false),
      viewerCount: s._count.listeners,
      roomCount: s._count.rooms,
    })) as StreamResponseDto[];
  }

  /**
   * Planlanan yayınları listele
   */
  async getScheduledStreams(tenantId: string): Promise<StreamResponseDto[]> {
    const streams = await this.prisma.liveStream.findMany({
      where: {
        tenantId,
        status: LiveStreamStatus.SCHEDULED,
        scheduledAt: { gte: new Date() },
      },
      include: {
        host: { select: { id: true, name: true, avatarUrl: true } },
      },
      orderBy: { scheduledAt: 'asc' },
    });

    return streams.map((s) =>
      this.formatStreamResponse(s, false),
    ) as StreamResponseDto[];
  }

  /**
   * Yayın detayı
   */
  async getStream(
    streamId: string,
    userId?: string,
  ): Promise<StreamResponseDto | ActiveStreamResponseDto> {
    const stream = await this.prisma.liveStream.findUnique({
      where: { id: streamId },
      include: {
        host: { select: { id: true, name: true, avatarUrl: true } },
        _count: { select: { listeners: true, rooms: true } },
      },
    });

    if (!stream) {
      throw new NotFoundException('Yayın bulunamadı');
    }

    const isHost = userId === stream.hostId;

    return {
      ...this.formatStreamResponse(stream, isHost),
      viewerCount: stream._count.listeners,
      roomCount: stream._count.rooms,
    };
  }

  /**
   * Yayın istatistikleri (Host için)
   */
  async getStreamStats(
    streamId: string,
    hostId: string,
  ): Promise<StreamStatsDto> {
    const stream = await this.validateHostAccess(streamId, hostId);

    const rooms = await this.roomManager.getRooms(streamId);
    const viewerCount = rooms.reduce((sum, r) => sum + r.currentCount, 0);

    return {
      streamId,
      status: stream.status,
      viewerCount,
      peakViewers: stream.peakViewers,
      roomCount: rooms.length,
      rooms: rooms.map((r) => ({
        id: r.id,
        roomNumber: r.roomNumber,
        currentCount: r.currentCount,
        capacity: r.capacity,
      })),
      duration: stream.startedAt
        ? Math.floor((Date.now() - stream.startedAt.getTime()) / 1000)
        : 0,
      startedAt: stream.startedAt,
    };
  }

  // ==================== VOD İŞLEMLERİ ====================

  /**
   * Geçmiş yayınlar (VOD)
   */
  async getPastStreams(
    tenantId: string,
    hostId?: string,
    page = 1,
    limit = 20,
  ): Promise<{ streams: StreamResponseDto[]; total: number }> {
    const where: any = {
      tenantId,
      status: LiveStreamStatus.ENDED,
      recordingUrl: { not: null },
    };

    if (hostId) {
      where.hostId = hostId;
    }

    const [streams, total] = await Promise.all([
      this.prisma.liveStream.findMany({
        where,
        include: {
          host: { select: { id: true, name: true, avatarUrl: true } },
        },
        orderBy: { endedAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.liveStream.count({ where }),
    ]);

    return {
      streams: streams.map((s) =>
        this.formatStreamResponse(s, false),
      ) as StreamResponseDto[],
      total,
    };
  }

  /**
   * Host'un kendi yayınları
   */
  async getMyStreams(
    hostId: string,
    status?: LiveStreamStatus,
  ): Promise<StreamResponseDto[]> {
    const where: any = { hostId };

    if (status) {
      where.status = status;
    }

    const streams = await this.prisma.liveStream.findMany({
      where,
      include: {
        host: { select: { id: true, name: true, avatarUrl: true } },
        _count: { select: { listeners: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });

    return streams.map((s) => ({
      ...this.formatStreamResponse(s, true),
      viewerCount: s._count?.listeners || 0,
    })) as StreamResponseDto[];
  }

  // ==================== HELPER METHODS ====================

  private async validateHostAccess(streamId: string, hostId: string) {
    const stream = await this.prisma.liveStream.findUnique({
      where: { id: streamId },
    });

    if (!stream) {
      throw new NotFoundException('Yayın bulunamadı');
    }

    if (stream.hostId !== hostId) {
      throw new ForbiddenException('Bu işlem için yetkiniz yok');
    }

    return stream;
  }

  private formatStreamResponse(stream: any, includeStreamKey: boolean): any {
    const response: any = {
      id: stream.id,
      title: stream.title,
      description: stream.description,
      status: stream.status,
      host: stream.host
        ? {
            id: stream.host.id,
            name: stream.host.name,
            avatarUrl: stream.host.avatarUrl,
          }
        : null,
      hlsUrl: stream.hlsUrl,
      startedAt: stream.startedAt,
      endedAt: stream.endedAt,
      duration: stream.duration,
      recordingUrl: stream.recordingUrl,
      viewerCount: 0,
      roomCount: 0,
    };

    if (includeStreamKey) {
      response.streamKey = stream.streamKey;
    }

    return response;
  }
}
