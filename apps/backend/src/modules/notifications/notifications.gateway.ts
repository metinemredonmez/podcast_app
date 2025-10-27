import { Logger } from '@nestjs/common';
import { WebSocketGateway } from '@nestjs/websockets';
import { NotificationsService } from './notifications.service';

@WebSocketGateway({ namespace: 'notifications' })
export class NotificationsGateway {
  private readonly logger = new Logger(NotificationsGateway.name);

  constructor(private readonly notificationsService: NotificationsService) {}

  async dispatch(payload: unknown): Promise<void> {
    this.logger.debug(payload);
    await this.notificationsService.send(payload);
  }
}
