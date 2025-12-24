import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { PhoneAuthController } from './phone-auth.controller';
import { SmsConfigController } from './sms-config.controller';
import { HocaApplicationController } from './hoca-application.controller';
import { PhoneAuthService } from './phone-auth.service';
import { SmsConfigService } from './sms-config.service';
import { HocaApplicationService } from './hoca-application.service';
import { NetGsmService } from './providers/netgsm.service';
import { TwilioService } from './providers/twilio.service';
import { PrismaService } from '../../infra/prisma.service';
import { EncryptionModule } from '../../common/encryption';

@Module({
  imports: [
    HttpModule.register({
      timeout: 30000,
      maxRedirects: 5,
    }),
    EncryptionModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        secret: configService.get('JWT_SECRET'),
        signOptions: {
          expiresIn: configService.get('JWT_ACCESS_EXPIRY', '15m'),
        },
      }),
      inject: [ConfigService],
    }),
  ],
  controllers: [PhoneAuthController, SmsConfigController, HocaApplicationController],
  providers: [
    PhoneAuthService,
    SmsConfigService,
    HocaApplicationService,
    NetGsmService,
    TwilioService,
    PrismaService,
  ],
  exports: [PhoneAuthService, SmsConfigService, HocaApplicationService, NetGsmService, TwilioService],
})
export class SmsModule {}
