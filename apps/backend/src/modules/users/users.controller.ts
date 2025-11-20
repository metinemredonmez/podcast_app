import { Body, Controller, Get, HttpCode, HttpStatus, Param, Patch, Post, Query, UploadedFile, UseGuards, UseInterceptors } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { UsersService } from './users.service';
import { CursorPaginationDto, PaginatedResponseDto } from '../../common/dto/cursor-pagination.dto';
import { ApiBearerAuth, ApiConsumes, ApiOperation, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';
import { ApiCursorPaginatedResponse } from '../../common/decorators/api-paginated-response.decorator';
import { CreateUserDto } from './dto/create-user.dto';
import { UserResponseDto } from './dto/user-response.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '../../common/enums/prisma.enums';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtPayload } from '../auth/interfaces/jwt-payload.interface';

@ApiTags('Users')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('users')
export class UsersController {
  constructor(private readonly service: UsersService) {}

  @Get()
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'List users with cursor-based pagination' })
  @ApiQuery({ name: 'cursor', required: false, description: 'Base64-encoded id cursor' })
  @ApiQuery({ name: 'limit', required: false, description: 'Max items to return (1-100)', schema: { default: 20 } })
  @ApiQuery({ name: 'orderBy', required: false, schema: { default: 'createdAt' } })
  @ApiQuery({ name: 'orderDirection', required: false, schema: { default: 'desc', enum: ['asc', 'desc'] } })
  @ApiCursorPaginatedResponse({
    type: 'object',
    properties: {
      id: { type: 'string', format: 'uuid' },
      tenantId: { type: 'string', format: 'uuid' },
      email: { type: 'string', format: 'email' },
      name: { type: 'string', nullable: true },
      role: { type: 'string', enum: ['ADMIN', 'EDITOR', 'CREATOR', 'LISTENER'] },
      isActive: { type: 'boolean' },
      createdAt: { type: 'string', format: 'date-time' },
      updatedAt: { type: 'string', format: 'date-time' },
    },
  })
  @ApiResponse({ status: 400, description: 'Validation error' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 429, description: 'Rate limit exceeded' })
  @ApiResponse({ status: 500, description: 'Server error' })
  findAll(@Query() query: CursorPaginationDto, @CurrentUser() user: JwtPayload): Promise<PaginatedResponseDto<UserResponseDto>> {
    return this.service.findAll(query, user);
  }

  @Get('me')
  @ApiOperation({ summary: 'Get current user profile' })
  @ApiResponse({ status: 200, description: 'Current user profile', type: UserResponseDto })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  getMe(@CurrentUser() user: JwtPayload): Promise<UserResponseDto> {
    return this.service.findOne(user.userId, user);
  }

  @Get(':id')
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  findOne(@Param('id') id: string, @CurrentUser() user: JwtPayload): Promise<UserResponseDto> {
    return this.service.findOne(id, user);
  }

  @Post()
  @Roles(UserRole.ADMIN)
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  create(@Body() payload: CreateUserDto, @CurrentUser() user: JwtPayload): Promise<UserResponseDto> {
    return this.service.create(payload, user);
  }

  @Patch(':id')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Update user (admin only)' })
  @ApiResponse({ status: 200, description: 'User updated' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'User not found' })
  update(@Param('id') id: string, @Body() payload: UpdateUserDto, @CurrentUser() user: JwtPayload): Promise<UserResponseDto> {
    return this.service.update(id, payload, user);
  }

  @Patch('me/profile')
  @ApiOperation({ summary: 'Update own profile' })
  @ApiResponse({ status: 200, description: 'Profile updated', type: UserResponseDto })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'User not found' })
  updateProfile(@Body() payload: UpdateProfileDto, @CurrentUser() user: JwtPayload): Promise<UserResponseDto> {
    return this.service.updateOwnProfile(payload, user);
  }

  @Post('me/change-password')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Change own password' })
  @ApiResponse({ status: 204, description: 'Password changed successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized or current password incorrect' })
  @ApiResponse({ status: 404, description: 'User not found' })
  changePassword(@Body() payload: ChangePasswordDto, @CurrentUser() user: JwtPayload): Promise<void> {
    return this.service.changePassword(payload, user);
  }

  @Post('me/avatar')
  @UseInterceptors(FileInterceptor('file'))
  @ApiOperation({ summary: 'Upload profile avatar/photo' })
  @ApiConsumes('multipart/form-data')
  @ApiResponse({ status: 200, description: 'Avatar uploaded successfully', type: UserResponseDto })
  @ApiResponse({ status: 400, description: 'Invalid file' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async uploadAvatar(@UploadedFile() file: Express.Multer.File, @CurrentUser() user: JwtPayload): Promise<UserResponseDto> {
    return this.service.uploadAvatar(file, user);
  }
}
