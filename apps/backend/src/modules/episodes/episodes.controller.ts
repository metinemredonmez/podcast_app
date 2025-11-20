import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { EpisodesService } from './episodes.service';
import { CursorPaginationDto, PaginatedResponseDto } from '../../common/dto/cursor-pagination.dto';
import { ApiBearerAuth, ApiOperation, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';
import { ApiCursorPaginatedResponse } from '../../common/decorators/api-paginated-response.decorator';
import { CreateEpisodeDto } from './dto/create-episode.dto';
import { EpisodeResponseDto } from './dto/episode-response.dto';
import { UpdateEpisodeDto } from './dto/update-episode.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '../../common/enums/prisma.enums';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtPayload } from '../auth/interfaces/jwt-payload.interface';

@ApiTags('Episodes')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('episodes')
export class EpisodesController {
  constructor(private readonly service: EpisodesService) {}

  @Get()
  @ApiOperation({ summary: 'List episodes with cursor-based pagination' })
  @ApiQuery({ name: 'cursor', required: false, description: 'Base64-encoded id cursor' })
  @ApiQuery({ name: 'limit', required: false, description: 'Max items to return (1-100)', schema: { default: 20 } })
  @ApiQuery({ name: 'orderBy', required: false, schema: { default: 'publishedAt' } })
  @ApiQuery({ name: 'orderDirection', required: false, schema: { default: 'desc', enum: ['asc', 'desc'] } })
  @ApiQuery({ name: 'tenantId', required: false, description: 'Override tenant (admins only)' })
  @ApiCursorPaginatedResponse({
    type: 'object',
    properties: {
      id: { type: 'string', format: 'uuid' },
      tenantId: { type: 'string', format: 'uuid' },
      podcastId: { type: 'string', format: 'uuid' },
      title: { type: 'string' },
      slug: { type: 'string' },
      duration: { type: 'number' },
      audioUrl: { type: 'string' },
      isPublished: { type: 'boolean' },
      publishedAt: { type: 'string', format: 'date-time', nullable: true },
      createdAt: { type: 'string', format: 'date-time' },
    },
  })
  @ApiResponse({ status: 400, description: 'Validation error' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 429, description: 'Rate limit exceeded' })
  @ApiResponse({ status: 500, description: 'Server error' })
  findAll(
    @Query() query: CursorPaginationDto & { tenantId?: string },
    @CurrentUser() user: JwtPayload,
  ): Promise<PaginatedResponseDto<EpisodeResponseDto>> {
    return this.service.findAll(query, user);
  }

  @Get(':id')
  @ApiQuery({ name: 'tenantId', required: false, description: 'Tenant override (admins only)' })
  findOne(
    @Param('id') id: string,
    @Query('tenantId') tenantId: string | undefined,
    @CurrentUser() user: JwtPayload,
  ): Promise<EpisodeResponseDto> {
    return this.service.findOne(id, user, tenantId);
  }

  @Post()
  @Roles(UserRole.CREATOR, UserRole.ADMIN)
  @ApiOperation({ summary: 'Create an episode' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  create(@Body() payload: CreateEpisodeDto, @CurrentUser() user: JwtPayload): Promise<EpisodeResponseDto> {
    return this.service.create(payload, user);
  }

  @Patch(':id')
  @Roles(UserRole.CREATOR, UserRole.ADMIN)
  @ApiOperation({ summary: 'Update an episode' })
  @ApiResponse({ status: 200, description: 'Episode updated' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'Episode not found' })
  update(
    @Param('id') id: string,
    @Body() payload: UpdateEpisodeDto,
    @CurrentUser() user: JwtPayload,
  ): Promise<EpisodeResponseDto> {
    return this.service.update(id, payload, user);
  }

  @Delete(':id')
  @Roles(UserRole.CREATOR, UserRole.ADMIN)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete an episode' })
  @ApiQuery({ name: 'tenantId', required: false, description: 'Tenant override (admins only)' })
  @ApiResponse({ status: 204, description: 'Episode deleted' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'Episode not found' })
  delete(
    @Param('id') id: string,
    @Query('tenantId') tenantId: string | undefined,
    @CurrentUser() user: JwtPayload,
  ): Promise<void> {
    return this.service.delete(id, user, tenantId);
  }
}
