import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { StorageService } from './storage.service';

@Controller('storage')
export class StorageController {
  constructor(private readonly service: StorageService) {}

  @Get()
  findAll(): Promise<unknown[]> {
    return this.service.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string): Promise<unknown> {
    return this.service.findOne(id);
  }

  @Post()
  create(@Body() payload: unknown): Promise<unknown> {
    return this.service.create(payload);
  }
}
