import { Body, Controller, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { EpisodesService } from './episodes.service';
import { CursorPaginationDto, PaginatedResponseDto } from '../../common/dto/cursor-pagination.dto';
import { ApiBearerAuth, ApiOperation, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';
import { ApiCursorPaginatedResponse } from '../../common/decorators/api-paginated-response.decorator';
import { CreateEpisodeDto } from './dto/create-episode.dto';
import { EpisodeResponseDto } from './dto/episode-response.dto';
import { UpdateEpisodeDto } from './dto/update-episode.dto';

@ApiTags('Episodes')
@ApiBearerAuth()
@Controller('episodes')
export class EpisodesController {
  constructor(private readonly service: EpisodesService) {}

  @Get()
  @ApiOperation({ summary: 'List episodes with cursor-based pagination' })
  @ApiQuery({ name: 'cursor', required: false, description: 'Base64-encoded id cursor' })
  @ApiQuery({ name: 'limit', required: false, description: 'Max items to return (1-100)', schema: { default: 20 } })
  @ApiQuery({ name: 'orderBy', required: false, schema: { default: 'publishedAt' } })
  @ApiQuery({ name: 'orderDirection', required: false, schema: { default: 'desc', enum: ['asc', 'desc'] } })
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
  findAll(@Query() query: CursorPaginationDto): Promise<PaginatedResponseDto<EpisodeResponseDto>> {
    return this.service.findAll(query);
  }

  @Get(':id')
  findOne(@Param('id') id: string): Promise<EpisodeResponseDto> {
    return this.service.findOne(id);
  }

  @Post()
  create(@Body() payload: CreateEpisodeDto): Promise<EpisodeResponseDto> {
    return this.service.create(payload);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() payload: UpdateEpisodeDto): Promise<EpisodeResponseDto> {
    return this.service.update(id, payload);
  }
}
