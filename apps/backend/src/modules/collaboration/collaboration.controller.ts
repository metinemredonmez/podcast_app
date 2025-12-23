import { Controller, Get, Post, Delete, Patch, Body, Param, UseGuards, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse, ApiParam } from '@nestjs/swagger';
import { CollaborationService } from './collaboration.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { JwtPayload } from '../auth/interfaces/jwt-payload.interface';
import { InviteCollaboratorDto } from './dto/invite-collaborator.dto';
import { UpdateCollaboratorDto, RespondInviteDto } from './dto/update-collaborator.dto';

@ApiTags('Podcast Collaboration')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('podcasts/:podcastId/collaborators')
export class CollaborationController {
  constructor(private readonly service: CollaborationService) {}

  @Get()
  @ApiOperation({ summary: 'Get all collaborators for a podcast' })
  @ApiParam({ name: 'podcastId', description: 'Podcast ID' })
  @ApiResponse({ status: 200, description: 'List of collaborators' })
  getCollaborators(@Param('podcastId') podcastId: string) {
    return this.service.getCollaborators(podcastId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get single collaborator details' })
  @ApiParam({ name: 'podcastId', description: 'Podcast ID' })
  @ApiParam({ name: 'id', description: 'Collaborator ID' })
  @ApiResponse({ status: 200, description: 'Collaborator details' })
  @ApiResponse({ status: 404, description: 'Collaborator not found' })
  getOne(@Param('id') id: string) {
    return this.service.getById(id);
  }

  @Post()
  @ApiOperation({ summary: 'Invite a collaborator to podcast' })
  @ApiParam({ name: 'podcastId', description: 'Podcast ID' })
  @ApiResponse({ status: 201, description: 'Invitation sent' })
  @ApiResponse({ status: 400, description: 'Invalid input' })
  @ApiResponse({ status: 409, description: 'User already invited' })
  invite(
    @Param('podcastId') podcastId: string,
    @Body() dto: InviteCollaboratorDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.service.invite(podcastId, dto.userId!, dto.role, dto.permissions, user.userId);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update collaborator role or permissions' })
  @ApiParam({ name: 'podcastId', description: 'Podcast ID' })
  @ApiParam({ name: 'id', description: 'Collaborator ID' })
  @ApiResponse({ status: 200, description: 'Collaborator updated' })
  @ApiResponse({ status: 404, description: 'Collaborator not found' })
  update(
    @Param('id') id: string,
    @Body() dto: UpdateCollaboratorDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.service.update(id, dto, user.userId);
  }

  @Patch(':id/respond')
  @ApiOperation({ summary: 'Accept or reject collaboration invite' })
  @ApiParam({ name: 'podcastId', description: 'Podcast ID' })
  @ApiParam({ name: 'id', description: 'Collaborator ID' })
  @ApiResponse({ status: 200, description: 'Response recorded' })
  @ApiResponse({ status: 400, description: 'Invalid response' })
  respond(
    @Param('id') id: string,
    @Body() dto: RespondInviteDto,
    @CurrentUser() user: JwtPayload,
  ) {
    if (dto.response === 'ACCEPTED') {
      return this.service.accept(id, user.userId);
    }
    return this.service.reject(id, user.userId);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Remove collaborator from podcast' })
  @ApiParam({ name: 'podcastId', description: 'Podcast ID' })
  @ApiParam({ name: 'id', description: 'Collaborator ID' })
  @ApiResponse({ status: 204, description: 'Collaborator removed' })
  @ApiResponse({ status: 404, description: 'Collaborator not found' })
  remove(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    return this.service.remove(id, user.userId);
  }
}
