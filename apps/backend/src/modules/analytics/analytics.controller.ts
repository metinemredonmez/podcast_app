import { Body, Controller, Delete, Get, Param, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { AnalyticsService } from './analytics.service';
import { FilterAnalyticsDto } from './dto/filter-analytics.dto';
import { CreateAnalyticsDto } from './dto/create-analytics.dto';
import { Roles } from '../../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { UserRole } from '../../common/enums/prisma.enums';

@ApiTags('analytics')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('analytics')
export class AnalyticsController {
  constructor(private readonly service: AnalyticsService) {}

  @Get()
  @Roles(UserRole.ADMIN, UserRole.EDITOR)
  @ApiOperation({ summary: 'List analytics events for a tenant' })
  findAll(@Query() filter: FilterAnalyticsDto) {
    return this.service.findAll(filter);
  }

  @Get('stats')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Aggregate analytics statistics by event type' })
  getStats(@Query() filter: FilterAnalyticsDto) {
    return this.service.getStats(filter);
  }

  @Get(':id')
  @Roles(UserRole.ADMIN, UserRole.EDITOR)
  @ApiOperation({ summary: 'Get analytics event by id' })
  findOne(@Param('id') id: string, @Query('tenantId') tenantId: string) {
    return this.service.findOne(tenantId, id);
  }

  @Post()
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Create analytics event immediately' })
  create(@Body() dto: CreateAnalyticsDto) {
    return this.service.create(dto);
  }

  @Post('queue')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Queue analytics event for asynchronous processing' })
  queue(@Body() dto: CreateAnalyticsDto) {
    return this.service.queueEvent(dto);
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Delete analytics event' })
  remove(@Param('id') id: string, @Query('tenantId') tenantId: string) {
    return this.service.remove(tenantId, id);
  }
}
