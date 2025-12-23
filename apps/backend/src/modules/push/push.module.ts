import { Module } from '@nestjs/common';
import { PushController } from './push.controller';
import { PushService } from './push.service';
import { OneSignalProvider, FirebaseProvider, WebPushProvider } from './providers';

@Module({
  controllers: [PushController],
  providers: [
    PushService,
    OneSignalProvider,
    FirebaseProvider,
    WebPushProvider,
  ],
  exports: [PushService],
})
export class PushModule {}
