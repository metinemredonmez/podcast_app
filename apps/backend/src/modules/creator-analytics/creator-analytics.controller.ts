import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { CreatorAnalyticsService } from './creator-analytics.service';
import {
  CreatorOverviewDto,
  PodcastAnalyticsDto,
  EpisodeAnalyticsDto,
} from './dto/creator-analytics-response.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '../../common/enums/prisma.enums';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { JwtPayload } from '../auth/interfaces/jwt-payload.interface';

@ApiTags('Creator Analytics')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.CREATOR, UserRole.ADMIN)
@Controller('creator/analytics')
export class CreatorAnalyticsController {
  constructor(private readonly service: CreatorAnalyticsService) {}

  @Get('overview')
  @ApiOperation({ summary: 'Get creator overview analytics' })
  @ApiResponse({ status: 200, description: 'Creator overview', type: CreatorOverviewDto })
  @ApiResponse({ status: 403, description: 'Forbidden - Creator access required' })
  getOverview(@CurrentUser() user: JwtPayload): Promise<CreatorOverviewDto> {
    return this.service.getOverview(user);
  }

  @Get('podcast/:podcastId')
  @ApiOperation({ summary: 'Get podcast analytics' })
  @ApiResponse({ status: 200, description: 'Podcast analytics', type: PodcastAnalyticsDto })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'Podcast not found' })
  getPodcastAnalytics(
    @Param('podcastId') podcastId: string,
    @CurrentUser() user: JwtPayload,
  ): Promise<PodcastAnalyticsDto> {
    return this.service.getPodcastAnalytics(podcastId, user);
  }

  @Get('episode/:episodeId')
  @ApiOperation({ summary: 'Get episode analytics' })
  @ApiResponse({ status: 200, description: 'Episode analytics', type: EpisodeAnalyticsDto })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'Episode not found' })
  getEpisodeAnalytics(
    @Param('episodeId') episodeId: string,
    @CurrentUser() user: JwtPayload,
  ): Promise<EpisodeAnalyticsDto> {
    return this.service.getEpisodeAnalytics(episodeId, user);
  }
}
