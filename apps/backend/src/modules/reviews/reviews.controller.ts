import { Controller, Get, Post, Patch, Delete, Param, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { ReviewsService } from './reviews.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@ApiTags('Reviews')
@Controller('podcasts/:podcastId/reviews')
export class ReviewsController {
  constructor(private readonly service: ReviewsService) {}

  @Get()
  findAll(@Param('podcastId') podcastId: string) {
    return this.service.findAll(podcastId);
  }

  @Post()
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  create(@Param('podcastId') podcastId: string, @CurrentUser() user: any, @Body() data: any) {
    return this.service.create(user.userId, podcastId, data);
  }

  @Patch(':id')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  update(@Param('id') id: string, @CurrentUser() user: any, @Body() data: any) {
    return this.service.update(id, user.userId, data);
  }

  @Delete(':id')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  remove(@Param('id') id: string, @CurrentUser() user: any) {
    return this.service.delete(id, user.userId);
  }

  @Post(':id/helpful')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  voteHelpful(@Param('id') id: string, @CurrentUser() user: any, @Body() body: { isHelpful: boolean }) {
    return this.service.voteHelpful(id, user.userId, body.isHelpful);
  }
}
