import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AnalyticsController } from './analytics.controller';
import { AnalyticsService } from './analytics.service';
import { PlayEventEntity } from './entities/play-event.entity';
import { UserActivityEntity } from './entities/user-activity.entity';

@Module({
  imports: [TypeOrmModule.forFeature([PlayEventEntity, UserActivityEntity])],
  controllers: [AnalyticsController],
  providers: [AnalyticsService],
  exports: [AnalyticsService],
})
export class AnalyticsModule {}
