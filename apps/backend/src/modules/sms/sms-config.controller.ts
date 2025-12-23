import {
  Controller,
  Get,
  Put,
  Post,
  Delete,
  Body,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { SmsConfigService } from './sms-config.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import {
  UpdateSmsConfigDto,
  SmsConfigResponseDto,
  TestSmsDto,
  TestSmsResponseDto,
  SmsBalanceResponseDto,
  SmsLogDto,
  SmsStatsDto,
} from './dto';

@ApiTags('SMS Config (Admin)')
@Controller('admin/sms')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN', 'SUPER_ADMIN')
@ApiBearerAuth()
export class SmsConfigController {
  constructor(private readonly smsConfigService: SmsConfigService) {}

  /**
   * Get SMS configuration
   */
  @Get('config')
  @ApiOperation({ summary: 'Get SMS configuration' })
  @ApiResponse({ status: 200, type: SmsConfigResponseDto })
  async getConfig(
    @Query('tenantId') tenantId?: string,
  ): Promise<SmsConfigResponseDto> {
    return this.smsConfigService.getConfig(tenantId);
  }

  /**
   * Update SMS configuration
   */
  @Put('config')
  @ApiOperation({ summary: 'Update SMS configuration' })
  @ApiResponse({ status: 200, type: SmsConfigResponseDto })
  async updateConfig(
    @Body() dto: UpdateSmsConfigDto,
    @Query('tenantId') tenantId?: string,
  ): Promise<SmsConfigResponseDto> {
    return this.smsConfigService.updateConfig(dto, tenantId);
  }

  /**
   * Delete SMS credentials
   */
  @Delete('config')
  @ApiOperation({ summary: 'Delete SMS credentials' })
  @ApiResponse({ status: 200 })
  async deleteCredentials(@Query('tenantId') tenantId?: string): Promise<void> {
    await this.smsConfigService.deleteCredentials(tenantId);
  }

  /**
   * Test SMS connection
   */
  @Post('test')
  @ApiOperation({ summary: 'Test SMS connection' })
  @ApiResponse({ status: 200, type: TestSmsResponseDto })
  async testConnection(
    @Query('tenantId') tenantId?: string,
  ): Promise<TestSmsResponseDto> {
    return this.smsConfigService.testConnection(tenantId);
  }

  /**
   * Send test SMS
   */
  @Post('test-send')
  @ApiOperation({ summary: 'Send test SMS' })
  @ApiResponse({ status: 200, type: TestSmsResponseDto })
  async sendTestSms(
    @Body() dto: TestSmsDto,
    @Query('tenantId') tenantId?: string,
  ): Promise<TestSmsResponseDto> {
    return this.smsConfigService.sendTestSms(dto.phone, dto.message, tenantId);
  }

  /**
   * Get NetGSM balance
   */
  @Get('balance')
  @ApiOperation({ summary: 'Get NetGSM account balance' })
  @ApiResponse({ status: 200, type: SmsBalanceResponseDto })
  async getBalance(
    @Query('tenantId') tenantId?: string,
  ): Promise<SmsBalanceResponseDto> {
    return this.smsConfigService.getBalance(tenantId);
  }

  /**
   * Get SMS logs
   */
  @Get('logs')
  @ApiOperation({ summary: 'Get SMS logs' })
  async getLogs(
    @Query('tenantId') tenantId?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ): Promise<{ logs: SmsLogDto[]; total: number }> {
    return this.smsConfigService.getLogs(
      tenantId,
      parseInt(page || '1', 10),
      parseInt(limit || '20', 10),
    );
  }

  /**
   * Get SMS statistics
   */
  @Get('stats')
  @ApiOperation({ summary: 'Get SMS statistics' })
  @ApiResponse({ status: 200, type: SmsStatsDto })
  async getStats(@Query('tenantId') tenantId?: string): Promise<SmsStatsDto> {
    return this.smsConfigService.getStats(tenantId);
  }
}
