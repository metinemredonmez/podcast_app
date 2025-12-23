import {
  Controller,
  Get,
  Post,
  Body,
  Headers,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { Public } from '../../common/decorators/public.decorator';
import { PhoneAuthService } from './phone-auth.service';
import {
  SendOtpDto,
  VerifyOtpDto,
  SendOtpResponseDto,
  AuthProvidersResponseDto,
} from './dto';

@ApiTags('Authentication - Phone')
@Controller('auth')
@Public()
export class PhoneAuthController {
  constructor(private readonly phoneAuthService: PhoneAuthService) {}

  /**
   * Get available authentication providers
   */
  @Get('providers')
  @ApiOperation({ summary: 'Get available authentication methods' })
  @ApiResponse({ status: 200, type: AuthProvidersResponseDto })
  async getAuthProviders(
    @Headers('x-tenant-id') tenantId?: string,
  ): Promise<AuthProvidersResponseDto> {
    return this.phoneAuthService.getAuthProviders(tenantId);
  }

  /**
   * Send OTP for admin login
   */
  @Post('phone/send-otp')
  @Throttle({ default: { limit: 3, ttl: 60000 } }) // 3 requests per minute
  @ApiOperation({ summary: 'Send OTP for admin phone login' })
  @ApiResponse({ status: 200, type: SendOtpResponseDto })
  async sendOtp(
    @Body() dto: SendOtpDto,
    @Headers('x-tenant-id') tenantId?: string,
  ): Promise<SendOtpResponseDto> {
    return this.phoneAuthService.sendOtp(dto.phone, tenantId);
  }

  /**
   * Verify OTP and login
   */
  @Post('phone/verify-otp')
  @Throttle({ default: { limit: 5, ttl: 60000 } }) // 5 requests per minute
  @ApiOperation({ summary: 'Verify OTP and login' })
  async verifyOtp(
    @Body() dto: VerifyOtpDto,
    @Headers('x-tenant-id') tenantId?: string,
  ) {
    return this.phoneAuthService.verifyOtpAndLogin(dto.phone, dto.code, tenantId);
  }
}
