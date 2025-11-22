import { Controller, Get, Param, Res, Headers, NotFoundException } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiParam, ApiResponse, ApiHeader } from '@nestjs/swagger';
import { Response } from 'express';
import { RssService } from './rss.service';
import { Public } from '../../common/decorators/public.decorator';

@ApiTags('RSS')
@Controller('rss')
export class RssController {
  constructor(private readonly rssService: RssService) {}

  @Public()
  @Get(':slug')
  @ApiOperation({ summary: 'Get RSS feed for a podcast' })
  @ApiParam({ name: 'slug', description: 'Podcast slug' })
  @ApiHeader({ name: 'X-Tenant-Id', required: true, description: 'Tenant identifier' })
  @ApiResponse({ status: 200, description: 'RSS feed XML' })
  @ApiResponse({ status: 404, description: 'Podcast not found' })
  async getFeed(
    @Param('slug') slug: string,
    @Headers('x-tenant-id') tenantId: string,
    @Res() res: Response,
  ): Promise<void> {
    if (!tenantId) {
      throw new NotFoundException('Tenant ID is required');
    }

    const xml = await this.rssService.generateFeed(slug, tenantId);

    res.set({
      'Content-Type': 'application/rss+xml; charset=utf-8',
      'Cache-Control': 'public, max-age=3600',
      'ETag': `"${Buffer.from(xml).length}"`,
    });

    res.send(xml);
  }

  @Public()
  @Get(':slug/json')
  @ApiOperation({ summary: 'Get RSS feed metadata as JSON' })
  @ApiParam({ name: 'slug', description: 'Podcast slug' })
  @ApiHeader({ name: 'X-Tenant-Id', required: true, description: 'Tenant identifier' })
  @ApiResponse({ status: 200, description: 'RSS feed info' })
  async getFeedInfo(
    @Param('slug') slug: string,
    @Headers('x-tenant-id') tenantId: string,
  ): Promise<{ feedUrl: string; slug: string }> {
    if (!tenantId) {
      throw new NotFoundException('Tenant ID is required');
    }

    const baseUrl = process.env.BASE_URL || 'https://api.example.com';

    return {
      slug,
      feedUrl: `${baseUrl}/api/rss/${slug}`,
    };
  }
}
