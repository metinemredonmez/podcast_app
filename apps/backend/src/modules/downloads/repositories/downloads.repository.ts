import { Download } from '@prisma/client';
import { CreateDownloadDto } from '../dto/create-download.dto';

export const DOWNLOADS_REPOSITORY = 'DOWNLOADS_REPOSITORY';

export interface IDownloadsRepository {
  findAll(userId: string): Promise<Download[]>;
  findById(id: string, userId: string): Promise<Download | null>;
  findByEpisodeId(userId: string, episodeId: string): Promise<Download | null>;
  create(userId: string, dto: CreateDownloadDto): Promise<Download>;
  updateStatus(id: string, status: string, downloadUrl?: string, fileSize?: bigint): Promise<Download>;
  delete(id: string, userId: string): Promise<void>;
}
