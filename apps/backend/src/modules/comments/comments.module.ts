import { Module } from '@nestjs/common';
import { CommentsController } from './comments.controller';
import { CommentsAdminController } from './comments-admin.controller';
import { CommentsService } from './comments.service';

@Module({
  imports: [],
  controllers: [CommentsController, CommentsAdminController],
  providers: [CommentsService],
  exports: [CommentsService],
})
export class CommentsModule {}
