import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PodcastEntity } from '../entities/podcast.entity';

@Injectable()
export class PodcastRepository {
  constructor(
    @InjectRepository(PodcastEntity)
    private readonly repository: Repository<PodcastEntity>,
  ) {}

  create(data: Partial<PodcastEntity>): PodcastEntity {
    return this.repository.create(data);
  }

  async save(entity: PodcastEntity): Promise<PodcastEntity> {
    return this.repository.save(entity);
  }
}
