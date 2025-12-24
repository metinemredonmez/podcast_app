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

// DTO classes
class SendCodeDto {
  phone: string;
}

class VerifyCodeDto {
  phone: string;
  code: string;
}

class SubmitApplicationDto {
  applicationToken: string;
  name: string;
  email?: string;
  bio?: string;
  expertise?: string;
  organization?: string;
  position?: string;
}

class ApproveApplicationDto {
  notes?: string;
}

class RejectApplicationDto {
  reason: string;
}

@Controller('auth/hoca-application')
export class HocaApplicationController {
  constructor(private readonly hocaApplicationService: HocaApplicationService) {}

  /**
   * Step 1: Send verification code to phone
   */
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
