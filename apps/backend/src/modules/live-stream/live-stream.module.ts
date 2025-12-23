import { Module, forwardRef } from '@nestjs/common';
import { LiveStreamController } from './live-stream.controller';
import { LiveStreamService } from './live-stream.service';
import { RoomManagerService } from './services/room-manager.service';
import { HlsGeneratorService } from './services/hls-generator.service';
import { RecordingService } from './services/recording.service';
import { InfraModule } from '../../infra/infra.module';
import { WsModule } from '../../ws/ws.module';

@Module({
  imports: [InfraModule, forwardRef(() => WsModule)],
  controllers: [LiveStreamController],
  providers: [
    LiveStreamService,
    RoomManagerService,
    HlsGeneratorService,
    RecordingService,
  ],
  exports: [
    LiveStreamService,
    RoomManagerService,
    HlsGeneratorService,
    RecordingService,
  ],
})
export class LiveStreamModule {}
