import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { StreamingService } from './streaming.service';

@Controller('streaming')
export class StreamingController {
  constructor(private readonly service: StreamingService) {}

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
