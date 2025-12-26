import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../../infra/prisma.service';

interface DeviceInfo {
  deviceType?: string;
  userAgent?: string;
  ipAddress?: string;
}

interface JoinRoomResult {
  roomId: string;
  roomNumber: number;
}

@Injectable()
export class RoomManagerService {
  private readonly logger = new Logger(RoomManagerService.name);
  private readonly ROOM_CAPACITY = 20;
  private readonly MAX_ROOMS = 10;

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Yeni oda oluştur
   */
  async createRoom(streamId: string, roomNumber: number) {
    return this.prisma.liveRoom.create({
      data: {
        streamId,
        roomNumber,
        name: `Oda ${roomNumber}`,
        capacity: this.ROOM_CAPACITY,
      },
    });
  }

  /**
   * Dinleyiciyi odaya ekle
   */
  async joinRoom(
    streamId: string,
    sessionId: string,
    userId?: string,
    deviceInfo?: DeviceInfo,
  ): Promise<JoinRoomResult> {
    // Önce bu session zaten kayıtlı mı kontrol et
    const existingListener = await this.prisma.liveListener.findUnique({
      where: { sessionId },
      include: { room: true },
    });

    if (existingListener) {
      return {
        roomId: existingListener.roomId,
        roomNumber: existingListener.room.roomNumber,
      };
    }

    // Uygun oda bul (boş yer olan)
    let room = await this.prisma.liveRoom.findFirst({
      where: {
        streamId,
        isActive: true,
        currentCount: { lt: this.ROOM_CAPACITY },
      },
      orderBy: { roomNumber: 'asc' },
    });

    // Boş oda yoksa yeni oda oluştur
    if (!room) {
      const lastRoom = await this.prisma.liveRoom.findFirst({
        where: { streamId },
        orderBy: { roomNumber: 'desc' },
      });

      const currentRoomCount = await this.getRoomCount(streamId);
      if (currentRoomCount >= this.MAX_ROOMS) {
        throw new Error('Tüm odalar dolu. Lütfen daha sonra tekrar deneyin.');
      }

      const newRoomNumber = (lastRoom?.roomNumber || 0) + 1;
      room = await this.createRoom(streamId, newRoomNumber);
      this.logger.log(
        `Yeni oda oluşturuldu: Oda ${newRoomNumber} (Stream: ${streamId})`,
      );
    }

    // Listener kaydı oluştur veya güncelle (upsert ile race condition önleme)
    await this.prisma.liveListener.upsert({
      where: { sessionId },
      create: {
        streamId,
        roomId: room.id,
        userId,
        sessionId,
        deviceType: deviceInfo?.deviceType,
        userAgent: deviceInfo?.userAgent,
        ipAddress: deviceInfo?.ipAddress,
      },
      update: {
        // Tekrar katılıyorsa leftAt'i temizle
        leftAt: null,
        joinedAt: new Date(),
      },
    });

    // Oda sayısını artır
    await this.prisma.liveRoom.update({
      where: { id: room.id },
      data: { currentCount: { increment: 1 } },
    });

    // Peak viewers güncelle
    await this.updatePeakViewers(streamId);

    // Total viewers güncelle
    await this.prisma.liveStream.update({
      where: { id: streamId },
      data: { totalViewers: { increment: 1 } },
    });

    this.logger.log(
      `Dinleyici katıldı: Oda ${room.roomNumber} (Session: ${sessionId})`,
    );

    return { roomId: room.id, roomNumber: room.roomNumber };
  }

  /**
   * Dinleyiciyi odadan çıkar
   */
  async leaveRoom(sessionId: string): Promise<void> {
    const listener = await this.prisma.liveListener.findUnique({
      where: { sessionId },
      include: { room: true },
    });

    if (!listener) return;

    // Zaten ayrılmışsa işlem yapma
    if (listener.leftAt) return;

    const leftAt = new Date();
    const duration = Math.floor(
      (leftAt.getTime() - listener.joinedAt.getTime()) / 1000,
    );

    // Listener kaydını güncelle
    await this.prisma.liveListener.update({
      where: { sessionId },
      data: { leftAt, duration },
    });

    // Oda sayısını azalt
    await this.prisma.liveRoom.update({
      where: { id: listener.roomId },
      data: {
        currentCount: {
          decrement: 1,
        },
      },
    });

    this.logger.log(
      `Dinleyici ayrıldı: Oda ${listener.room.roomNumber} (Session: ${sessionId})`,
    );
  }

  /**
   * Tüm odaları kapat
   */
  async closeAllRooms(streamId: string): Promise<void> {
    const now = new Date();

    // Aktif listener'ları kapat
    const activeListeners = await this.prisma.liveListener.findMany({
      where: { streamId, leftAt: null },
    });

    for (const listener of activeListeners) {
      const duration = Math.floor(
        (now.getTime() - listener.joinedAt.getTime()) / 1000,
      );
      await this.prisma.liveListener.update({
        where: { id: listener.id },
        data: { leftAt: now, duration },
      });
    }

    // Odaları deaktif et
    await this.prisma.liveRoom.updateMany({
      where: { streamId },
      data: { isActive: false, currentCount: 0 },
    });

    this.logger.log(`Tüm odalar kapatıldı (Stream: ${streamId})`);
  }

  /**
   * Peak viewers güncelle
   */
  private async updatePeakViewers(streamId: string): Promise<void> {
    const currentCount = await this.prisma.liveListener.count({
      where: { streamId, leftAt: null },
    });

    await this.prisma.liveStream.updateMany({
      where: {
        id: streamId,
        peakViewers: { lt: currentCount },
      },
      data: { peakViewers: currentCount },
    });
  }

  /**
   * Anlık dinleyici sayısı
   */
  async getViewerCount(streamId: string): Promise<number> {
    return this.prisma.liveListener.count({
      where: { streamId, leftAt: null },
    });
  }

  /**
   * Oda listesi
   */
  async getRooms(streamId: string) {
    return this.prisma.liveRoom.findMany({
      where: { streamId, isActive: true },
      orderBy: { roomNumber: 'asc' },
    });
  }

  /**
   * Oda sayısı
   */
  async getRoomCount(streamId: string): Promise<number> {
    return this.prisma.liveRoom.count({
      where: { streamId, isActive: true },
    });
  }

  /**
   * İstatistik snapshot kaydet
   */
  async saveStatsSnapshot(streamId: string): Promise<void> {
    const viewerCount = await this.getViewerCount(streamId);
    const roomCount = await this.getRoomCount(streamId);

    await this.prisma.liveStreamStats.create({
      data: {
        streamId,
        viewerCount,
        roomCount,
      },
    });
  }
}
