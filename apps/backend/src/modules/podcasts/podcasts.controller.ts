import { Body, Controller, Delete, Get, Header, HttpCode, HttpStatus, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { PodcastsService } from './podcasts.service';
import { CursorPaginationDto, PaginatedResponseDto } from '../../common/dto/cursor-pagination.dto';
import { ApiBearerAuth, ApiOperation, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';
import { ApiCursorPaginatedResponse } from '../../common/decorators/api-paginated-response.decorator';
import { CreatePodcastDto } from './dto/create-podcast.dto';
import { UpdatePodcastDto } from './dto/update-podcast.dto';
import { SearchPodcastsDto } from './dto/search-podcasts.dto';
import { PodcastResponseDto } from './dto/podcast-response.dto';
import { PodcastDetailDto } from './dto/podcast-detail.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Public } from '../../common/decorators/public.decorator';
import { UserRole } from '../../common/enums/prisma.enums';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { JwtPayload } from '../auth/interfaces/jwt-payload.interface';
import { RssService } from './services/rss.service';

@ApiTags('Podcasts')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('podcasts')
export class PodcastsController {
  constructor(
    private readonly service: PodcastsService,
    private readonly rssService: RssService,
  ) {}

  @Get()
  @ApiOperation({ summary: 'List podcasts with cursor-based pagination' })
  @ApiQuery({ name: 'cursor', required: false, description: 'Base64-encoded id cursor' })
  @ApiQuery({ name: 'limit', required: false, description: 'Max items to return (1-100)', schema: { default: 20 } })
  @ApiQuery({ name: 'orderBy', required: false, schema: { default: 'createdAt' } })
  @ApiQuery({ name: 'orderDirection', required: false, schema: { default: 'desc', enum: ['asc', 'desc'] } })
  @ApiQuery({ name: 'tenantId', required: false, description: 'Override tenant (admins only)' })
  @ApiCursorPaginatedResponse({
    type: 'object',
    properties: {
      id: { type: 'string', format: 'uuid' },
      tenantId: { type: 'string', format: 'uuid' },
      ownerId: { type: 'string', format: 'uuid' },
      title: { type: 'string' },
      slug: { type: 'string' },
      description: { type: 'string', nullable: true },
      isPublished: { type: 'boolean' },
      publishedAt: { type: 'string', format: 'date-time', nullable: true },
      createdAt: { type: 'string', format: 'date-time' },
      updatedAt: { type: 'string', format: 'date-time' },
    },
  })
  @ApiResponse({ status: 400, description: 'Validation error' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 429, description: 'Rate limit exceeded' })
  @ApiResponse({ status: 500, description: 'Server error' })
  findAll(
    @Query() query: CursorPaginationDto & { tenantId?: string },
    @CurrentUser() user: JwtPayload,
  ): Promise<PaginatedResponseDto<PodcastResponseDto>> {
    return this.service.findAll(query, user);
  }

  @Get('search')
  @ApiOperation({
    summary: 'Search and filter podcasts with cursor-based pagination',
    description: 'Search by title/description, filter by category, owner, and published status',
  })
  @ApiQuery({ name: 'search', required: false, description: 'Search term for title and description' })
  @ApiQuery({ name: 'categoryId', required: false, description: 'Filter by category ID' })
  @ApiQuery({ name: 'ownerId', required: false, description: 'Filter by owner/creator ID' })
  @ApiQuery({ name: 'isPublished', required: false, description: 'Filter by published status', type: Boolean })
  @ApiQuery({ name: 'cursor', required: false, description: 'Base64-encoded id cursor' })
  @ApiQuery({ name: 'limit', required: false, description: 'Max items to return (1-100)', schema: { default: 20 } })
  @ApiQuery({ name: 'orderBy', required: false, schema: { default: 'createdAt' } })
  @ApiQuery({ name: 'orderDirection', required: false, schema: { default: 'desc', enum: ['asc', 'desc'] } })
  @ApiQuery({ name: 'tenantId', required: false, description: 'Override tenant (admins only)' })
  @ApiCursorPaginatedResponse({
    type: 'object',
    properties: {
      id: { type: 'string', format: 'uuid' },
      tenantId: { type: 'string', format: 'uuid' },
      ownerId: { type: 'string', format: 'uuid' },
      title: { type: 'string' },
      slug: { type: 'string' },
      description: { type: 'string', nullable: true },
      isPublished: { type: 'boolean' },
      publishedAt: { type: 'string', format: 'date-time', nullable: true },
      createdAt: { type: 'string', format: 'date-time' },
      updatedAt: { type: 'string', format: 'date-time' },
    },
  })
  @ApiResponse({ status: 400, description: 'Validation error' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  search(@Query() query: SearchPodcastsDto, @CurrentUser() user: JwtPayload): Promise<PaginatedResponseDto<PodcastResponseDto>> {
    return this.service.search(query, user);
  }

  @Get(':id')
  @ApiQuery({ name: 'tenantId', required: false, description: 'Tenant override (admins only)' })
  findOne(
    @Param('id') id: string,
    @Query('tenantId') tenantId: string | undefined,
    @CurrentUser() user: JwtPayload,
  ): Promise<PodcastDetailDto> {
    return this.service.findOne(id, user, tenantId);
  }

  @Post()
  @Roles(UserRole.CREATOR, UserRole.ADMIN)
  @ApiOperation({ summary: 'Create a podcast' })
  @ApiResponse({ status: 201, description: 'Podcast created' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 409, description: 'Slug already exists' })
  create(@Body() payload: CreatePodcastDto, @CurrentUser() user: JwtPayload): Promise<PodcastResponseDto> {
    return this.service.create(payload, user);
  }

  @Patch(':id')
  @Roles(UserRole.CREATOR, UserRole.ADMIN)
  @ApiOperation({ summary: 'Update a podcast' })
  @ApiQuery({ name: 'tenantId', required: false, description: 'Tenant override (admins only)' })
  @ApiResponse({ status: 200, description: 'Podcast updated' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - not owner or admin' })
  @ApiResponse({ status: 404, description: 'Podcast not found' })
  update(
    @Param('id') id: string,
    @Body() payload: UpdatePodcastDto,
    @Query('tenantId') tenantId: string | undefined,
    @CurrentUser() user: JwtPayload,
  ): Promise<PodcastResponseDto> {
    return this.service.update(id, payload, user, tenantId);
  }

  @Delete(':id')
  @Roles(UserRole.CREATOR, UserRole.ADMIN)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a podcast' })
  @ApiQuery({ name: 'tenantId', required: false, description: 'Tenant override (admins only)' })
  @ApiResponse({ status: 204, description: 'Podcast deleted' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - not owner or admin' })
  @ApiResponse({ status: 404, description: 'Podcast not found' })
  delete(
    @Param('id') id: string,
    @Query('tenantId') tenantId: string | undefined,
    @CurrentUser() user: JwtPayload,
  ): Promise<void> {
    return this.service.delete(id, user, tenantId);
  }

  @Post(':id/publish')
  @Roles(UserRole.CREATOR, UserRole.ADMIN)
  @ApiOperation({ summary: 'Publish a podcast' })
  @ApiQuery({ name: 'tenantId', required: false, description: 'Tenant override (admins only)' })
  @ApiResponse({ status: 200, description: 'Podcast published', type: PodcastResponseDto })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - not owner or admin' })
  @ApiResponse({ status: 404, description: 'Podcast not found' })
  publish(
    @Param('id') id: string,
    @Query('tenantId') tenantId: string | undefined,
    @CurrentUser() user: JwtPayload,
  ): Promise<PodcastResponseDto> {
    return this.service.publish(id, user, tenantId);
  }

  @Post(':id/unpublish')
  @Roles(UserRole.CREATOR, UserRole.ADMIN)
  @ApiOperation({ summary: 'Unpublish a podcast' })
  @ApiQuery({ name: 'tenantId', required: false, description: 'Tenant override (admins only)' })
  @ApiResponse({ status: 200, description: 'Podcast unpublished', type: PodcastResponseDto })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - not owner or admin' })
  @ApiResponse({ status: 404, description: 'Podcast not found' })
  unpublish(
    @Param('id') id: string,
    @Query('tenantId') tenantId: string | undefined,
    @CurrentUser() user: JwtPayload,
  ): Promise<PodcastResponseDto> {
    return this.service.unpublish(id, user, tenantId);
  }

  @Public()
  @Get(':id/rss.xml')
  @Header('Content-Type', 'application/rss+xml; charset=utf-8')
  @ApiOperation({
    summary: 'Get RSS feed for podcast (Apple Podcasts & Spotify compatible)',
    description: 'Public endpoint - no authentication required. Returns RSS 2.0 feed with iTunes tags.',
  })
  @ApiResponse({ status: 200, description: 'RSS feed XML', type: String })
  @ApiResponse({ status: 404, description: 'Podcast not found' })
  async getRssFeed(
    @Param('id') id: string,
    @Query('tenantId') tenantId?: string,
  ): Promise<string> {
    // Use default tenant if not specified (for public access)
    const resolvedTenantId = tenantId || process.env.DEFAULT_TENANT_ID || 'default';
    return this.rssService.generatePodcastRssFeed(id, resolvedTenantId);
  }
}
