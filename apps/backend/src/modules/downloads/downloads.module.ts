import { Module } from '@nestjs/common';
import { DownloadsController } from './downloads.controller';
import { DownloadsService } from './downloads.service';
import { DOWNLOADS_REPOSITORY } from './repositories/downloads.repository';
import { DownloadsPrismaRepository } from './repositories/downloads.prisma.repository';

@Module({
  controllers: [DownloadsController],
  providers: [
    DownloadsService,
    {
      provide: DOWNLOADS_REPOSITORY,
      useClass: DownloadsPrismaRepository,
    },
  ],
  exports: [DownloadsService],
})
export class DownloadsModule {}
