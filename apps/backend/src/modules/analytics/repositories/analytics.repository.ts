import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PlayEventEntity } from '../entities/play-event.entity';

@Injectable()
export class AnalyticRepository {
  constructor(
    @InjectRepository(PlayEventEntity)
    private readonly repository: Repository<PlayEventEntity>,
  ) {}

  create(data: Partial<PlayEventEntity>): PlayEventEntity {
    return this.repository.create(data);
  }

  async save(entity: PlayEventEntity): Promise<PlayEventEntity> {
    return this.repository.save(entity);
  }
}
