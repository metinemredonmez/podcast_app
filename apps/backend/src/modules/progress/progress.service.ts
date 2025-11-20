import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { plainToInstance } from 'class-transformer';
import { PROGRESS_REPOSITORY, ProgressRepository } from './repositories/progress.repository';
import { ProgressResponseDto } from './dto/progress-response.dto';
import { UpdateProgressDto } from './dto/update-progress.dto';
import { JwtPayload } from '../auth/interfaces/jwt-payload.interface';

@Injectable()
export class ProgressService {
  constructor(@Inject(PROGRESS_REPOSITORY) private readonly progressRepository: ProgressRepository) {}

  async findAll(actor: JwtPayload): Promise<ProgressResponseDto[]> {
    const progresses = await this.progressRepository.findByUserId(actor.userId, actor.tenantId);
    return progresses.map((progress) => plainToInstance(ProgressResponseDto, progress));
  }

  async findOne(episodeId: string, actor: JwtPayload): Promise<ProgressResponseDto> {
    const progress = await this.progressRepository.findByUserAndEpisode(actor.userId, episodeId, actor.tenantId);
    if (!progress) {
      throw new NotFoundException(`Progress for episode ${episodeId} not found.`);
    }
    return plainToInstance(ProgressResponseDto, progress);
  }

  async upsert(episodeId: string, payload: UpdateProgressDto, actor: JwtPayload): Promise<ProgressResponseDto> {
    const existing = await this.progressRepository.findByUserAndEpisode(actor.userId, episodeId, actor.tenantId);

    let progress;
    if (existing) {
      // Update existing progress
      progress = await this.progressRepository.update(actor.userId, episodeId, actor.tenantId, {
        progressSeconds: payload.progressSeconds,
        completed: payload.completed ?? existing.completed,
      });
    } else {
      // Create new progress
      progress = await this.progressRepository.create({
        tenantId: actor.tenantId,
        userId: actor.userId,
        episodeId,
        progressSeconds: payload.progressSeconds,
        completed: payload.completed ?? false,
      });
    }

    return plainToInstance(ProgressResponseDto, progress);
  }

  async delete(episodeId: string, actor: JwtPayload): Promise<void> {
    const existing = await this.progressRepository.findByUserAndEpisode(actor.userId, episodeId, actor.tenantId);
    if (!existing) {
      throw new NotFoundException(`Progress for episode ${episodeId} not found.`);
    }

    await this.progressRepository.delete(actor.userId, episodeId, actor.tenantId);
  }
}
