import { ApiProperty } from '@nestjs/swagger';
import { StreamStatus } from '@podcast-app/shared-types';
import { IsEnum } from 'class-validator';

export class UpdateSessionStatusDto {
  @ApiProperty({ enum: StreamStatus })
  @IsEnum(StreamStatus)
  status!: StreamStatus;
}
