import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { AdminService } from './admin.service';
import { ListTenantsDto } from './dto/list-tenants.dto';
import { CreateTenantDto } from './dto/create-tenant.dto';
import { UpdateTenantDto } from './dto/update-tenant.dto';
import { ImportTenantsDto } from './dto/import-tenants.dto';
import { ListUsersDto } from './dto/list-users.dto';
import { CreateAdminUserDto } from './dto/create-admin-user.dto';
import { UpdateAdminUserDto } from './dto/update-admin-user.dto';
import { Roles } from '../../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { UserRole } from '../../common/enums/prisma.enums';
import { AssignUserRoleDto } from './dto/assign-user-role.dto';

@ApiTags('admin')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('admin')
export class AdminController {
  constructor(private readonly service: AdminService) {}

  @Get('tenants')
  @Roles(UserRole.ADMIN, UserRole.EDITOR)
  @ApiOperation({ summary: 'List tenants / search by name or slug' })
  listTenants(@Query() query: ListTenantsDto) {
    return this.service.listTenants(query);
  }

  @Get('tenants/stats')
  @Roles(UserRole.ADMIN, UserRole.EDITOR)
  @ApiOperation({ summary: 'Get tenant statistics' })
  getTenantStats() {
    return this.service.getTenantStats();
  }

  @Get('tenants/export')
  @Roles(UserRole.ADMIN, UserRole.EDITOR)
  @ApiOperation({ summary: 'Export all tenants' })
  exportTenants() {
    return this.service.exportTenants();
  }

  @Get('tenants/:id')
  @Roles(UserRole.ADMIN, UserRole.EDITOR)
  @ApiOperation({ summary: 'Get tenant by id' })
  getTenant(@Param('id') id: string) {
    return this.service.getTenant(id);
  }

  @Post('tenants')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Create a tenant' })
  createTenant(@Body() dto: CreateTenantDto) {
    return this.service.createTenant(dto);
  }

  @Patch('tenants/:id')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Update a tenant' })
  updateTenant(@Param('id') id: string, @Body() dto: UpdateTenantDto) {
    return this.service.updateTenant(id, dto);
  }

  @Delete('tenants/:id')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Delete a tenant' })
  deleteTenant(@Param('id') id: string) {
    return this.service.deleteTenant(id);
  }

  @Post('tenants/import')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Bulk import tenants' })
  importTenants(@Body() dto: ImportTenantsDto) {
    return this.service.importTenants(dto);
  }

  @Get('users')
  @Roles(UserRole.ADMIN, UserRole.EDITOR)
  @ApiOperation({ summary: 'List users (optionally scoped to a tenant)' })
  listUsers(@Query() query: ListUsersDto) {
    return this.service.listUsers(query);
  }

  @Get('users/:id')
  @Roles(UserRole.ADMIN, UserRole.EDITOR)
  @ApiOperation({ summary: 'Get user by id' })
  getUser(@Param('id') id: string) {
    return this.service.getUser(id);
  }

  @Post('users')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Create user for tenant' })
  createUser(@Body() dto: CreateAdminUserDto) {
    return this.service.createUser(dto);
  }

  @Patch('users/:id')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Update user details' })
  updateUser(@Param('id') id: string, @Body() dto: UpdateAdminUserDto) {
    return this.service.updateUser(id, dto);
  }

  @Patch('users/:id/role')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Assign a new role to a user' })
  assignUserRole(@Param('id') id: string, @Body() dto: AssignUserRoleDto) {
    return this.service.assignUserRole(id, dto);
  }

  @Delete('users/:id')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Delete user' })
  deleteUser(@Param('id') id: string) {
    return this.service.deleteUser(id);
  }
}
