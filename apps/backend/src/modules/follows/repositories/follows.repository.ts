import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { FollowEntity } from '../entities/follow.entity';

@Injectable()
export class FollowRepository {
  constructor(
    @InjectRepository(FollowEntity)
    private readonly repository: Repository<FollowEntity>,
  ) {}

  create(data: Partial<FollowEntity>): FollowEntity {
    return this.repository.create(data);
  }

  async save(entity: FollowEntity): Promise<FollowEntity> {
    return this.repository.save(entity);
  }
}
