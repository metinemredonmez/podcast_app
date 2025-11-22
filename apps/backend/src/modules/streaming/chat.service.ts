import { Injectable, Logger } from '@nestjs/common';

export interface ChatMessage {
  id: string;
  sessionId: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  content: string;
  type: 'message' | 'system' | 'reaction';
  timestamp: Date;
  metadata?: Record<string, unknown>;
}

export interface ChatRoom {
  sessionId: string;
  messages: ChatMessage[];
  participants: Set<string>;
  isModerated: boolean;
  slowMode: boolean;
  slowModeInterval: number;
  lastMessageTime: Map<string, Date>;
}

@Injectable()
export class ChatService {
  private readonly logger = new Logger(ChatService.name);
  private readonly rooms = new Map<string, ChatRoom>();
  private readonly maxMessagesPerRoom = 500;

  createRoom(sessionId: string, options?: { isModerated?: boolean; slowMode?: boolean; slowModeInterval?: number }) {
    if (this.rooms.has(sessionId)) {
      return this.rooms.get(sessionId)!;
    }

    const room: ChatRoom = {
      sessionId,
      messages: [],
      participants: new Set(),
      isModerated: options?.isModerated ?? false,
      slowMode: options?.slowMode ?? false,
      slowModeInterval: options?.slowModeInterval ?? 5,
      lastMessageTime: new Map(),
    };

    this.rooms.set(sessionId, room);
    this.logger.log(`Chat room created for session: ${sessionId}`);
    return room;
  }

  getRoom(sessionId: string): ChatRoom | undefined {
    return this.rooms.get(sessionId);
  }

  deleteRoom(sessionId: string): boolean {
    const deleted = this.rooms.delete(sessionId);
    if (deleted) {
      this.logger.log(`Chat room deleted for session: ${sessionId}`);
    }
    return deleted;
  }

  joinRoom(sessionId: string, userId: string): boolean {
    const room = this.rooms.get(sessionId);
    if (!room) {
      return false;
    }
    room.participants.add(userId);
    return true;
  }

  leaveRoom(sessionId: string, userId: string): boolean {
    const room = this.rooms.get(sessionId);
    if (!room) {
      return false;
    }
    room.participants.delete(userId);
    room.lastMessageTime.delete(userId);
    return true;
  }

  addMessage(
    sessionId: string,
    userId: string,
    userName: string,
    content: string,
    options?: { userAvatar?: string; type?: ChatMessage['type']; metadata?: Record<string, unknown> },
  ): ChatMessage | { error: string } {
    const room = this.rooms.get(sessionId);
    if (!room) {
      return { error: 'Room not found' };
    }

    if (room.slowMode && options?.type !== 'system') {
      const lastTime = room.lastMessageTime.get(userId);
      if (lastTime) {
        const diff = (Date.now() - lastTime.getTime()) / 1000;
        if (diff < room.slowModeInterval) {
          return { error: `Please wait ${Math.ceil(room.slowModeInterval - diff)} seconds` };
        }
      }
    }

    const message: ChatMessage = {
      id: `${sessionId}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      sessionId,
      userId,
      userName,
      userAvatar: options?.userAvatar,
      content,
      type: options?.type ?? 'message',
      timestamp: new Date(),
      metadata: options?.metadata,
    };

    room.messages.push(message);
    room.lastMessageTime.set(userId, message.timestamp);

    if (room.messages.length > this.maxMessagesPerRoom) {
      room.messages = room.messages.slice(-this.maxMessagesPerRoom);
    }

    return message;
  }

  getMessages(sessionId: string, limit = 50, before?: string): ChatMessage[] {
    const room = this.rooms.get(sessionId);
    if (!room) {
      return [];
    }

    let messages = room.messages;
    if (before) {
      const idx = messages.findIndex((m) => m.id === before);
      if (idx > 0) {
        messages = messages.slice(0, idx);
      }
    }

    return messages.slice(-limit);
  }

  getParticipants(sessionId: string): string[] {
    const room = this.rooms.get(sessionId);
    return room ? Array.from(room.participants) : [];
  }

  getParticipantCount(sessionId: string): number {
    const room = this.rooms.get(sessionId);
    return room ? room.participants.size : 0;
  }

  setSlowMode(sessionId: string, enabled: boolean, interval?: number): boolean {
    const room = this.rooms.get(sessionId);
    if (!room) {
      return false;
    }
    room.slowMode = enabled;
    if (interval !== undefined) {
      room.slowModeInterval = interval;
    }
    return true;
  }

  addSystemMessage(sessionId: string, content: string): ChatMessage | { error: string } {
    return this.addMessage(sessionId, 'system', 'System', content, { type: 'system' });
  }
}
