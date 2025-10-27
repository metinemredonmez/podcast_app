import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CategoryEntity } from '../entities/category.entity';

@Injectable()
export class CategoryRepository {
  constructor(
    @InjectRepository(CategoryEntity)
    private readonly repository: Repository<CategoryEntity>,
  ) {}

  create(data: Partial<CategoryEntity>): CategoryEntity {
    return this.repository.create(data);
  }

  async save(entity: CategoryEntity): Promise<CategoryEntity> {
    return this.repository.save(entity);
  }
}
