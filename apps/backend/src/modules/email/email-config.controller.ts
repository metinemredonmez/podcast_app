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
import { EmailConfigService } from './email-config.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import {
  UpdateEmailConfigDto,
  EmailConfigResponseDto,
  TestEmailDto,
  TestEmailResponseDto,
  EmailLogDto,
  EmailStatsDto,
} from './dto';

@ApiTags('Email Config (Admin)')
@Controller('admin/email')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN', 'SUPER_ADMIN')
@ApiBearerAuth()
export class EmailConfigController {
  constructor(private readonly emailConfigService: EmailConfigService) {}

  /**
   * Get Email configuration
   */
  @Get('config')
  @ApiOperation({ summary: 'Get Email configuration' })
  @ApiResponse({ status: 200, type: EmailConfigResponseDto })
  async getConfig(
    @Query('tenantId') tenantId?: string,
  ): Promise<EmailConfigResponseDto> {
    return this.emailConfigService.getConfig(tenantId);
  }

  /**
   * Update Email configuration
   */
  @Put('config')
  @ApiOperation({ summary: 'Update Email configuration' })
  @ApiResponse({ status: 200, type: EmailConfigResponseDto })
  async updateConfig(
    @Body() dto: UpdateEmailConfigDto,
    @Query('tenantId') tenantId?: string,
  ): Promise<EmailConfigResponseDto> {
    return this.emailConfigService.updateConfig(dto, tenantId);
  }

  /**
   * Delete Email credentials
   */
  @Delete('config')
  @ApiOperation({ summary: 'Delete Email credentials' })
  @ApiResponse({ status: 200 })
  async deleteCredentials(@Query('tenantId') tenantId?: string): Promise<void> {
    await this.emailConfigService.deleteCredentials(tenantId);
  }

  /**
   * Test Email connection
   */
  @Post('test')
  @ApiOperation({ summary: 'Test Email connection' })
  @ApiResponse({ status: 200, type: TestEmailResponseDto })
  async testConnection(
    @Query('tenantId') tenantId?: string,
  ): Promise<TestEmailResponseDto> {
    return this.emailConfigService.testConnection(tenantId);
  }

  /**
   * Send test email
   */
  @Post('test-send')
  @ApiOperation({ summary: 'Send test email' })
  @ApiResponse({ status: 200, type: TestEmailResponseDto })
  async sendTestEmail(
    @Body() dto: TestEmailDto,
    @Query('tenantId') tenantId?: string,
  ): Promise<TestEmailResponseDto> {
    return this.emailConfigService.sendTestEmail(
      dto.email,
      dto.subject,
      dto.message,
      tenantId,
    );
  }

  /**
   * Get Email logs
   */
  @Get('logs')
  @ApiOperation({ summary: 'Get Email logs' })
  async getLogs(
    @Query('tenantId') tenantId?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ): Promise<{ logs: EmailLogDto[]; total: number }> {
    return this.emailConfigService.getLogs(
      tenantId,
      parseInt(page || '1', 10),
      parseInt(limit || '20', 10),
    );
  }

  /**
   * Get Email statistics
   */
  @Get('stats')
  @ApiOperation({ summary: 'Get Email statistics' })
  @ApiResponse({ status: 200, type: EmailStatsDto })
  async getStats(@Query('tenantId') tenantId?: string): Promise<EmailStatsDto> {
    return this.emailConfigService.getStats(tenantId);
  }
}
