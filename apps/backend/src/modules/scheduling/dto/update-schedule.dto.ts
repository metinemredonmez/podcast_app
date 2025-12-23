import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsDate, IsIn, IsOptional, IsString, MaxLength, MinDate } from 'class-validator';

export class UpdateScheduleDto {
  @ApiPropertyOptional({ description: 'New scheduled date/time (ISO 8601)' })
  @IsOptional()
  @Type(() => Date)
  @IsDate()
  @MinDate(new Date(), { message: 'Scheduled time must be in the future' })
  scheduledAt?: Date;

  @ApiPropertyOptional({ type: String, enum: ['PENDING', 'PUBLISHED', 'FAILED', 'CANCELLED'], description: 'Update status' })
  @IsOptional()
  @IsIn(['PENDING', 'PUBLISHED', 'FAILED', 'CANCELLED'])
  status?: 'PENDING' | 'PUBLISHED' | 'FAILED' | 'CANCELLED';

  @ApiPropertyOptional({ maxLength: 500, description: 'Updated notes' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  notes?: string;
}
