import { Logger } from '@nestjs/common';
import { WebSocketGateway, WebSocketServer } from '@nestjs/websockets';
import { Server } from 'socket.io';

@WebSocketGateway({ namespace: 'streaming' })
export class StreamingGateway {
  private readonly logger = new Logger(StreamingGateway.name);
  @WebSocketServer()
  server!: Server;

  startStream(roomId: string): void {
    this.logger.log(`Stream started: ${roomId}`);
    this.server.to(roomId).emit('stream-started', { roomId });
  }
}
