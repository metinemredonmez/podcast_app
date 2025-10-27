import { Logger } from '@nestjs/common';
import { WebSocketGateway, WebSocketServer } from '@nestjs/websockets';
import { Server } from 'socket.io';

@WebSocketGateway()
export class NotificationsGateway {
  private readonly logger = new Logger(NotificationsGateway.name);
  @WebSocketServer()
  server!: Server;

  sendNotification(payload: unknown): void {
    this.logger.debug(payload);
    this.server.emit('notification', payload);
  }
}
