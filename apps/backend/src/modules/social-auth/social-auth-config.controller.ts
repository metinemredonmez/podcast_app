import {
  Controller,
  Get,
  Put,
  Delete,
  Post,
  Body,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { SocialAuthConfigService } from './social-auth-config.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import {
  UpdateSocialAuthConfigDto,
  SocialAuthConfigResponseDto,
  TestConnectionResponseDto,
} from './dto';

@ApiTags('Social Auth Config (Admin)')
@Controller('admin/social-auth')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN', 'SUPER_ADMIN')
@ApiBearerAuth()
export class SocialAuthConfigController {
  constructor(private readonly configService: SocialAuthConfigService) {}

  /**
   * Get social auth configuration
   */
  @Get('config')
  @ApiOperation({ summary: 'Get social auth configuration' })
  @ApiResponse({ status: 200, type: SocialAuthConfigResponseDto })
  async getConfig(
    @Query('tenantId') tenantId?: string,
  ): Promise<SocialAuthConfigResponseDto> {
    return this.configService.getConfig(tenantId);
  }

  /**
   * Update social auth configuration
   */
  @Put('config')
  @ApiOperation({ summary: 'Update social auth configuration' })
  @ApiResponse({ status: 200, type: SocialAuthConfigResponseDto })
  async updateConfig(
    @Body() dto: UpdateSocialAuthConfigDto,
    @Query('tenantId') tenantId?: string,
  ): Promise<SocialAuthConfigResponseDto> {
    return this.configService.updateConfig(dto, tenantId);
  }

  /**
   * Delete Google configuration
   */
  @Delete('google')
  @ApiOperation({ summary: 'Delete Google OAuth configuration' })
  @ApiResponse({ status: 200 })
  async deleteGoogleConfig(@Query('tenantId') tenantId?: string): Promise<void> {
    await this.configService.deleteGoogleConfig(tenantId);
  }

  /**
   * Test Google connection
   */
  @Post('google/test')
  @ApiOperation({ summary: 'Test Google OAuth connection' })
  @ApiResponse({ status: 200, type: TestConnectionResponseDto })
  async testGoogleConnection(
    @Query('tenantId') tenantId?: string,
  ): Promise<TestConnectionResponseDto> {
    return this.configService.testGoogleConnection(tenantId);
  }
}
