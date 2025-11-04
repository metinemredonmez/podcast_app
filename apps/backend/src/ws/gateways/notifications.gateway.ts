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
import { Notification } from '@prisma/client';

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
  namespace: '/notifications',
})
export class NotificationsGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server: Server;

  private logger: Logger = new Logger('NotificationsGateway');

  afterInit(server: Server) {
    this.logger.log('WebSocket Notifications Gateway initialized');
  }

  handleConnection(client: Socket) {
    this.logger.log(`Client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected: ${client.id}`);
  }

  notifyNewEpisode(tenantId: string, episode: any) {
    this.server.to(`tenant:${tenantId}`).emit('new-episode', episode);
  }

  notifyPrayerTime(userId: string, prayerTime: any) {
    this.server.to(`user:${userId}`).emit('prayer-time', prayerTime);
  }

  notifyLiveSession(tenantId: string, session: any) {
    this.server.to(`tenant:${tenantId}`).emit('live-session-starting', session);
  }

  emitNotification(notification: Notification) {
    this.server
      .to(`user:${notification.userId}`)
      .emit('notification', notification);
    this.server
      .to(`tenant:${notification.tenantId}`)
      .emit('notification', notification);
  }

  @SubscribeMessage('subscribe-tenant')
  handleSubscribeTenant(
    @MessageBody() data: { tenantId: string },
    @ConnectedSocket() client: Socket,
  ) {
    client.join(`tenant:${data.tenantId}`);
    return { event: 'subscribed', data: { room: `tenant:${data.tenantId}` } };
  }

  @SubscribeMessage('subscribe-user')
  handleSubscribeUser(
    @MessageBody() data: { userId: string },
    @ConnectedSocket() client: Socket,
  ) {
    client.join(`user:${data.userId}`);
    return { event: 'subscribed', data: { room: `user:${data.userId}` } };
  }

  @SubscribeMessage('unsubscribe-tenant')
  handleUnsubscribeTenant(
    @MessageBody() data: { tenantId: string },
    @ConnectedSocket() client: Socket,
  ) {
    client.leave(`tenant:${data.tenantId}`);
    return { event: 'unsubscribed', data: { room: `tenant:${data.tenantId}` } };
  }

  @SubscribeMessage('unsubscribe-user')
  handleUnsubscribeUser(
    @MessageBody() data: { userId: string },
    @ConnectedSocket() client: Socket,
  ) {
    client.leave(`user:${data.userId}`);
    return { event: 'unsubscribed', data: { room: `user:${data.userId}` } };
  }
}
