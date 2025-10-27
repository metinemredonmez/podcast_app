import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { EpisodeEntity } from '../entities/episode.entity';

@Injectable()
export class EpisodeRepository {
  constructor(
    @InjectRepository(EpisodeEntity)
    private readonly repository: Repository<EpisodeEntity>,
  ) {}

  create(data: Partial<EpisodeEntity>): EpisodeEntity {
    return this.repository.create(data);
  }

  async save(entity: EpisodeEntity): Promise<EpisodeEntity> {
    return this.repository.save(entity);
  }
}
