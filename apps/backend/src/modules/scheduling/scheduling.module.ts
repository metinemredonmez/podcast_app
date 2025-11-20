import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { SchedulingService } from './scheduling.service';
import { SchedulingController } from './scheduling.controller';

@Module({
  imports: [ScheduleModule.forRoot()],
  controllers: [SchedulingController],
  providers: [SchedulingService],
  exports: [SchedulingService],
})
export class SchedulingModule {}
