import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsOptional, IsString } from 'class-validator';
import { ModerationStatus } from '../../../common/enums/prisma.enums';

export class GetQueueFiltersDto {
  @ApiPropertyOptional({
    enum: ['PENDING', 'APPROVED', 'REJECTED', 'ESCALATED'],
    description: 'Filter by status',
  })
  @IsOptional()
  @IsString()
  @IsIn(['PENDING', 'APPROVED', 'REJECTED', 'ESCALATED'])
  status?: ModerationStatus;
}
