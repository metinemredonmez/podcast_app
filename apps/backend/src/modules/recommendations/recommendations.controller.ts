import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { RecommendationsService } from './recommendations.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@ApiTags('Recommendations')
@Controller('recommendations')
export class RecommendationsController {
  constructor(private readonly service: RecommendationsService) {}

  @Get('for-you')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  getForYou(@CurrentUser() user: any, @Query('limit') limit?: number) {
    return this.service.getForYou(user.userId, limit ? +limit : 10);
  }

  @Get('similar/:podcastId')
  getSimilar(@Param('podcastId') podcastId: string, @Query('limit') limit?: number) {
    return this.service.getSimilar(podcastId, limit ? +limit : 10);
  }

  @Get('trending')
  getTrending(@Query('limit') limit?: number) {
    return this.service.getTrending(limit ? +limit : 10);
  }
}
