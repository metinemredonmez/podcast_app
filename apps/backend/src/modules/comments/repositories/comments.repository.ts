import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CommentEntity } from '../entities/comment.entity';

@Injectable()
export class CommentRepository {
  constructor(
    @InjectRepository(CommentEntity)
    private readonly repository: Repository<CommentEntity>,
  ) {}

  create(data: Partial<CommentEntity>): CommentEntity {
    return this.repository.create(data);
  }

  async save(entity: CommentEntity): Promise<CommentEntity> {
    return this.repository.save(entity);
  }
}
