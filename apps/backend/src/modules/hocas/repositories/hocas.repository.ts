import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { HocaEntity } from '../entities/hoca.entity';

@Injectable()
export class HocaRepository {
  constructor(
    @InjectRepository(HocaEntity)
    private readonly repository: Repository<HocaEntity>,
  ) {}

  create(data: Partial<HocaEntity>): HocaEntity {
    return this.repository.create(data);
  }

  async save(entity: HocaEntity): Promise<HocaEntity> {
    return this.repository.save(entity);
  }
}
