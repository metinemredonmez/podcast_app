import { Module } from '@nestjs/common';
import { NotificationsGateway } from './gateways/notifications.gateway';
import { ChatGateway } from './gateways/chat.gateway';
import { LiveStreamGateway } from './gateways/live-stream.gateway';
import { WsAuthGuard } from './guards/ws-auth.guard';

@Module({
  providers: [NotificationsGateway, ChatGateway, LiveStreamGateway, WsAuthGuard],
  exports: [NotificationsGateway, ChatGateway, LiveStreamGateway],
})
export class WsModule {}
