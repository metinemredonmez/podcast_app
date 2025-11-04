import { Body, Controller, Get, Param, Post, Query, UseGuards } from '@nestjs/common';
import { PodcastsService } from './podcasts.service';
import { CursorPaginationDto, PaginatedResponseDto } from '../../common/dto/cursor-pagination.dto';
import { ApiBearerAuth, ApiOperation, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';
import { ApiCursorPaginatedResponse } from '../../common/decorators/api-paginated-response.decorator';
import { CreatePodcastDto } from './dto/create-podcast.dto';
import { PodcastResponseDto } from './dto/podcast-response.dto';
import { PodcastDetailDto } from './dto/podcast-detail.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '../../common/enums/prisma.enums';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtPayload } from '../auth/interfaces/jwt-payload.interface';

@ApiTags('Podcasts')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('podcasts')
export class PodcastsController {
  constructor(private readonly service: PodcastsService) {}

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
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  create(@Body() payload: CreatePodcastDto, @CurrentUser() user: JwtPayload): Promise<PodcastResponseDto> {
    return this.service.create(payload, user);
  }
}
