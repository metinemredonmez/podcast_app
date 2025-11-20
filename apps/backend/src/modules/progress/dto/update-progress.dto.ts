import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsInt, IsOptional, Min } from 'class-validator';

export class UpdateProgressDto {
  @ApiProperty({ description: 'Current progress in seconds', minimum: 0 })
  @IsInt()
  @Min(0)
  progressSeconds: number;

  @ApiPropertyOptional({ description: 'Mark as completed' })
  @IsOptional()
  @IsBoolean()
  completed?: boolean;
}
