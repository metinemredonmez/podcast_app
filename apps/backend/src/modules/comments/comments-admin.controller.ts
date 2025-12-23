import { Controller, Get, Delete, Param, Query, UseGuards, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse, ApiQuery } from '@nestjs/swagger';
import { CommentsService } from './comments.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { JwtPayload } from '../auth/interfaces/jwt-payload.interface';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '../../common/enums/prisma.enums';

@ApiTags('Admin Comments')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('admin/comments')
export class CommentsAdminController {
  constructor(private readonly service: CommentsService) {}

  @Get()
  @Roles(UserRole.ADMIN, UserRole.EDITOR)
  @ApiOperation({ summary: 'Get all comments for admin' })
  @ApiQuery({ name: 'page', required: false, description: 'Page number', example: 1 })
  @ApiQuery({ name: 'limit', required: false, description: 'Items per page', example: 20 })
  @ApiQuery({ name: 'search', required: false, description: 'Search in content' })
  @ApiQuery({ name: 'episodeId', required: false, description: 'Filter by episode' })
  @ApiQuery({ name: 'podcastId', required: false, description: 'Filter by podcast' })
  @ApiResponse({ status: 200, description: 'List of comments' })
  findAllAdmin(
    @CurrentUser() user: JwtPayload,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('search') search?: string,
    @Query('episodeId') episodeId?: string,
    @Query('podcastId') podcastId?: string,
  ) {
    return this.service.findAllAdmin(user.tenantId, {
      page: page ? +page : 1,
      limit: limit ? +limit : 20,
      search,
      episodeId,
      podcastId,
    });
  }

  @Get(':id')
  @Roles(UserRole.ADMIN, UserRole.EDITOR)
  @ApiOperation({ summary: 'Get single comment by ID' })
  @ApiResponse({ status: 200, description: 'Comment details' })
  @ApiResponse({ status: 404, description: 'Comment not found' })
  findOne(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    return this.service.findOne(user.tenantId, id);
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a comment (admin only)' })
  @ApiResponse({ status: 204, description: 'Comment deleted' })
  @ApiResponse({ status: 404, description: 'Comment not found' })
  remove(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    return this.service.deleteAdmin(user.tenantId, id);
  }
}
