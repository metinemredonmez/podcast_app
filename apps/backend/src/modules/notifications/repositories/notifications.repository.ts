import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { NotificationEntity } from '../entities/notification.entity';

@Injectable()
export class NotificationRepository {
  constructor(
    @InjectRepository(NotificationEntity)
    private readonly repository: Repository<NotificationEntity>,
  ) {}

  create(data: Partial<NotificationEntity>): NotificationEntity {
    return this.repository.create(data);
  }

  async save(entity: NotificationEntity): Promise<NotificationEntity> {
    return this.repository.save(entity);
  }
}
