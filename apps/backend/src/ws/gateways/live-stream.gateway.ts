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
import { Logger, UseGuards } from '@nestjs/common';
import { Server, Socket } from 'socket.io';
import { WsAuthGuard } from '../guards/ws-auth.guard';
import { StreamingSession } from '@prisma/client';

const allowedOrigins = (process.env.CORS_ORIGINS ?? '')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

@UseGuards(WsAuthGuard)
@WebSocketGateway({
  cors: {
    origin: allowedOrigins.length ? allowedOrigins : ['http://localhost:5175', 'http://localhost:19005'],
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

  afterInit(server: Server) {
    this.logger.log('WebSocket Live Stream Gateway initialized');
  }

  handleConnection(client: Socket) {
    this.logger.log(`Live client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Live client disconnected: ${client.id}`);
  }

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

    this.server.to(`tenant:${session.tenantId}`).emit('live-session-status', payload);
    this.server.to(`live:${session.id}`).emit('live-session-status', payload);
  }

  emitViewerCount(sessionId: string, viewerCount: number) {
    this.server.to(`live:${sessionId}`).emit('viewer-count', viewerCount);
  }

  @SubscribeMessage('join-live-session')
  handleJoinLiveSession(
    @MessageBody() data: { sessionId: string; userId: string },
    @ConnectedSocket() client: Socket,
  ) {
    client.join(`live:${data.sessionId}`);
    this.logger.log(`User ${data.userId} joined live session ${data.sessionId}`);

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
    @ConnectedSocket() client: Socket,
  ) {
    this.server.to(`live:${data.sessionId}`).emit('broadcast-started', {
      sessionId: data.sessionId,
      title: data.title,
      timestamp: new Date(),
    });
  }

  @SubscribeMessage('end-broadcast')
  handleEndBroadcast(
    @MessageBody() data: { sessionId: string },
    @ConnectedSocket() client: Socket,
  ) {
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
    @ConnectedSocket() client: Socket,
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
