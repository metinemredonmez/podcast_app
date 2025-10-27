import { Module } from '@nestjs/common';
import { NotificationsGateway } from './gateways/notifications.gateway';
import { StreamingGateway } from './gateways/streaming.gateway';
import { ChatGateway } from './gateways/chat.gateway';
import { GatewayAdapter } from './gateway.adapter';
import { WsAuthGuard } from './guards/ws-auth.guard';

@Module({
  providers: [GatewayAdapter, NotificationsGateway, StreamingGateway, ChatGateway, WsAuthGuard],
  exports: [GatewayAdapter],
})
export class WsModule {}
