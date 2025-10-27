import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { HocasService } from './hocas.service';

@Controller('hocas')
export class HocasController {
  constructor(private readonly service: HocasService) {}

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
