import { Controller, Get, Patch, Delete, Param, Body, Query, UseGuards, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse, ApiQuery } from '@nestjs/swagger';
import { ReviewsService } from './reviews.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { JwtPayload } from '../auth/interfaces/jwt-payload.interface';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '../../common/enums/prisma.enums';

@ApiTags('Admin Reviews')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('admin/reviews')
export class ReviewsAdminController {
  constructor(private readonly service: ReviewsService) {}

  @Get()
  @Roles(UserRole.ADMIN, UserRole.EDITOR)
  @ApiOperation({ summary: 'Get all reviews for admin (across all podcasts)' })
  @ApiQuery({ name: 'page', required: false, description: 'Page number', example: 1 })
  @ApiQuery({ name: 'limit', required: false, description: 'Items per page', example: 20 })
  @ApiQuery({ name: 'search', required: false, description: 'Search in title and content' })
  @ApiQuery({ name: 'podcastId', required: false, description: 'Filter by podcast' })
  @ApiQuery({ name: 'rating', required: false, description: 'Filter by rating (1-5)' })
  @ApiQuery({ name: 'isPublic', required: false, description: 'Filter by visibility' })
  @ApiResponse({ status: 200, description: 'List of reviews' })
  findAllAdmin(
    @CurrentUser() user: JwtPayload,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('search') search?: string,
    @Query('podcastId') podcastId?: string,
    @Query('rating') rating?: number,
    @Query('isPublic') isPublic?: string,
  ) {
    return this.service.findAllAdmin(user.tenantId, {
      page: page ? +page : 1,
      limit: limit ? +limit : 20,
      search,
      podcastId,
      rating: rating ? +rating : undefined,
      isPublic: isPublic === 'true' ? true : isPublic === 'false' ? false : undefined,
    });
  }

  @Get(':id')
  @Roles(UserRole.ADMIN, UserRole.EDITOR)
  @ApiOperation({ summary: 'Get single review by ID' })
  @ApiResponse({ status: 200, description: 'Review details' })
  @ApiResponse({ status: 404, description: 'Review not found' })
  findOne(@Param('id') id: string) {
    return this.service.findById(id);
  }

  @Patch(':id/visibility')
  @Roles(UserRole.ADMIN, UserRole.EDITOR)
  @ApiOperation({ summary: 'Toggle review visibility (hide/show)' })
  @ApiResponse({ status: 200, description: 'Review visibility updated' })
  @ApiResponse({ status: 404, description: 'Review not found' })
  toggleVisibility(
    @Param('id') id: string,
    @Body() body: { isPublic: boolean },
  ) {
    return this.service.updateVisibility(id, body.isPublic);
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a review (admin only)' })
  @ApiResponse({ status: 204, description: 'Review deleted' })
  @ApiResponse({ status: 404, description: 'Review not found' })
  remove(@Param('id') id: string) {
    return this.service.deleteAdmin(id);
  }
}
