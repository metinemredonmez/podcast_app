import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { EpisodesService } from './episodes.service';

@Controller('episodes')
export class EpisodesController {
  constructor(private readonly service: EpisodesService) {}

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
