import { ApiProperty } from '@nestjs/swagger';
import { IsIn } from 'class-validator';

export class UpdateSessionStatusDto {
  @ApiProperty({ type: String, enum: ['SCHEDULED', 'LIVE', 'ENDED', 'CANCELLED'] })
  @IsIn(['SCHEDULED', 'LIVE', 'ENDED', 'CANCELLED'])
  status!: 'SCHEDULED' | 'LIVE' | 'ENDED' | 'CANCELLED';
}
