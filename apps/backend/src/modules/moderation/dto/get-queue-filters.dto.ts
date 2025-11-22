import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional } from 'class-validator';
import { ModerationStatus } from '@prisma/client';

export class GetQueueFiltersDto {
  @ApiPropertyOptional({
    enum: ModerationStatus,
    description: 'Filter by status',
  })
  @IsOptional()
  @IsEnum(ModerationStatus)
  status?: ModerationStatus;
}
