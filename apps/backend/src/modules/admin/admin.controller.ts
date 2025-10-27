import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { AdminService } from './admin.service';

@Controller('admin')
export class AdminController {
  constructor(private readonly service: AdminService) {}

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
