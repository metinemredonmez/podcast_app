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
import { StorageConfigService } from './storage-config.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import {
  UpdateStorageConfigDto,
  StorageConfigResponseDto,
  TestStorageResponseDto,
  StorageStatsDto,
} from './dto';

@ApiTags('Storage Config (Admin)')
@Controller('admin/storage')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN', 'SUPER_ADMIN')
@ApiBearerAuth()
export class StorageConfigController {
  constructor(private readonly storageConfigService: StorageConfigService) {}

  /**
   * Get Storage configuration
   */
  @Get('config')
  @ApiOperation({ summary: 'Get Storage configuration' })
  @ApiResponse({ status: 200, type: StorageConfigResponseDto })
  async getConfig(
    @Query('tenantId') tenantId?: string,
  ): Promise<StorageConfigResponseDto> {
    return this.storageConfigService.getConfig(tenantId);
  }

  /**
   * Update Storage configuration
   */
  @Put('config')
  @ApiOperation({ summary: 'Update Storage configuration' })
  @ApiResponse({ status: 200, type: StorageConfigResponseDto })
  async updateConfig(
    @Body() dto: UpdateStorageConfigDto,
    @Query('tenantId') tenantId?: string,
  ): Promise<StorageConfigResponseDto> {
    return this.storageConfigService.updateConfig(dto, tenantId);
  }

  /**
   * Delete Storage credentials
   */
  @Delete('config')
  @ApiOperation({ summary: 'Delete Storage credentials' })
  @ApiResponse({ status: 200 })
  async deleteCredentials(@Query('tenantId') tenantId?: string): Promise<void> {
    await this.storageConfigService.deleteCredentials(tenantId);
  }

  /**
   * Test Storage connection
   */
  @Post('test')
  @ApiOperation({ summary: 'Test Storage connection' })
  @ApiResponse({ status: 200, type: TestStorageResponseDto })
  async testConnection(
    @Query('tenantId') tenantId?: string,
  ): Promise<TestStorageResponseDto> {
    return this.storageConfigService.testConnection(tenantId);
  }

  /**
   * Get Storage statistics
   */
  @Get('stats')
  @ApiOperation({ summary: 'Get Storage statistics' })
  @ApiResponse({ status: 200, type: StorageStatsDto })
  async getStats(@Query('tenantId') tenantId?: string): Promise<StorageStatsDto> {
    return this.storageConfigService.getStats(tenantId);
  }
}
