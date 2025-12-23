import { Module } from '@nestjs/common';
import { EmailConfigController } from './email-config.controller';
import { EmailConfigService } from './email-config.service';
import { PrismaService } from '../../infra/prisma.service';
import { EncryptionModule } from '../../common/encryption';

@Module({
  imports: [EncryptionModule],
  controllers: [EmailConfigController],
  providers: [EmailConfigService, PrismaService],
  exports: [EmailConfigService],
})
export class EmailModule {}
