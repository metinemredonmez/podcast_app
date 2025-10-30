import { ApiProperty } from '@nestjs/swagger';
import { IsUUID } from 'class-validator';

export class FollowDto {
  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  tenantId!: string;

  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  userId!: string;

  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  podcastId!: string;
}
