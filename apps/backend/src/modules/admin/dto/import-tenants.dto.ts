import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { ArrayNotEmpty, ValidateNested } from 'class-validator';
import { CreateTenantDto } from './create-tenant.dto';

export class ImportTenantsDto {
  @ApiProperty({ type: () => [CreateTenantDto] })
  @ArrayNotEmpty()
  @ValidateNested({ each: true })
  @Type(() => CreateTenantDto)
  tenants!: CreateTenantDto[];
}
