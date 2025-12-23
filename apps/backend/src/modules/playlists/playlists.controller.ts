import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { PlaylistsService } from './playlists.service';
import { CreatePlaylistDto } from './dto/create-playlist.dto';
import { UpdatePlaylistDto } from './dto/update-playlist.dto';
import { AddEpisodeToPlaylistDto } from './dto/add-episode.dto';
import { PlaylistResponseDto } from './dto/playlist-response.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { JwtPayload } from '../auth/interfaces/jwt-payload.interface';

@ApiTags('Playlists')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('playlists')
export class PlaylistsController {
  constructor(private readonly service: PlaylistsService) {}

  @Get()
  @ApiOperation({ summary: 'Get all user playlists' })
  @ApiResponse({ status: 200, description: 'List of playlists', type: [PlaylistResponseDto] })
  findAll(@CurrentUser() user: JwtPayload): Promise<PlaylistResponseDto[]> {
    return this.service.findAll(user);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get playlist by ID with episodes' })
  @ApiResponse({ status: 200, description: 'Playlist details', type: PlaylistResponseDto })
  @ApiResponse({ status: 404, description: 'Playlist not found' })
  findOne(@Param('id') id: string, @CurrentUser() user: JwtPayload): Promise<PlaylistResponseDto> {
    return this.service.findOne(id, user);
  }

  @Post()
  @ApiOperation({ summary: 'Create new playlist' })
  @ApiResponse({ status: 201, description: 'Playlist created', type: PlaylistResponseDto })
  create(@Body() dto: CreatePlaylistDto, @CurrentUser() user: JwtPayload): Promise<PlaylistResponseDto> {
    return this.service.create(dto, user);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update playlist' })
  @ApiResponse({ status: 200, description: 'Playlist updated', type: PlaylistResponseDto })
  @ApiResponse({ status: 404, description: 'Playlist not found' })
  update(
    @Param('id') id: string,
    @Body() dto: UpdatePlaylistDto,
    @CurrentUser() user: JwtPayload,
  ): Promise<PlaylistResponseDto> {
    return this.service.update(id, dto, user);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete playlist' })
  @ApiResponse({ status: 204, description: 'Playlist deleted' })
  @ApiResponse({ status: 404, description: 'Playlist not found' })
  remove(@Param('id') id: string, @CurrentUser() user: JwtPayload): Promise<void> {
    return this.service.remove(id, user);
  }

  @Post(':id/episodes')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Add episode to playlist' })
  @ApiResponse({ status: 204, description: 'Episode added to playlist' })
  @ApiResponse({ status: 404, description: 'Playlist not found' })
  @ApiResponse({ status: 400, description: 'Episode already in playlist' })
  addEpisode(
    @Param('id') id: string,
    @Body() dto: AddEpisodeToPlaylistDto,
    @CurrentUser() user: JwtPayload,
  ): Promise<void> {
    return this.service.addEpisode(id, dto, user);
  }

  @Delete(':id/episodes/:episodeId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Remove episode from playlist' })
  @ApiResponse({ status: 204, description: 'Episode removed from playlist' })
  @ApiResponse({ status: 404, description: 'Playlist not found' })
  removeEpisode(
    @Param('id') id: string,
    @Param('episodeId') episodeId: string,
    @CurrentUser() user: JwtPayload,
  ): Promise<void> {
    return this.service.removeEpisode(id, episodeId, user);
  }

  @Post(':id/reorder')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Reorder episodes in playlist' })
  @ApiResponse({ status: 204, description: 'Episodes reordered' })
  @ApiResponse({ status: 404, description: 'Playlist not found' })
  reorderEpisodes(
    @Param('id') id: string,
    @Body() episodeOrders: Array<{ episodeId: string; order: number }>,
    @CurrentUser() user: JwtPayload,
  ): Promise<void> {
    return this.service.reorderEpisodes(id, episodeOrders, user);
  }
}
