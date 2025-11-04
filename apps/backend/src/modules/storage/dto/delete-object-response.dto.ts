import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsString } from 'class-validator';

export class DeleteObjectResponseDto {
  @ApiProperty({ description: 'Storage key that was removed' })
  @IsString()
  readonly key!: string;

  @ApiProperty({ description: 'Whether the delete operation succeeded', example: true })
  @IsBoolean()
  readonly deleted!: boolean;
}
