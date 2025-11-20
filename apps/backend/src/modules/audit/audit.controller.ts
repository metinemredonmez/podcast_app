import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { AuditService } from './audit.service';
import { FilterAuditDto } from './dto/filter-audit.dto';
import { AuditLogResponseDto } from './dto/audit-log-response.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '../../common/enums/prisma.enums';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtPayload } from '../auth/interfaces/jwt-payload.interface';

@ApiTags('Audit Logs')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
@Controller('admin/audit-logs')
export class AuditController {
  constructor(private readonly service: AuditService) {}

  @Get()
  @ApiOperation({ summary: 'Get all audit logs (Admin only)' })
  @ApiResponse({ status: 200, description: 'List of audit logs', type: [AuditLogResponseDto] })
  @ApiResponse({ status: 403, description: 'Forbidden - Admin access required' })
  findAll(@Query() filter: FilterAuditDto, @CurrentUser() user: JwtPayload): Promise<AuditLogResponseDto[]> {
    return this.service.findAll(filter, user);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get audit log by ID (Admin only)' })
  @ApiResponse({ status: 200, description: 'Audit log details', type: AuditLogResponseDto })
  @ApiResponse({ status: 403, description: 'Forbidden - Admin access required' })
  @ApiResponse({ status: 404, description: 'Audit log not found' })
  findOne(@Param('id') id: string, @CurrentUser() user: JwtPayload): Promise<AuditLogResponseDto> {
    return this.service.findOne(id, user);
  }
}
