import { ApiProperty } from '@nestjs/swagger';
import { IsUUID } from 'class-validator';

export class JoinStreamDto {
  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  sessionId!: string;

  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  userId!: string;
}
