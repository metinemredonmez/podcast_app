import { Module, forwardRef } from '@nestjs/common';
import { NotificationsGateway } from './gateways/notifications.gateway';
import { ChatGateway } from './gateways/chat.gateway';
import { LiveStreamGateway } from './gateways/live-stream.gateway';
import { WsAuthGuard } from './guards/ws-auth.guard';
import { LiveStreamModule } from '../modules/live-stream/live-stream.module';

@Module({
  imports: [forwardRef(() => LiveStreamModule)],
  providers: [NotificationsGateway, ChatGateway, LiveStreamGateway, WsAuthGuard],
  exports: [NotificationsGateway, ChatGateway, LiveStreamGateway],
})
export class WsModule {}
