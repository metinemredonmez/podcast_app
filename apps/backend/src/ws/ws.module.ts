import { Module } from '@nestjs/common';
import { NotificationsGateway } from './gateways/notifications.gateway';
import { ChatGateway } from './gateways/chat.gateway';
import { LiveStreamGateway } from './gateways/live-stream.gateway';

@Module({
  providers: [NotificationsGateway, ChatGateway, LiveStreamGateway],
  exports: [NotificationsGateway, ChatGateway, LiveStreamGateway],
})
export class WsModule {}
