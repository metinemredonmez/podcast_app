import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { GoogleAuthController } from './google-auth.controller';
import { SocialAuthConfigController } from './social-auth-config.controller';
import { GoogleAuthService } from './google-auth.service';
import { SocialAuthConfigService } from './social-auth-config.service';
import { PrismaService } from '../../infra/prisma.service';
import { EncryptionModule } from '../../common/encryption';

@Module({
  imports: [
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
  controllers: [GoogleAuthController, SocialAuthConfigController],
  providers: [GoogleAuthService, SocialAuthConfigService, PrismaService],
  exports: [GoogleAuthService, SocialAuthConfigService],
})
export class SocialAuthModule {}
