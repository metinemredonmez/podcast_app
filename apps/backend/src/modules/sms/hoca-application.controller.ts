import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  Query,
  UseGuards,
  Req,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { HocaApplicationService } from './hoca-application.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { TenantId } from '../../common/decorators/tenant-id.decorator';
import { Public } from '../../common/decorators/public.decorator';
import { IsString, IsEmail, IsOptional, MinLength } from 'class-validator';

// DTO classes
class SendCodeDto {
  @IsString()
  phone: string;
}

class VerifyCodeDto {
  @IsString()
  phone: string;

  @IsString()
  code: string;
}

class SubmitApplicationDto {
  @IsString()
  applicationToken: string;

  @IsString()
  name: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  bio?: string;

  @IsOptional()
  @IsString()
  expertise?: string;

  @IsOptional()
  @IsString()
  organization?: string;

  @IsOptional()
  @IsString()
  position?: string;
}

class DirectApplicationDto {
  @IsString()
  name: string;

  @IsEmail()
  email: string;

  @IsString()
  phone: string;

  @IsString()
  @MinLength(6)
  password: string;

  @IsOptional()
  @IsString()
  bio?: string;

  @IsOptional()
  @IsString()
  expertise?: string;

  @IsOptional()
  @IsString()
  organization?: string;

  @IsOptional()
  @IsString()
  position?: string;
}

class ApproveApplicationDto {
  @IsOptional()
  @IsString()
  notes?: string;
}

class RejectApplicationDto {
  @IsString()
  reason: string;
}

@Controller('auth/hoca-application')
export class HocaApplicationController {
  constructor(private readonly hocaApplicationService: HocaApplicationService) {}

  /**
   * Direct application submission (without OTP verification)
   * POST /auth/hoca-application
   */
  @Public()
  @Post()
  @HttpCode(HttpStatus.CREATED)
  async submitDirectApplication(
    @Body() dto: DirectApplicationDto,
    @TenantId() tenantId: string,
  ) {
    return this.hocaApplicationService.submitDirectApplication(dto, tenantId);
  }

  /**
   * Step 1: Send verification code to phone
   */
  @Public()
  @Post('send-code')
  @HttpCode(HttpStatus.OK)
  async sendCode(
    @Body() dto: SendCodeDto,
    @TenantId() tenantId: string,
  ) {
    return this.hocaApplicationService.sendVerificationCode(dto.phone, tenantId);
  }

  /**
   * Step 2: Verify the code
   */
  @Public()
  @Post('verify-code')
  @HttpCode(HttpStatus.OK)
  async verifyCode(
    @Body() dto: VerifyCodeDto,
    @TenantId() tenantId: string,
  ) {
    return this.hocaApplicationService.verifyCode(dto.phone, dto.code, tenantId);
  }

  /**
   * Step 3: Submit application with details
   */
  @Public()
  @Post('submit')
  @HttpCode(HttpStatus.CREATED)
  async submitApplication(@Body() dto: SubmitApplicationDto) {
    return this.hocaApplicationService.submitApplication(dto.applicationToken, {
      name: dto.name,
      email: dto.email,
      bio: dto.bio,
      expertise: dto.expertise,
      organization: dto.organization,
      position: dto.position,
    });
  }

  /**
   * Check application status by phone
   */
  @Public()
  @Get('status/:phone')
  async checkStatus(@Param('phone') phone: string) {
    return this.hocaApplicationService.checkApplicationStatus(phone);
  }

  // ============ Admin Endpoints ============

  /**
   * Get pending applications (Admin only)
   */
  @Get('admin/pending')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('SUPER_ADMIN', 'ADMIN')
  async getPendingApplications(
    @TenantId() tenantId: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.hocaApplicationService.getPendingApplications(
      tenantId,
      parseInt(page || '1', 10),
      parseInt(limit || '10', 10),
    );
  }

  /**
   * Approve application (Admin only)
   */
  @Post('admin/:id/approve')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('SUPER_ADMIN', 'ADMIN')
  @HttpCode(HttpStatus.OK)
  async approveApplication(
    @Param('id') id: string,
    @Req() req: any,
    @Body() dto: ApproveApplicationDto,
  ) {
    return this.hocaApplicationService.approveApplication(id, req.user.id, dto.notes);
  }

  /**
   * Reject application (Admin only)
   */
  @Post('admin/:id/reject')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('SUPER_ADMIN', 'ADMIN')
  @HttpCode(HttpStatus.OK)
  async rejectApplication(
    @Param('id') id: string,
    @Req() req: any,
    @Body() dto: RejectApplicationDto,
  ) {
    return this.hocaApplicationService.rejectApplication(id, req.user.id, dto.reason);
  }
}
