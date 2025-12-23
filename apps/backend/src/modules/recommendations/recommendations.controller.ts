import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse, ApiQuery, ApiParam } from '@nestjs/swagger';
import { RecommendationsService } from './recommendations.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { JwtPayload } from '../auth/interfaces/jwt-payload.interface';

@ApiTags('Recommendations')
@Controller('recommendations')
export class RecommendationsController {
  constructor(private readonly service: RecommendationsService) {}

  @Get('for-you')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Get personalized recommendations' })
  @ApiQuery({ name: 'limit', required: false, description: 'Max results', example: 10 })
  @ApiResponse({ status: 200, description: 'Personalized podcast recommendations' })
  getForYou(@CurrentUser() user: JwtPayload, @Query('limit') limit?: number) {
    return this.service.getForYou(user.userId, limit ? +limit : 10);
  }

  @Get('similar/:podcastId')
  @ApiOperation({ summary: 'Get similar podcasts' })
  @ApiParam({ name: 'podcastId', description: 'Podcast ID' })
  @ApiQuery({ name: 'limit', required: false, description: 'Max results', example: 10 })
  @ApiResponse({ status: 200, description: 'Similar podcasts' })
  getSimilar(@Param('podcastId') podcastId: string, @Query('limit') limit?: number) {
    return this.service.getSimilar(podcastId, limit ? +limit : 10);
  }

  @Get('trending')
  @ApiOperation({ summary: 'Get trending podcasts' })
  @ApiQuery({ name: 'limit', required: false, description: 'Max results', example: 10 })
  @ApiResponse({ status: 200, description: 'Trending podcasts' })
  getTrending(@Query('limit') limit?: number) {
    return this.service.getTrending(limit ? +limit : 10);
  }
}
