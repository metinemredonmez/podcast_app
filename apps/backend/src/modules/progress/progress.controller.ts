import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, Put, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { ProgressService } from './progress.service';
import { ProgressResponseDto } from './dto/progress-response.dto';
import { UpdateProgressDto } from './dto/update-progress.dto';
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
}
