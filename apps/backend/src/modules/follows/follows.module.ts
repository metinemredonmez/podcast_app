import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FollowsController } from './follows.controller';
import { FollowsService } from './follows.service';
import { FollowEntity } from './entities/follow.entity';

@Module({
  imports: [TypeOrmModule.forFeature([FollowEntity])],
  controllers: [FollowsController],
  providers: [FollowsService],
  exports: [FollowsService],
})
export class FollowsModule {}
