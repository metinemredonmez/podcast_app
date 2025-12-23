import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { DownloadsService } from './downloads.service';
import { CreateDownloadDto } from './dto/create-download.dto';
import { DownloadResponseDto } from './dto/download-response.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { JwtPayload } from '../auth/interfaces/jwt-payload.interface';

@ApiTags('Downloads')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('downloads')
export class DownloadsController {
  constructor(private readonly service: DownloadsService) {}

  @Get()
  @ApiOperation({ summary: 'Get all user downloads' })
  @ApiResponse({ status: 200, description: 'List of downloads', type: [DownloadResponseDto] })
  findAll(@CurrentUser() user: JwtPayload): Promise<DownloadResponseDto[]> {
    return this.service.findAll(user);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get download by ID' })
  @ApiResponse({ status: 200, description: 'Download details', type: DownloadResponseDto })
  @ApiResponse({ status: 404, description: 'Download not found' })
  findOne(@Param('id') id: string, @CurrentUser() user: JwtPayload): Promise<DownloadResponseDto> {
    return this.service.findOne(id, user);
  }

  @Post()
  @ApiOperation({ summary: 'Create new download record' })
  @ApiResponse({ status: 201, description: 'Download created', type: DownloadResponseDto })
  create(@Body() dto: CreateDownloadDto, @CurrentUser() user: JwtPayload): Promise<DownloadResponseDto> {
    return this.service.create(dto, user);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete download record' })
  @ApiResponse({ status: 204, description: 'Download deleted' })
  @ApiResponse({ status: 404, description: 'Download not found' })
  remove(@Param('id') id: string, @CurrentUser() user: JwtPayload): Promise<void> {
    return this.service.remove(id, user);
  }
}
