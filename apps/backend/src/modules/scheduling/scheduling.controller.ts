import { Controller, Get, Post, Patch, Delete, Body, Param, Query, UseGuards, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse, ApiParam, ApiQuery } from '@nestjs/swagger';
import { SchedulingService } from './scheduling.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole, ScheduleStatus } from '../../common/enums/prisma.enums';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtPayload } from '../auth/interfaces/jwt-payload.interface';
import { ScheduleEpisodeDto } from './dto/schedule-episode.dto';
import { UpdateScheduleDto } from './dto/update-schedule.dto';

@ApiTags('Episode Scheduling')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.CREATOR, UserRole.ADMIN)
@Controller('scheduling')
export class SchedulingController {
  constructor(private readonly service: SchedulingService) {}

  @Get()
  @ApiOperation({ summary: 'Get all scheduled episodes' })
  @ApiQuery({ name: 'status', required: false, enum: ['PENDING', 'PUBLISHED', 'FAILED', 'CANCELLED'] })
  @ApiResponse({ status: 200, description: 'List of scheduled episodes' })
  getScheduled(@Query('status') status?: string) {
    return this.service.getScheduled(status as ScheduleStatus | undefined);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get single scheduled episode' })
  @ApiParam({ name: 'id', description: 'Schedule ID' })
  @ApiResponse({ status: 200, description: 'Scheduled episode details' })
  @ApiResponse({ status: 404, description: 'Not found' })
  getById(@Param('id') id: string) {
    return this.service.getById(id);
  }

  @Post()
  @ApiOperation({ summary: 'Schedule an episode for publishing' })
  @ApiResponse({ status: 201, description: 'Episode scheduled' })
  @ApiResponse({ status: 400, description: 'Invalid input' })
  @ApiResponse({ status: 404, description: 'Episode not found' })
  @ApiResponse({ status: 409, description: 'Episode already scheduled or published' })
  schedule(@Body() dto: ScheduleEpisodeDto, @CurrentUser() user: JwtPayload) {
    return this.service.scheduleEpisode(dto, user.userId);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update scheduled episode' })
  @ApiParam({ name: 'id', description: 'Schedule ID' })
  @ApiResponse({ status: 200, description: 'Schedule updated' })
  @ApiResponse({ status: 404, description: 'Not found' })
  @ApiResponse({ status: 409, description: 'Cannot update processed schedule' })
  update(@Param('id') id: string, @Body() dto: UpdateScheduleDto) {
    return this.service.update(id, dto);
  }

  @Post(':id/cancel')
  @ApiOperation({ summary: 'Cancel scheduled episode' })
  @ApiParam({ name: 'id', description: 'Schedule ID' })
  @ApiResponse({ status: 200, description: 'Schedule cancelled' })
  @ApiResponse({ status: 404, description: 'Not found' })
  @ApiResponse({ status: 409, description: 'Cannot cancel processed schedule' })
  cancel(@Param('id') id: string) {
    return this.service.cancel(id);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete scheduled episode' })
  @ApiParam({ name: 'id', description: 'Schedule ID' })
  @ApiResponse({ status: 204, description: 'Schedule deleted' })
  @ApiResponse({ status: 404, description: 'Not found' })
  async delete(@Param('id') id: string) {
    await this.service.delete(id);
  }
}
