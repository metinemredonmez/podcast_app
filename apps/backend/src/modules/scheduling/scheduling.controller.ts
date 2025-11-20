import { Controller, Get, Post, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { SchedulingService } from './scheduling.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '../../common/enums/prisma.enums';

@ApiTags('Episode Scheduling')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.CREATOR, UserRole.ADMIN)
@Controller('scheduling')
export class SchedulingController {
  constructor(private readonly service: SchedulingService) {}

  @Get()
  getScheduled() {
    return this.service.getScheduled();
  }

  @Post()
  schedule(@Body() data: { episodeId: string; scheduledAt: string }) {
    return this.service.scheduleEpisode(data.episodeId, new Date(data.scheduledAt));
  }
}
