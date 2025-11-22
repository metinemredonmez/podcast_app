import { Module } from '@nestjs/common';
import { StreamingController } from './streaming.controller';
import { StreamingService } from './streaming.service';
import { ChatService } from './chat.service';
import { RoomService } from './room.service';
import { WsModule } from '../../ws/ws.module';

@Module({
  imports: [WsModule],
  controllers: [StreamingController],
  providers: [StreamingService, ChatService, RoomService],
  exports: [StreamingService, ChatService, RoomService],
})
export class StreamingModule {}
