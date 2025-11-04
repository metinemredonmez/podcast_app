import { ApiProperty } from '@nestjs/swagger';
import { IsUUID } from 'class-validator';

export class FollowDto {
  @ApiProperty({ format: 'uuid', required: false })
  @IsUUID()
  tenantId!: string;

  @ApiProperty({ format: 'uuid', required: false })
  @IsUUID()
  userId!: string;

  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  podcastId!: string;
}
