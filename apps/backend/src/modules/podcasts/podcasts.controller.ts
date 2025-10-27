import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { PodcastsService } from './podcasts.service';

@Controller('podcasts')
export class PodcastsController {
  constructor(private readonly service: PodcastsService) {}

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
