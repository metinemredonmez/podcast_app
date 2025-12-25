import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayInit,
  OnGatewayConnection,
  OnGatewayDisconnect,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Logger, UseGuards, Inject, forwardRef } from '@nestjs/common';
import { Server, Socket } from 'socket.io';
import { WsAuthGuard } from '../guards/ws-auth.guard';
import { StreamingSession, LiveStreamStatus } from '@prisma/client';
import { RoomManagerService } from '../../modules/live-stream/services/room-manager.service';
import { LiveStreamService } from '../../modules/live-stream/live-stream.service';
import { HlsGeneratorService } from '../../modules/live-stream/services/hls-generator.service';

const allowedOrigins = (process.env.CORS_ORIGINS ?? '')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

@WebSocketGateway({
  cors: {
    origin: allowedOrigins.length
      ? allowedOrigins
      : ['http://localhost:5175', 'http://localhost:19005'],
    credentials: true,
  },
  namespace: '/live',
})
export class LiveStreamGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server: Server;

  private logger: Logger = new Logger('LiveStreamGateway');
  private statsIntervals: Map<string, NodeJS.Timeout> = new Map();

  constructor(
    @Inject(forwardRef(() => RoomManagerService))
    private readonly roomManager: RoomManagerService,
    @Inject(forwardRef(() => LiveStreamService))
    private readonly streamService: LiveStreamService,
    @Inject(forwardRef(() => HlsGeneratorService))
    private readonly hlsGenerator: HlsGeneratorService,
  ) {}

  afterInit() {
    this.logger.log('WebSocket Live Stream Gateway initialized');
  }

  handleConnection(client: Socket) {
    this.logger.log(`Live client connected: ${client.id}`);
  }

  async handleDisconnect(client: Socket) {
    this.logger.log(`Live client disconnected: ${client.id}`);

    // Dinleyiciyi odadan çıkar
    const streamId = client.data?.streamId;
    if (streamId) {
      await this.roomManager.leaveRoom(client.id);

      // Viewer count güncelle
      const viewerCount = await this.roomManager.getViewerCount(streamId);
      this.server.to(`stream:${streamId}`).emit('viewer-count', { viewerCount });
    }
  }

  // ==================== LEGACY EVENTS (Eski StreamingSession için) ====================

  emitSessionStarted(session: StreamingSession) {
    this.server
      .to(`tenant:${session.tenantId}`)
      .emit('live-session-started', session);
    this.server.to(`live:${session.id}`).emit('live-session-started', session);
  }

  emitSessionEnded(session: StreamingSession) {
    this.server
      .to(`tenant:${session.tenantId}`)
      .emit('live-session-ended', session);
    this.server.to(`live:${session.id}`).emit('live-session-ended', session);
  }

  emitSessionStatusChanged(session: StreamingSession) {
    const payload = {
      id: session.id,
      tenantId: session.tenantId,
      status: session.status,
      startedAt: session.startedAt,
      endedAt: session.endedAt,
    };

    this.server
      .to(`tenant:${session.tenantId}`)
      .emit('live-session-status', payload);
    this.server.to(`live:${session.id}`).emit('live-session-status', payload);
  }

  emitViewerCount(sessionId: string, viewerCount: number) {
    this.server.to(`live:${sessionId}`).emit('viewer-count', viewerCount);
  }

  // ==================== YENİ LIVE STREAM EVENTS ====================

  /**
   * Dinleyici yayına katılır
   */
  @SubscribeMessage('join-stream')
  async handleJoinStream(
    @ConnectedSocket() client: Socket,
    @MessageBody()
    data: { streamId: string; userId?: string; deviceType?: string },
  ) {
    try {
      const stream = await this.streamService.getStream(data.streamId);

      if (stream.status !== LiveStreamStatus.LIVE) {
        return { success: false, error: 'Yayın canlı değil' };
      }

      // Odaya ekle
      const { roomId, roomNumber } = await this.roomManager.joinRoom(
        data.streamId,
        client.id,
        data.userId,
        {
          deviceType: data.deviceType,
          userAgent: client.handshake.headers['user-agent'] as string,
          ipAddress:
            (client.handshake.headers['x-forwarded-for'] as string) ||
            client.handshake.address,
        },
      );

      const room = await this.roomManager.getRooms(data.streamId);
      const joinedRoom = room.find((r) => r.id === roomId);

      // Socket room'a katıl
      client.join(`stream:${data.streamId}`);
      client.join(`room:${roomId}`);
      client.data.streamId = data.streamId;
      client.data.roomId = roomId;

      // Viewer count güncelle
      const viewerCount = await this.roomManager.getViewerCount(data.streamId);
      this.server
        .to(`stream:${data.streamId}`)
        .emit('viewer-count', { viewerCount });

      this.logger.log(
        `User joined stream ${data.streamId}, Room ${roomNumber}`,
      );

      return {
        success: true,
        streamId: data.streamId,
        roomId,
        roomNumber,
        hlsUrl: stream.hlsUrl,
        viewerCount,
        roomCapacity: joinedRoom?.capacity ?? 20,
        roomCurrentCount: joinedRoom?.currentCount ?? 0,
      };
    } catch (error: any) {
      this.logger.error(`Join stream error: ${error.message}`);
      return { success: false, error: error.message };
    }
  }

  /**
   * Dinleyici yayından ayrılır
   */
  @SubscribeMessage('leave-stream')
  async handleLeaveStream(@ConnectedSocket() client: Socket) {
    const streamId = client.data?.streamId;
    const roomId = client.data?.roomId;

    if (streamId) {
      client.leave(`stream:${streamId}`);
    }
    if (roomId) {
      client.leave(`room:${roomId}`);
    }

    await this.roomManager.leaveRoom(client.id);

    if (streamId) {
      const viewerCount = await this.roomManager.getViewerCount(streamId);
      this.server.to(`stream:${streamId}`).emit('viewer-count', { viewerCount });
    }

    return { success: true };
  }

  /**
   * Hoca yayın odasına katılır
   */
  @UseGuards(WsAuthGuard)
  @SubscribeMessage('host-join')
  async handleHostJoin(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { streamId: string },
  ) {
    const userId = client.data?.user?.sub;

    if (!userId) {
      return { success: false, error: 'Kimlik doğrulama gerekli' };
    }

    try {
      const stream = await this.streamService.getStream(data.streamId, userId);

      if (stream.host?.id !== userId) {
        return { success: false, error: 'Yetkiniz yok' };
      }

      client.join(`stream:${data.streamId}`);
      client.join(`host:${data.streamId}`);
      client.data.streamId = data.streamId;
      client.data.isHost = true;

      // Host için periyodik istatistik gönder
      this.startStatsInterval(data.streamId);

      this.logger.log(`Host joined stream ${data.streamId}`);

      return {
        success: true,
        streamKey: (stream as any).streamKey,
      };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Hoca yayından ayrılır
   */
  @UseGuards(WsAuthGuard)
  @SubscribeMessage('host-leave')
  async handleHostLeave(@ConnectedSocket() client: Socket) {
    const streamId = client.data?.streamId;

    if (streamId) {
      client.leave(`stream:${streamId}`);
      client.leave(`host:${streamId}`);
      this.stopStatsInterval(streamId);
    }

    return { success: true };
  }

  /**
   * Ses verisi gönder (Hoca → Server → HLS)
   */
  @UseGuards(WsAuthGuard)
  @SubscribeMessage('audio-data')
  async handleAudioData(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { streamId: string; audioBuffer: ArrayBuffer },
  ) {
    if (!client.data?.isHost) {
      return { success: false, error: 'Sadece host ses gönderebilir' };
    }

    try {
      const buffer = Buffer.from(data.audioBuffer);
      await this.hlsGenerator.writeAudioData(data.streamId, buffer);
      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Yayın durumu değişikliği bildir
   */
  @UseGuards(WsAuthGuard)
  @SubscribeMessage('stream-status')
  async handleStreamStatus(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { streamId: string; status: string },
  ) {
    if (!client.data?.isHost) {
      return { success: false, error: 'Yetkiniz yok' };
    }

    // Tüm dinleyicilere bildir
    this.server.to(`stream:${data.streamId}`).emit('stream-status-changed', {
      streamId: data.streamId,
      status: data.status,
    });

    return { success: true };
  }

  // ==================== UTILITY METHODS ====================

  /**
   * Tüm dinleyicilere yayın durumu bildir
   */
  broadcastStreamStatus(streamId: string, status: LiveStreamStatus) {
    this.server.to(`stream:${streamId}`).emit('stream-status-changed', {
      streamId,
      status,
    });
  }

  /**
   * Host'a istatistik gönder (her 5 saniye)
   */
  private startStatsInterval(streamId: string) {
    // Var olan interval'ı temizle
    this.stopStatsInterval(streamId);

    const interval = setInterval(async () => {
      try {
        const viewerCount = await this.roomManager.getViewerCount(streamId);
        const rooms = await this.roomManager.getRooms(streamId);

        this.server.to(`host:${streamId}`).emit('stream-stats', {
          viewerCount,
          roomCount: rooms.length,
          rooms: rooms.map((r) => ({
            roomNumber: r.roomNumber,
            currentCount: r.currentCount,
            capacity: r.capacity,
          })),
        });

        // İstatistik snapshot kaydet (her dakika)
        if (Date.now() % 60000 < 5000) {
          await this.roomManager.saveStatsSnapshot(streamId);
        }
      } catch (error) {
        this.logger.error(`Stats interval error: ${error}`);
      }
    }, 5000);

    this.statsIntervals.set(streamId, interval);
  }

  private stopStatsInterval(streamId: string) {
    const interval = this.statsIntervals.get(streamId);
    if (interval) {
      clearInterval(interval);
      this.statsIntervals.delete(streamId);
    }
  }

  // ==================== LEGACY EVENTS (Eski destek) ====================

  @SubscribeMessage('join-live-session')
  handleJoinLiveSession(
    @MessageBody() data: { sessionId: string; userId: string },
    @ConnectedSocket() client: Socket,
  ) {
    client.join(`live:${data.sessionId}`);
    this.logger.log(
      `User ${data.userId} joined live session ${data.sessionId}`,
    );

    const room = this.server.sockets.adapter.rooms.get(`live:${data.sessionId}`);
    const viewerCount = room ? room.size : 0;
    this.emitViewerCount(data.sessionId, viewerCount);
  }

  @SubscribeMessage('leave-live-session')
  handleLeaveLiveSession(
    @MessageBody() data: { sessionId: string; userId: string },
    @ConnectedSocket() client: Socket,
  ) {
    client.leave(`live:${data.sessionId}`);

    const room = this.server.sockets.adapter.rooms.get(`live:${data.sessionId}`);
    const viewerCount = room ? room.size : 0;
    this.emitViewerCount(data.sessionId, viewerCount);
  }

  @SubscribeMessage('start-broadcast')
  handleStartBroadcast(
    @MessageBody() data: { sessionId: string; title: string },
  ) {
    this.server.to(`live:${data.sessionId}`).emit('broadcast-started', {
      sessionId: data.sessionId,
      title: data.title,
      timestamp: new Date(),
    });
  }

  @SubscribeMessage('end-broadcast')
  handleEndBroadcast(@MessageBody() data: { sessionId: string }) {
    this.server.to(`live:${data.sessionId}`).emit('broadcast-ended', {
      sessionId: data.sessionId,
      timestamp: new Date(),
    });
  }

  @SubscribeMessage('ask-question')
  handleAskQuestion(
    @MessageBody()
    data: {
      sessionId: string;
      question: string;
      userId: string;
      userName: string;
    },
  ) {
    this.server.to(`live:${data.sessionId}:broadcaster`).emit('new-question', {
      userId: data.userId,
      userName: data.userName,
      question: data.question,
      timestamp: new Date(),
    });
  }

  @SubscribeMessage('webrtc-offer')
  handleWebRTCOffer(
    @MessageBody() data: { sessionId: string; offer: any; targetId: string },
    @ConnectedSocket() client: Socket,
  ) {
    client.to(data.targetId).emit('webrtc-offer', {
      offer: data.offer,
      senderId: client.id,
    });
  }

  @SubscribeMessage('webrtc-answer')
  handleWebRTCAnswer(
    @MessageBody() data: { sessionId: string; answer: any; targetId: string },
    @ConnectedSocket() client: Socket,
  ) {
    client.to(data.targetId).emit('webrtc-answer', {
      answer: data.answer,
      senderId: client.id,
    });
  }

  @SubscribeMessage('webrtc-candidate')
  handleWebRTCCandidate(
    @MessageBody() data: { sessionId: string; candidate: any; targetId: string },
    @ConnectedSocket() client: Socket,
  ) {
    client.to(data.targetId).emit('webrtc-candidate', {
      candidate: data.candidate,
      senderId: client.id,
    });
  }
}
