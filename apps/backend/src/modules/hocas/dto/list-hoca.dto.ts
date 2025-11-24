import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsUUID } from 'class-validator';
import { OffsetPaginationDto } from '../../../common/dto/offset-pagination.dto';

export class ListHocaDto extends OffsetPaginationDto {
  @ApiPropertyOptional({ format: 'uuid', description: 'Filter by tenant ID' })
  @IsOptional()
  @IsUUID()
  tenantId?: string;
}
