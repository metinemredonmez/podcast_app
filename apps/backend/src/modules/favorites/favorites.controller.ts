import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { FavoritesService } from './favorites.service';
import { AddFavoriteDto } from './dto/add-favorite.dto';
import { FavoriteResponseDto } from './dto/favorite-response.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtPayload } from '../auth/interfaces/jwt-payload.interface';

@ApiTags('Favorites')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('favorites')
export class FavoritesController {
  constructor(private readonly service: FavoritesService) {}

  @Get()
  @ApiOperation({ summary: 'Get all favorites for current user' })
  @ApiResponse({ status: 200, description: 'List of favorites', type: [FavoriteResponseDto] })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  findAll(@CurrentUser() user: JwtPayload): Promise<FavoriteResponseDto[]> {
    return this.service.findAll({ userId: user.sub, tenantId: user.tenantId });
  }

  @Get('check')
  @ApiOperation({ summary: 'Check if podcast or episode is favorited' })
  @ApiResponse({ status: 200, description: 'Favorite status' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  checkIsFavorited(
    @Query('podcastId') podcastId: string | undefined,
    @Query('episodeId') episodeId: string | undefined,
    @CurrentUser() user: JwtPayload,
  ): Promise<{ isFavorited: boolean; favoriteId?: string }> {
    return this.service.checkIsFavorited(podcastId, episodeId, { userId: user.sub, tenantId: user.tenantId });
  }

  @Post()
  @ApiOperation({ summary: 'Add podcast or episode to favorites' })
  @ApiResponse({ status: 201, description: 'Favorite added', type: FavoriteResponseDto })
  @ApiResponse({ status: 400, description: 'Already favorited or invalid request' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Podcast or episode not found' })
  add(@Body() dto: AddFavoriteDto, @CurrentUser() user: JwtPayload): Promise<FavoriteResponseDto> {
    return this.service.add(dto, { userId: user.sub, tenantId: user.tenantId });
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Remove from favorites' })
  @ApiResponse({ status: 204, description: 'Favorite removed' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Favorite not found' })
  remove(@Param('id') id: string, @CurrentUser() user: JwtPayload): Promise<void> {
    return this.service.remove(id, { userId: user.sub, tenantId: user.tenantId });
  }
}
