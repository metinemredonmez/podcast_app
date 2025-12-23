import { Controller, Get, Post, Patch, Delete, Param, Body, Query, UseGuards, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse, ApiParam, ApiQuery } from '@nestjs/swagger';
import { ReviewsService } from './reviews.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { JwtPayload } from '../auth/interfaces/jwt-payload.interface';
import { CreateReviewDto } from './dto/create-review.dto';
import { UpdateReviewDto } from './dto/update-review.dto';
import { Public } from '../../common/decorators/public.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '../../common/enums/prisma.enums';

@ApiTags('Reviews')
@Controller('podcasts/:podcastId/reviews')
export class ReviewsController {
  constructor(private readonly service: ReviewsService) {}

  @Get()
  @Public()
  @ApiOperation({ summary: 'Get all reviews for a podcast' })
  @ApiParam({ name: 'podcastId', description: 'Podcast ID' })
  @ApiQuery({ name: 'page', required: false, description: 'Page number', example: 1 })
  @ApiQuery({ name: 'limit', required: false, description: 'Items per page', example: 20 })
  @ApiResponse({ status: 200, description: 'List of reviews' })
  findAll(
    @Param('podcastId') podcastId: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.service.findAll(podcastId, page ? +page : 1, limit ? +limit : 20);
  }

  @Get('summary')
  @Public()
  @ApiOperation({ summary: 'Get review summary (average rating, count)' })
  @ApiParam({ name: 'podcastId', description: 'Podcast ID' })
  @ApiResponse({ status: 200, description: 'Review summary' })
  getSummary(@Param('podcastId') podcastId: string) {
    return this.service.getSummary(podcastId);
  }

  @Get(':id')
  @Public()
  @ApiOperation({ summary: 'Get single review' })
  @ApiParam({ name: 'podcastId', description: 'Podcast ID' })
  @ApiParam({ name: 'id', description: 'Review ID' })
  @ApiResponse({ status: 200, description: 'Review details' })
  @ApiResponse({ status: 404, description: 'Review not found' })
  findOne(@Param('id') id: string) {
    return this.service.findById(id);
  }

  @Post()
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Create a review' })
  @ApiParam({ name: 'podcastId', description: 'Podcast ID' })
  @ApiResponse({ status: 201, description: 'Review created' })
  @ApiResponse({ status: 400, description: 'Invalid input or already reviewed' })
  create(
    @Param('podcastId') podcastId: string,
    @CurrentUser() user: JwtPayload,
    @Body() dto: CreateReviewDto,
  ) {
    return this.service.create(user.userId, podcastId, dto);
  }

  @Patch(':id')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Update a review' })
  @ApiParam({ name: 'podcastId', description: 'Podcast ID' })
  @ApiParam({ name: 'id', description: 'Review ID' })
  @ApiResponse({ status: 200, description: 'Review updated' })
  @ApiResponse({ status: 403, description: 'Not authorized' })
  @ApiResponse({ status: 404, description: 'Review not found' })
  update(
    @Param('id') id: string,
    @CurrentUser() user: JwtPayload,
    @Body() dto: UpdateReviewDto,
  ) {
    return this.service.update(id, user.userId, dto);
  }

  @Delete(':id')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a review' })
  @ApiParam({ name: 'podcastId', description: 'Podcast ID' })
  @ApiParam({ name: 'id', description: 'Review ID' })
  @ApiResponse({ status: 204, description: 'Review deleted' })
  @ApiResponse({ status: 403, description: 'Not authorized' })
  @ApiResponse({ status: 404, description: 'Review not found' })
  remove(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    return this.service.delete(id, user.userId);
  }

  @Post(':id/helpful')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Mark review as helpful/not helpful' })
  @ApiParam({ name: 'podcastId', description: 'Podcast ID' })
  @ApiParam({ name: 'id', description: 'Review ID' })
  @ApiResponse({ status: 200, description: 'Vote recorded' })
  voteHelpful(
    @Param('id') id: string,
    @CurrentUser() user: JwtPayload,
    @Body() body: { isHelpful: boolean },
  ) {
    return this.service.voteHelpful(id, user.userId, body.isHelpful);
  }
}
