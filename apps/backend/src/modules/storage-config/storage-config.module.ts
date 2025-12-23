import { Module } from '@nestjs/common';
import { StorageConfigController } from './storage-config.controller';
import { StorageConfigService } from './storage-config.service';
import { PrismaService } from '../../infra/prisma.service';
import { EncryptionModule } from '../../common/encryption';

@Module({
  imports: [EncryptionModule],
  controllers: [StorageConfigController],
  providers: [StorageConfigService, PrismaService],
  exports: [StorageConfigService],
})
export class StorageConfigModule {}
