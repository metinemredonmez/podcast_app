import { Body, Controller, Delete, Get, Param, Post, Query, Res, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Response } from 'express';
import { AnalyticsService } from './analytics.service';
import { FilterAnalyticsDto } from './dto/filter-analytics.dto';
import { CreateAnalyticsDto } from './dto/create-analytics.dto';
import { Roles } from '../../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { UserRole } from '../../common/enums/prisma.enums';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { JwtPayload } from '../auth/interfaces/jwt-payload.interface';

@ApiTags('analytics')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('analytics')
export class AnalyticsController {
  constructor(private readonly service: AnalyticsService) {}

  @Get('dashboard')
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.HOCA)
  @ApiOperation({ summary: 'Get dashboard statistics (Admin only)' })
  @ApiResponse({ status: 200, description: 'Dashboard stats' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - Admin access required' })
  getDashboardStats(@CurrentUser() user: JwtPayload) {
    return this.service.getDashboardStats(user);
  }

  @Get('top-podcasts')
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.HOCA)
  @ApiOperation({ summary: 'Get top performing podcasts (Admin only)' })
  @ApiResponse({ status: 200, description: 'Top podcasts' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - Admin access required' })
  getTopPodcasts(@Query('limit') limit: string = '10', @CurrentUser() user: JwtPayload) {
    return this.service.getTopPodcasts(parseInt(limit, 10), user);
  }

  @Get('kpis')
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.HOCA)
  @ApiOperation({ summary: 'Get key performance indicators' })
  getKPIs(@Query('from') from: string, @Query('to') to: string, @CurrentUser() user: JwtPayload) {
    return this.service.getKPIs(from, to, user);
  }

  @Get('plays')
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.HOCA)
  @ApiOperation({ summary: 'Get plays over time' })
  getPlaysOverTime(
    @Query('from') from: string,
    @Query('to') to: string,
    @Query('groupBy') groupBy: 'hour' | 'day' | 'week' | 'month' = 'day',
    @CurrentUser() user: JwtPayload,
  ) {
    return this.service.getPlaysOverTime(from, to, groupBy, user);
  }

  @Get('users')
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.HOCA)
  @ApiOperation({ summary: 'Get user growth over time' })
  getUserGrowth(@Query('from') from: string, @Query('to') to: string, @CurrentUser() user: JwtPayload) {
    return this.service.getUserGrowth(from, to, user);
  }

  @Get('devices')
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.HOCA)
  @ApiOperation({ summary: 'Get device breakdown' })
  getDeviceBreakdown(@CurrentUser() user: JwtPayload) {
    return this.service.getDeviceBreakdown(user);
  }

  @Get('geography')
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.HOCA)
  @ApiOperation({ summary: 'Get geography distribution' })
  getGeography(@CurrentUser() user: JwtPayload) {
    return this.service.getGeography(user);
  }

  @Get('peak-hours')
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.HOCA)
  @ApiOperation({ summary: 'Get peak listening hours' })
  getPeakHours(@CurrentUser() user: JwtPayload) {
    return this.service.getPeakListeningHours(user);
  }

  @Get('export/:format')
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.HOCA)
  @ApiOperation({ summary: 'Export analytics data as CSV or JSON' })
  @ApiResponse({ status: 200, description: 'Export file' })
  async exportData(
    @Param('format') format: 'csv' | 'json',
    @Query('from') from: string,
    @Query('to') to: string,
    @CurrentUser() user: JwtPayload,
    @Res() res: Response,
  ) {
    const data = await this.service.exportData(from, to, user);

    if (format === 'csv') {
      const csv = this.convertToCSV(data);
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename=analytics-${from}-to-${to}.csv`);
      return res.send(csv);
    } else {
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', `attachment; filename=analytics-${from}-to-${to}.json`);
      return res.json(data);
    }
  }

  private convertToCSV(data: any): string {
    const headers = ['Date', 'Plays', 'Unique Listeners', 'New Users', 'Comments', 'Reviews'];
    const rows = data.dailyStats?.map((d: any) => [
      d.date,
      d.plays || 0,
      d.uniqueListeners || 0,
      d.newUsers || 0,
      d.comments || 0,
      d.reviews || 0,
    ]) || [];

    return [headers.join(','), ...rows.map((r: any[]) => r.join(','))].join('\n');
  }

  @Get('stats')
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.HOCA)
  @ApiOperation({ summary: 'Aggregate analytics statistics by event type' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  getStats(@Query() filter: FilterAnalyticsDto, @CurrentUser() user: JwtPayload) {
    return this.service.getStats(filter, user);
  }

  @Get()
  @Roles(UserRole.ADMIN, UserRole.EDITOR)
  @ApiOperation({ summary: 'List analytics events for a tenant' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  findAll(@Query() filter: FilterAnalyticsDto, @CurrentUser() user: JwtPayload) {
    return this.service.findAll(filter, user);
  }

  @Get(':id')
  @Roles(UserRole.ADMIN, UserRole.EDITOR)
  @ApiOperation({ summary: 'Get analytics event by id' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  findOne(@Param('id') id: string, @Query('tenantId') tenantId: string, @CurrentUser() user: JwtPayload) {
    return this.service.findOne(tenantId, id, user);
  }

  @Post()
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.HOCA)
  @ApiOperation({ summary: 'Create analytics event immediately' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  create(@Body() dto: CreateAnalyticsDto, @CurrentUser() user: JwtPayload) {
    return this.service.create(dto, user);
  }

  @Post('queue')
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.HOCA)
  @ApiOperation({ summary: 'Queue analytics event for asynchronous processing' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  queue(@Body() dto: CreateAnalyticsDto, @CurrentUser() user: JwtPayload) {
    return this.service.queueEvent(dto, user);
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.HOCA)
  @ApiOperation({ summary: 'Delete analytics event' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  remove(@Param('id') id: string, @Query('tenantId') tenantId: string, @CurrentUser() user: JwtPayload) {
    return this.service.remove(tenantId, id, user);
  }
}
