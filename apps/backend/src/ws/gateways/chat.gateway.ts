import { Logger } from '@nestjs/common';
import { MessageBody, SubscribeMessage, WebSocketGateway } from '@nestjs/websockets';

@WebSocketGateway({ namespace: 'chat' })
export class ChatGateway {
  private readonly logger = new Logger(ChatGateway.name);

  @SubscribeMessage('message')
  handleMessage(@MessageBody() payload: { roomId: string; message: string }): void {
    this.logger.debug(payload);
  }
}
