import { Injectable, Inject, NotFoundException, BadRequestException } from '@nestjs/common';
import { IDownloadsRepository, DOWNLOADS_REPOSITORY } from './repositories/downloads.repository';
import { CreateDownloadDto } from './dto/create-download.dto';
import { DownloadResponseDto } from './dto/download-response.dto';
import { JwtPayload } from '../auth/interfaces/jwt-payload.interface';

@Injectable()
export class DownloadsService {
  constructor(
    @Inject(DOWNLOADS_REPOSITORY)
    private readonly repository: IDownloadsRepository,
  ) {}

  async findAll(user: JwtPayload): Promise<DownloadResponseDto[]> {
    const downloads = await this.repository.findAll(user.userId);
    return downloads as any;
  }

  async findOne(id: string, user: JwtPayload): Promise<DownloadResponseDto> {
    const download = await this.repository.findById(id, user.userId);

    if (!download) {
      throw new NotFoundException('Download not found');
    }

    return download as any;
  }

  async create(dto: CreateDownloadDto, user: JwtPayload): Promise<DownloadResponseDto> {
    const download = await this.repository.create(user.userId, dto);
    return download as any;
  }

  async remove(id: string, user: JwtPayload): Promise<void> {
    await this.repository.delete(id, user.userId);
  }

  async updateStatus(
    id: string,
    status: string,
    downloadUrl?: string,
    fileSize?: number,
  ): Promise<DownloadResponseDto> {
    const download = await this.repository.updateStatus(
      id,
      status,
      downloadUrl,
      fileSize ? BigInt(fileSize) : undefined,
    );
    return download as any;
  }
}
