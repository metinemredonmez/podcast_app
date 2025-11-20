import { Controller, Get, Post, Patch, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { ModerationService } from './moderation.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '../../common/enums/prisma.enums';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@ApiTags('Content Moderation')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('moderation')
export class ModerationController {
  constructor(private readonly service: ModerationService) {}

  @Get('queue')
  @Roles(UserRole.ADMIN, UserRole.EDITOR)
  getQueue(@Query('status') status?: string) {
    return this.service.getQueue(status);
  }

  @Post('report')
  report(@Body() data: any, @CurrentUser() user: any) {
    return this.service.reportContent({ ...data, reportedBy: user.userId });
  }

  @Patch(':id')
  @Roles(UserRole.ADMIN, UserRole.EDITOR)
  moderate(@Param('id') id: string, @Body() data: { action: 'approved' | 'rejected'; notes?: string }, @CurrentUser() user: any) {
    return this.service.moderate(id, user.userId, data.action, data.notes);
  }
}
