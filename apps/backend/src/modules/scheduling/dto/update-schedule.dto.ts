import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsDate, IsEnum, IsOptional, IsString, MaxLength, MinDate } from 'class-validator';
import { ScheduleStatus } from '../../../common/enums/prisma.enums';

export class UpdateScheduleDto {
  @ApiPropertyOptional({ description: 'New scheduled date/time (ISO 8601)' })
  @IsOptional()
  @Type(() => Date)
  @IsDate()
  @MinDate(new Date(), { message: 'Scheduled time must be in the future' })
  scheduledAt?: Date;

  @ApiPropertyOptional({ enum: ScheduleStatus, description: 'Update status' })
  @IsOptional()
  @IsEnum(ScheduleStatus)
  status?: ScheduleStatus;

  @ApiPropertyOptional({ maxLength: 500, description: 'Updated notes' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  notes?: string;
}
