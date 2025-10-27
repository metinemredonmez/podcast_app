import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserEntity } from '../entities/user.entity';

@Injectable()
export class UserRepository {
  constructor(
    @InjectRepository(UserEntity)
    private readonly repository: Repository<UserEntity>,
  ) {}

  create(data: Partial<UserEntity>): UserEntity {
    return this.repository.create(data);
  }

  async save(entity: UserEntity): Promise<UserEntity> {
    return this.repository.save(entity);
  }
}
