import { Controller, Get, Post, Delete, Patch, Body, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { CollaborationService } from './collaboration.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@ApiTags('Podcast Collaboration')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('podcasts/:podcastId/collaborators')
export class CollaborationController {
  constructor(private readonly service: CollaborationService) {}

  @Get()
  getCollaborators(@Param('podcastId') podcastId: string) {
    return this.service.getCollaborators(podcastId);
  }

  @Post()
  invite(@Param('podcastId') podcastId: string, @Body() data: { userId: string; role: string; permissions?: any }) {
    return this.service.invite(podcastId, data.userId, data.role, data.permissions);
  }

  @Patch(':id/accept')
  accept(@Param('id') id: string, @CurrentUser() user: any) {
    return this.service.accept(id, user.userId);
  }

  @Patch(':id/reject')
  reject(@Param('id') id: string, @CurrentUser() user: any) {
    return this.service.reject(id, user.userId);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @CurrentUser() user: any) {
    return this.service.remove(id, user.userId);
  }
}
