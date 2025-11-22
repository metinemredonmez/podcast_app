import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsDate, IsNotEmpty, IsOptional, IsString, IsUUID, MaxLength, MinDate } from 'class-validator';

export class ScheduleEpisodeDto {
  @ApiProperty({ format: 'uuid', description: 'Episode ID to schedule' })
  @IsUUID()
  @IsNotEmpty()
  episodeId!: string;

  @ApiProperty({ description: 'Scheduled publish date/time (ISO 8601)', example: '2025-01-15T10:00:00Z' })
  @Type(() => Date)
  @IsDate()
  @MinDate(new Date(), { message: 'Scheduled time must be in the future' })
  scheduledAt!: Date;

  @ApiPropertyOptional({ maxLength: 500, description: 'Optional notes for scheduled publish' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  notes?: string;
}
