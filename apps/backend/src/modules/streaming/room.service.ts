import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../infra/prisma.service';
import { ChatService } from './chat.service';

export interface RoomParticipant {
  userId: string;
  userName: string;
  userAvatar?: string;
  role: 'host' | 'co-host' | 'viewer';
  joinedAt: Date;
  isMuted: boolean;
  hasVideo: boolean;
}

export interface StreamRoom {
  sessionId: string;
  hostId: string;
  participants: Map<string, RoomParticipant>;
  isLive: boolean;
  startedAt?: Date;
  settings: {
    allowChat: boolean;
    allowReactions: boolean;
    maxParticipants: number;
  };
}

@Injectable()
export class RoomService {
  private readonly logger = new Logger(RoomService.name);
  private readonly rooms = new Map<string, StreamRoom>();

  constructor(
    private readonly prisma: PrismaService,
    private readonly chatService: ChatService,
  ) {}

  async createRoom(sessionId: string, hostId: string, settings?: Partial<StreamRoom['settings']>): Promise<StreamRoom> {
    if (this.rooms.has(sessionId)) {
      return this.rooms.get(sessionId)!;
    }

    const room: StreamRoom = {
      sessionId,
      hostId,
      participants: new Map(),
      isLive: false,
      settings: {
        allowChat: settings?.allowChat ?? true,
        allowReactions: settings?.allowReactions ?? true,
        maxParticipants: settings?.maxParticipants ?? 1000,
      },
    };

    this.rooms.set(sessionId, room);
    this.chatService.createRoom(sessionId);
    this.logger.log(`Stream room created: ${sessionId}`);

    return room;
  }

  getRoom(sessionId: string): StreamRoom | undefined {
    return this.rooms.get(sessionId);
  }

  async deleteRoom(sessionId: string): Promise<boolean> {
    const room = this.rooms.get(sessionId);
    if (!room) {
      return false;
    }

    this.chatService.deleteRoom(sessionId);
    this.rooms.delete(sessionId);
    this.logger.log(`Stream room deleted: ${sessionId}`);

    return true;
  }

  async joinRoom(
    sessionId: string,
    userId: string,
    userName: string,
    userAvatar?: string,
  ): Promise<{ success: boolean; error?: string }> {
    const room = this.rooms.get(sessionId);
    if (!room) {
      return { success: false, error: 'Room not found' };
    }

    if (room.participants.size >= room.settings.maxParticipants) {
      return { success: false, error: 'Room is full' };
    }

    const isHost = userId === room.hostId;
    const participant: RoomParticipant = {
      userId,
      userName,
      userAvatar,
      role: isHost ? 'host' : 'viewer',
      joinedAt: new Date(),
      isMuted: !isHost,
      hasVideo: isHost,
    };

    room.participants.set(userId, participant);
    this.chatService.joinRoom(sessionId, userId);

    // Update viewer count in DB
    await this.updateViewerCount(sessionId, room.participants.size);

    this.logger.log(`User ${userId} joined room ${sessionId}`);
    return { success: true };
  }

  async leaveRoom(sessionId: string, userId: string): Promise<boolean> {
    const room = this.rooms.get(sessionId);
    if (!room) {
      return false;
    }

    room.participants.delete(userId);
    this.chatService.leaveRoom(sessionId, userId);

    await this.updateViewerCount(sessionId, room.participants.size);

    this.logger.log(`User ${userId} left room ${sessionId}`);
    return true;
  }

  async startStream(sessionId: string, hostId: string): Promise<{ success: boolean; error?: string }> {
    const room = this.rooms.get(sessionId);
    if (!room) {
      return { success: false, error: 'Room not found' };
    }

    if (room.hostId !== hostId) {
      return { success: false, error: 'Only the host can start the stream' };
    }

    room.isLive = true;
    room.startedAt = new Date();

    await this.prisma.streamingSession.update({
      where: { id: sessionId },
      data: { status: 'LIVE', startedAt: room.startedAt },
    });

    this.chatService.addSystemMessage(sessionId, 'Stream has started!');
    this.logger.log(`Stream started: ${sessionId}`);

    return { success: true };
  }

  async endStream(sessionId: string, hostId: string): Promise<{ success: boolean; error?: string }> {
    const room = this.rooms.get(sessionId);
    if (!room) {
      return { success: false, error: 'Room not found' };
    }

    if (room.hostId !== hostId) {
      return { success: false, error: 'Only the host can end the stream' };
    }

    room.isLive = false;
    const endedAt = new Date();

    await this.prisma.streamingSession.update({
      where: { id: sessionId },
      data: { status: 'ENDED', endedAt },
    });

    this.chatService.addSystemMessage(sessionId, 'Stream has ended. Thank you for watching!');
    this.logger.log(`Stream ended: ${sessionId}`);

    return { success: true };
  }

  getParticipants(sessionId: string): RoomParticipant[] {
    const room = this.rooms.get(sessionId);
    return room ? Array.from(room.participants.values()) : [];
  }

  getViewerCount(sessionId: string): number {
    const room = this.rooms.get(sessionId);
    return room ? room.participants.size : 0;
  }

  async promoteToCoHost(sessionId: string, hostId: string, userId: string): Promise<boolean> {
    const room = this.rooms.get(sessionId);
    if (!room || room.hostId !== hostId) {
      return false;
    }

    const participant = room.participants.get(userId);
    if (!participant) {
      return false;
    }

    participant.role = 'co-host';
    participant.isMuted = false;
    participant.hasVideo = true;

    return true;
  }

  async demoteFromCoHost(sessionId: string, hostId: string, userId: string): Promise<boolean> {
    const room = this.rooms.get(sessionId);
    if (!room || room.hostId !== hostId) {
      return false;
    }

    const participant = room.participants.get(userId);
    if (!participant || participant.role === 'host') {
      return false;
    }

    participant.role = 'viewer';
    participant.isMuted = true;
    participant.hasVideo = false;

    return true;
  }

  private async updateViewerCount(sessionId: string, count: number): Promise<void> {
    try {
      await this.prisma.streamingSession.update({
        where: { id: sessionId },
        data: { viewerCount: count },
      });
    } catch (error) {
      this.logger.error(`Failed to update viewer count for session ${sessionId}`, error);
    }
  }
}
