import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { PushService } from './push.service';
import {
  RegisterDeviceDto,
  UpdateDeviceDto,
  DeviceResponseDto,
  UpdatePushSettingsDto,
  PushSettingsResponseDto,
  UpdatePushConfigDto,
  PushConfigResponseDto,
  TestPushConfigDto,
  SendPushDto,
  PushLogResponseDto,
  PushStatsResponseDto,
} from './dto';
import { PushStatus } from '@prisma/client';

interface AuthRequest extends Request {
  user: { userId: string; tenantId: string; role: string };
}

@ApiTags('Push Notifications')
@Controller('push')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class PushController {
  constructor(private readonly pushService: PushService) {}

  // ==================== DEVICE ENDPOINTS ====================

  @Post('devices')
  @ApiOperation({ summary: 'Register device for push notifications' })
  @ApiResponse({ status: 201, type: DeviceResponseDto })
  async registerDevice(
    @Request() req: AuthRequest,
    @Body() dto: RegisterDeviceDto,
  ): Promise<DeviceResponseDto> {
    return this.pushService.registerDevice(req.user.tenantId, req.user.userId, dto);
  }

  @Get('devices')
  @ApiOperation({ summary: 'Get user devices' })
  @ApiResponse({ status: 200, type: [DeviceResponseDto] })
  async getUserDevices(@Request() req: AuthRequest): Promise<DeviceResponseDto[]> {
    return this.pushService.getUserDevices(req.user.tenantId, req.user.userId);
  }

  @Delete('devices/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Unregister device' })
  @ApiResponse({ status: 204 })
  async unregisterDevice(
    @Request() req: AuthRequest,
    @Param('id') deviceId: string,
  ): Promise<void> {
    await this.pushService.unregisterDevice(req.user.tenantId, deviceId);
  }

  // ==================== PUSH SETTINGS ENDPOINTS ====================

  @Get('settings')
  @ApiOperation({ summary: 'Get user push notification settings' })
  @ApiResponse({ status: 200, type: PushSettingsResponseDto })
  async getPushSettings(@Request() req: AuthRequest): Promise<PushSettingsResponseDto> {
    return this.pushService.getPushSettings(req.user.tenantId, req.user.userId);
  }

  @Patch('settings')
  @ApiOperation({ summary: 'Update user push notification settings' })
  @ApiResponse({ status: 200, type: PushSettingsResponseDto })
  async updatePushSettings(
    @Request() req: AuthRequest,
    @Body() dto: UpdatePushSettingsDto,
  ): Promise<PushSettingsResponseDto> {
    return this.pushService.updatePushSettings(req.user.tenantId, req.user.userId, dto);
  }

  // ==================== WEB PUSH PUBLIC ENDPOINT ====================

  @Get('vapid-public-key')
  @ApiOperation({ summary: 'Get VAPID public key for web push subscription' })
  @ApiResponse({ status: 200 })
  async getVapidPublicKey(@Request() req: AuthRequest): Promise<{ publicKey: string | null }> {
    const publicKey = await this.pushService.getVapidPublicKey(req.user.tenantId);
    return { publicKey };
  }

  // ==================== ADMIN CONFIG ENDPOINTS ====================

  @Get('config')
  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Get push notification config (Admin only)' })
  @ApiResponse({ status: 200, type: PushConfigResponseDto })
  async getPushConfig(@Request() req: AuthRequest): Promise<PushConfigResponseDto | null> {
    const config = await this.pushService.getPushConfig(req.user.tenantId);

    if (!config) return null;

    // Mask sensitive data
    return {
      id: config.id,
      provider: config.provider,
      isEnabled: config.isEnabled,
      oneSignalAppId: config.oneSignalAppId,
      hasOneSignalApiKey: !!config.oneSignalApiKey,
      firebaseProjectId: config.firebaseProjectId,
      hasFirebaseCredentials: !!config.firebaseCredentials,
      defaultTitle: config.defaultTitle,
      defaultIcon: config.defaultIcon,
      defaultBadge: config.defaultBadge,
      rateLimitPerMinute: config.rateLimitPerMinute,
      createdAt: config.createdAt,
      updatedAt: config.updatedAt,
    };
  }

  @Patch('config')
  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Update push notification config (Admin only)' })
  @ApiResponse({ status: 200, type: PushConfigResponseDto })
  async updatePushConfig(
    @Request() req: AuthRequest,
    @Body() dto: UpdatePushConfigDto,
  ): Promise<PushConfigResponseDto> {
    const config = await this.pushService.updatePushConfig(req.user.tenantId, dto);

    return {
      id: config.id,
      provider: config.provider,
      isEnabled: config.isEnabled,
      oneSignalAppId: config.oneSignalAppId,
      hasOneSignalApiKey: !!config.oneSignalApiKey,
      firebaseProjectId: config.firebaseProjectId,
      hasFirebaseCredentials: !!config.firebaseCredentials,
      defaultTitle: config.defaultTitle,
      defaultIcon: config.defaultIcon,
      defaultBadge: config.defaultBadge,
      rateLimitPerMinute: config.rateLimitPerMinute,
      createdAt: config.createdAt,
      updatedAt: config.updatedAt,
    };
  }

  @Post('config/generate-vapid-keys')
  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Generate new VAPID key pair for web push (Admin only)' })
  @ApiResponse({ status: 201 })
  async generateVapidKeys(): Promise<{ publicKey: string; privateKey: string }> {
    return this.pushService.generateVapidKeys();
  }

  @Post('config/test')
  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Send test push notification (Admin only)' })
  @ApiResponse({ status: 201 })
  async testPushConfig(
    @Request() req: AuthRequest,
    @Body() dto: TestPushConfigDto,
  ): Promise<{ success: boolean; message: string }> {
    try {
      await this.pushService.sendPush(req.user.tenantId, {
        title: 'Test Bildirimi',
        body: 'Bu bir test bildirimidir. Push sistemi çalışıyor!',
        data: { type: 'TEST' },
        targetType: 'USER_IDS' as const,
        userIds: [req.user.userId],
      });
      return { success: true, message: 'Test bildirimi gönderildi' };
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Test başarısız',
      };
    }
  }

  // ==================== ADMIN SEND ENDPOINTS ====================

  @Post('send')
  @UseGuards(RolesGuard)
  @Roles('ADMIN', 'EDITOR')
  @ApiOperation({ summary: 'Send push notification (Admin/Editor only)' })
  @ApiResponse({ status: 201, type: PushLogResponseDto })
  async sendPush(
    @Request() req: AuthRequest,
    @Body() dto: SendPushDto,
  ): Promise<PushLogResponseDto> {
    const log = await this.pushService.sendPush(req.user.tenantId, {
      ...dto,
      scheduledAt: dto.scheduledAt ? new Date(dto.scheduledAt) : undefined,
      createdBy: req.user.userId,
    });

    return {
      id: log.id,
      title: log.title,
      body: log.body,
      data: log.data as Record<string, unknown> | null,
      targetType: log.targetType,
      targetIds: log.targetIds,
      totalRecipients: log.totalRecipients,
      successCount: log.successCount,
      failureCount: log.failureCount,
      status: log.status,
      providerMsgId: log.providerMsgId,
      errorMessage: log.errorMessage,
      sentAt: log.sentAt,
      scheduledAt: log.scheduledAt,
      createdAt: log.createdAt,
    };
  }

  // ==================== ADMIN LOGS & STATS ====================

  @Get('logs')
  @UseGuards(RolesGuard)
  @Roles('ADMIN', 'EDITOR')
  @ApiOperation({ summary: 'Get push notification logs (Admin/Editor only)' })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'offset', required: false, type: Number })
  @ApiQuery({ name: 'status', required: false, enum: ['PENDING', 'QUEUED', 'SENT', 'FAILED', 'CANCELLED'] })
  @ApiResponse({ status: 200 })
  async getPushLogs(
    @Request() req: AuthRequest,
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
    @Query('status') status?: string,
  ): Promise<{ data: PushLogResponseDto[]; total: number }> {
    const { data, total } = await this.pushService.getPushLogs(req.user.tenantId, {
      limit: limit ? parseInt(limit, 10) : 20,
      offset: offset ? parseInt(offset, 10) : 0,
      status,
    });

    return {
      data: data.map(log => ({
        id: log.id,
        title: log.title,
        body: log.body,
        data: log.data as Record<string, unknown> | null,
        targetType: log.targetType,
        targetIds: log.targetIds,
        totalRecipients: log.totalRecipients,
        successCount: log.successCount,
        failureCount: log.failureCount,
        status: log.status,
        providerMsgId: log.providerMsgId,
        errorMessage: log.errorMessage,
        sentAt: log.sentAt,
        scheduledAt: log.scheduledAt,
        createdAt: log.createdAt,
      })),
      total,
    };
  }

  @Get('stats')
  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Get push notification statistics (Admin only)' })
  @ApiResponse({ status: 200, type: PushStatsResponseDto })
  async getPushStats(@Request() req: AuthRequest): Promise<PushStatsResponseDto> {
    return this.pushService.getPushStats(req.user.tenantId);
  }
}
