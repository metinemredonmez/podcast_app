export interface WsEvent {
  event: string;
  data: any;
  timestamp?: Date;
}

export interface NotificationPayload {
  userId?: string;
  tenantId?: string;
  type: 'info' | 'warning' | 'error' | 'success' | 'prayer';
  title: string;
  message: string;
  data?: any;
}

export interface ChatMessage {
  userId: string;
  userName: string;
  message: string;
  roomId: string;
  timestamp: Date;
}

export interface LiveSession {
  sessionId: string;
  title: string;
  broadcasterId: string;
  viewerCount: number;
  status: 'waiting' | 'live' | 'ended';
}
