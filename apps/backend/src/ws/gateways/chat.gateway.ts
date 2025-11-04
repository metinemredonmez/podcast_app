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
  namespace: '/chat',
})
export class ChatGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server: Server;

  private logger: Logger = new Logger('ChatGateway');

  afterInit(server: Server) {
    this.logger.log('WebSocket Chat Gateway initialized');
  }

  handleConnection(client: Socket) {
    this.logger.log(`Chat client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Chat client disconnected: ${client.id}`);
  }

  @SubscribeMessage('join-room')
  handleJoinRoom(
    @MessageBody() data: { roomId: string; userId: string; userName: string },
    @ConnectedSocket() client: Socket,
  ) {
    client.join(`room:${data.roomId}`);
    this.logger.log(`User ${data.userId} joined room ${data.roomId}`);

    this.server.to(`room:${data.roomId}`).emit('user-joined', {
      userId: data.userId,
      userName: data.userName,
      socketId: client.id,
      timestamp: new Date(),
    });
  }

  @SubscribeMessage('leave-room')
  handleLeaveRoom(
    @MessageBody() data: { roomId: string; userId: string; userName: string },
    @ConnectedSocket() client: Socket,
  ) {
    client.leave(`room:${data.roomId}`);
    this.logger.log(`User ${data.userId} left room ${data.roomId}`);

    this.server.to(`room:${data.roomId}`).emit('user-left', {
      userId: data.userId,
      userName: data.userName,
      timestamp: new Date(),
    });
  }

  @SubscribeMessage('send-message')
  handleSendMessage(
    @MessageBody()
    data: {
      roomId: string;
      message: string;
      userId: string;
      userName: string;
    },
    @ConnectedSocket() client: Socket,
  ) {
    this.server.to(`room:${data.roomId}`).emit('new-message', {
      userId: data.userId,
      userName: data.userName,
      message: data.message,
      timestamp: new Date(),
    });
  }

  @SubscribeMessage('typing')
  handleTyping(
    @MessageBody() data: { roomId: string; userId: string; userName: string },
    @ConnectedSocket() client: Socket,
  ) {
    client.to(`room:${data.roomId}`).emit('user-typing', {
      userId: data.userId,
      userName: data.userName,
    });
  }

  @SubscribeMessage('stop-typing')
  handleStopTyping(
    @MessageBody() data: { roomId: string; userId: string },
    @ConnectedSocket() client: Socket,
  ) {
    client.to(`room:${data.roomId}`).emit('user-stop-typing', {
      userId: data.userId,
    });
  }

  @SubscribeMessage('send-prayer')
  handleSendPrayer(
    @MessageBody()
    data: {
      roomId: string;
      prayer: string;
      userId: string;
      userName: string;
    },
    @ConnectedSocket() client: Socket,
  ) {
    this.server.to(`room:${data.roomId}`).emit('new-prayer', {
      userId: data.userId,
      userName: data.userName,
      prayer: data.prayer,
      timestamp: new Date(),
    });
  }
}
