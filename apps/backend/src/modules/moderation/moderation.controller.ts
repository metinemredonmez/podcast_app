import { Controller, Get, Post, Patch, Delete, Body, Param, Query, UseGuards, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse, ApiParam, ApiQuery } from '@nestjs/swagger';
import { ModerationService } from './moderation.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole, ModerationStatus } from '../../common/enums/prisma.enums';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { JwtPayload } from '../auth/interfaces/jwt-payload.interface';
import { ReportContentDto } from './dto/report-content.dto';
import { ModerationActionDto, EscalateDto, SetPriorityDto } from './dto/moderation-action.dto';
import { GetQueueFiltersDto } from './dto/get-queue-filters.dto';

@ApiTags('Content Moderation')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('moderation')
export class ModerationController {
  constructor(private readonly service: ModerationService) {}

  @Get('queue')
  @Roles(UserRole.ADMIN, UserRole.EDITOR)
  @ApiOperation({ summary: 'Get moderation queue' })
  @ApiQuery({ name: 'status', required: false, enum: ['PENDING', 'APPROVED', 'REJECTED', 'ESCALATED'] })
  @ApiResponse({ status: 200, description: 'Moderation queue items' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - Admin/Editor only' })
  getQueue(@Query() filters: GetQueueFiltersDto, @CurrentUser() user: JwtPayload) {
    return this.service.getQueue(filters, user.tenantId);
  }

  @Get('queue/:id')
  @Roles(UserRole.ADMIN, UserRole.EDITOR)
  @ApiOperation({ summary: 'Get single moderation item' })
  @ApiParam({ name: 'id', description: 'Moderation item ID' })
  @ApiResponse({ status: 200, description: 'Moderation item details' })
  @ApiResponse({ status: 404, description: 'Item not found' })
  getById(@Param('id') id: string) {
    return this.service.getById(id);
  }

  @Get('stats')
  @Roles(UserRole.ADMIN, UserRole.EDITOR)
  @ApiOperation({ summary: 'Get moderation statistics' })
  @ApiResponse({ status: 200, description: 'Moderation stats' })
  getStats(@CurrentUser() user: JwtPayload) {
    return this.service.getStats(user.tenantId);
  }

  @Post('report')
  @ApiOperation({ summary: 'Report content for moderation' })
  @ApiResponse({ status: 201, description: 'Content reported' })
  @ApiResponse({ status: 400, description: 'Invalid input' })
  report(@Body() dto: ReportContentDto, @CurrentUser() user: JwtPayload) {
    return this.service.reportContent({
      ...dto,
      reportedBy: user.userId,
      tenantId: user.tenantId,
    });
  }

  @Patch(':id/moderate')
  @Roles(UserRole.ADMIN, UserRole.EDITOR)
  @ApiOperation({ summary: 'Approve or reject reported content' })
  @ApiParam({ name: 'id', description: 'Moderation item ID' })
  @ApiResponse({ status: 200, description: 'Content moderated' })
  @ApiResponse({ status: 400, description: 'Invalid action' })
  @ApiResponse({ status: 404, description: 'Item not found' })
  moderate(
    @Param('id') id: string,
    @Body() dto: ModerationActionDto,
    @CurrentUser() user: JwtPayload,
  ) {
    const action = dto.action === 'APPROVED' ? ModerationStatus.APPROVED : ModerationStatus.REJECTED;
    return this.service.moderate(id, user.userId, action, dto.notes);
  }

  @Patch(':id/escalate')
  @Roles(UserRole.ADMIN, UserRole.EDITOR)
  @ApiOperation({ summary: 'Escalate moderation item' })
  @ApiParam({ name: 'id', description: 'Moderation item ID' })
  @ApiResponse({ status: 200, description: 'Item escalated' })
  escalate(
    @Param('id') id: string,
    @Body() dto: EscalateDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.service.escalate(id, user.userId, dto.notes);
  }

  @Patch(':id/priority')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Set moderation item priority' })
  @ApiParam({ name: 'id', description: 'Moderation item ID' })
  @ApiResponse({ status: 200, description: 'Priority updated' })
  setPriority(@Param('id') id: string, @Body() dto: SetPriorityDto) {
    return this.service.setPriority(id, dto.priority);
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete moderation item from queue' })
  @ApiParam({ name: 'id', description: 'Moderation item ID' })
  @ApiResponse({ status: 204, description: 'Item deleted' })
  @ApiResponse({ status: 404, description: 'Item not found' })
  async delete(@Param('id') id: string) {
    await this.service.delete(id);
  }
}
