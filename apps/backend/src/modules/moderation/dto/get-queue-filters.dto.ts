import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsOptional, IsString } from 'class-validator';
import { ModerationStatus } from '../../../common/enums/prisma.enums';
import { OffsetPaginationDto } from '../../../common/dto/offset-pagination.dto';

export class GetQueueFiltersDto extends OffsetPaginationDto {
  @ApiPropertyOptional({
    enum: ['PENDING', 'APPROVED', 'REJECTED', 'ESCALATED'],
    description: 'Filter by status',
  })
  @IsOptional()
  @IsString()
  @IsIn(['PENDING', 'APPROVED', 'REJECTED', 'ESCALATED'])
  status?: ModerationStatus;
}
