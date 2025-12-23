import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
  Headers,
  ParseIntPipe,
  DefaultValuePipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Public } from '../../common/decorators/public.decorator';
import { LiveStreamService } from './live-stream.service';
import { CreateStreamDto } from './dto/create-stream.dto';
import { LiveStreamStatus } from '@prisma/client';

@Controller('live')
@ApiTags('Live Streaming')
export class LiveStreamController {
  constructor(private readonly liveStreamService: LiveStreamService) {}

  // ==================== PUBLIC ====================

  /**
   * Aktif canlı yayınları listele
   */
  @Get('streams')
  @Public()
  @ApiOperation({ summary: 'Aktif canlı yayınları listele' })
  async getActiveStreams(@Headers('x-tenant-id') tenantId: string) {
    return this.liveStreamService.getActiveStreams(tenantId);
  }

  /**
   * Planlanan yayınları listele
   */
  @Get('streams/scheduled')
  @Public()
  @ApiOperation({ summary: 'Planlanan yayınları listele' })
  async getScheduledStreams(@Headers('x-tenant-id') tenantId: string) {
    return this.liveStreamService.getScheduledStreams(tenantId);
  }

  /**
   * Yayın detayı
   */
  @Get('streams/:id')
  @Public()
  @ApiOperation({ summary: 'Yayın detayı' })
  async getStream(@Param('id') id: string, @CurrentUser() user?: any) {
    return this.liveStreamService.getStream(id, user?.sub);
  }

  /**
   * Geçmiş yayınlar (VOD)
   */
  @Get('vod')
  @Public()
  @ApiOperation({ summary: 'Geçmiş yayınlar (VOD)' })
  @ApiQuery({ name: 'hostId', required: false })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  async getPastStreams(
    @Headers('x-tenant-id') tenantId: string,
    @Query('hostId') hostId?: string,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page?: number,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit?: number,
  ) {
    return this.liveStreamService.getPastStreams(tenantId, hostId, page, limit);
  }

  // ==================== HOST (HOCA) ====================

  /**
   * Yayın oluştur
   */
  @Post('streams')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'CREATOR')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Yeni yayın oluştur' })
  async createStream(
    @Body() dto: CreateStreamDto,
    @CurrentUser() user: any,
    @Headers('x-tenant-id') tenantId: string,
  ) {
    return this.liveStreamService.createStream(user.sub, dto, tenantId);
  }

  /**
   * Yayını başlat
   */
  @Post('streams/:id/start')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'CREATOR')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Yayını başlat' })
  async startStream(@Param('id') id: string, @CurrentUser() user: any) {
    return this.liveStreamService.startStream(id, user.sub);
  }

  /**
   * Yayını duraklat
   */
  @Post('streams/:id/pause')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'CREATOR')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Yayını duraklat' })
  async pauseStream(@Param('id') id: string, @CurrentUser() user: any) {
    await this.liveStreamService.pauseStream(id, user.sub);
    return { success: true };
  }

  /**
   * Yayını devam ettir
   */
  @Post('streams/:id/resume')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'CREATOR')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Yayını devam ettir' })
  async resumeStream(@Param('id') id: string, @CurrentUser() user: any) {
    await this.liveStreamService.resumeStream(id, user.sub);
    return { success: true };
  }

  /**
   * Yayını bitir
   */
  @Post('streams/:id/end')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'CREATOR')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Yayını bitir' })
  async endStream(@Param('id') id: string, @CurrentUser() user: any) {
    await this.liveStreamService.endStream(id, user.sub);
    return { success: true };
  }

  /**
   * Yayını iptal et
   */
  @Post('streams/:id/cancel')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'CREATOR')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Yayını iptal et' })
  async cancelStream(@Param('id') id: string, @CurrentUser() user: any) {
    await this.liveStreamService.cancelStream(id, user.sub);
    return { success: true };
  }

  /**
   * Yayın istatistikleri (Host için)
   */
  @Get('streams/:id/stats')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'CREATOR')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Yayın istatistikleri (Host için)' })
  async getStreamStats(@Param('id') id: string, @CurrentUser() user: any) {
    return this.liveStreamService.getStreamStats(id, user.sub);
  }

  /**
   * Kendi yayınlarım
   */
  @Get('my-streams')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'CREATOR')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Kendi yayınlarımı listele' })
  @ApiQuery({ name: 'status', required: false, enum: ['SCHEDULED', 'PREPARING', 'LIVE', 'PAUSED', 'ENDED', 'CANCELLED'] })
  async getMyStreams(
    @CurrentUser() user: any,
    @Query('status') status?: string,
  ) {
    return this.liveStreamService.getMyStreams(user.sub, status);
  }
}
