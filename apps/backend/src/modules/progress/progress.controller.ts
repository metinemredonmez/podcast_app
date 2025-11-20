import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, Put, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';
import { ProgressService } from './progress.service';
import { ProgressResponseDto } from './dto/progress-response.dto';
import { UpdateProgressDto } from './dto/update-progress.dto';
import {
  RecentlyPlayedResponseDto,
  ContinueListeningResponseDto,
  CompletedEpisodesResponseDto,
} from './dto/history-response.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtPayload } from '../auth/interfaces/jwt-payload.interface';

@ApiTags('Progress')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('progress')
export class ProgressController {
  constructor(private readonly service: ProgressService) {}

  @Get()
  @ApiOperation({ summary: 'Get all listening progress for current user' })
  @ApiResponse({ status: 200, description: 'List of progress records', type: [ProgressResponseDto] })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  findAll(@CurrentUser() user: JwtPayload): Promise<ProgressResponseDto[]> {
    return this.service.findAll(user);
  }

  @Get(':episodeId')
  @ApiOperation({ summary: 'Get progress for a specific episode' })
  @ApiResponse({ status: 200, description: 'Progress record', type: ProgressResponseDto })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Progress not found' })
  findOne(@Param('episodeId') episodeId: string, @CurrentUser() user: JwtPayload): Promise<ProgressResponseDto> {
    return this.service.findOne(episodeId, user);
  }

  @Put(':episodeId')
  @ApiOperation({ summary: 'Update or create progress for an episode (upsert)' })
  @ApiResponse({ status: 200, description: 'Progress updated/created', type: ProgressResponseDto })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 400, description: 'Validation error' })
  upsert(
    @Param('episodeId') episodeId: string,
    @Body() payload: UpdateProgressDto,
    @CurrentUser() user: JwtPayload,
  ): Promise<ProgressResponseDto> {
    return this.service.upsert(episodeId, payload, user);
  }

  @Delete(':episodeId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete progress for an episode' })
  @ApiResponse({ status: 204, description: 'Progress deleted' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Progress not found' })
  delete(@Param('episodeId') episodeId: string, @CurrentUser() user: JwtPayload): Promise<void> {
    return this.service.delete(episodeId, user);
  }

  // History Endpoints

  @Get('history/recently-played')
  @ApiOperation({ summary: 'Get recently played episodes' })
  @ApiQuery({ name: 'limit', required: false, type: Number, example: 20 })
  @ApiResponse({ status: 200, description: 'Recently played episodes', type: RecentlyPlayedResponseDto })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  getRecentlyPlayed(
    @CurrentUser() user: JwtPayload,
    @Query('limit') limit?: number,
  ): Promise<RecentlyPlayedResponseDto> {
    return this.service.getRecentlyPlayed(user, limit ? Number(limit) : 20);
  }

  @Get('history/continue-listening')
  @ApiOperation({ summary: 'Get episodes to continue listening (not completed, with progress > 0)' })
  @ApiQuery({ name: 'limit', required: false, type: Number, example: 20 })
  @ApiResponse({ status: 200, description: 'Episodes to continue', type: ContinueListeningResponseDto })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  getContinueListening(
    @CurrentUser() user: JwtPayload,
    @Query('limit') limit?: number,
  ): Promise<ContinueListeningResponseDto> {
    return this.service.getContinueListening(user, limit ? Number(limit) : 20);
  }

  @Get('history/completed')
  @ApiOperation({ summary: 'Get completed episodes' })
  @ApiQuery({ name: 'limit', required: false, type: Number, example: 50 })
  @ApiResponse({ status: 200, description: 'Completed episodes', type: CompletedEpisodesResponseDto })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  getCompleted(@CurrentUser() user: JwtPayload, @Query('limit') limit?: number): Promise<CompletedEpisodesResponseDto> {
    return this.service.getCompleted(user, limit ? Number(limit) : 50);
  }
}
