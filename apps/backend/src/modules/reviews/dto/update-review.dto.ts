import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsOptional, IsString, Max, MaxLength, Min } from 'class-validator';

export class UpdateReviewDto {
  @ApiPropertyOptional({ minimum: 1, maximum: 5, description: 'Updated rating (1-5 stars)' })
  @IsOptional()
  @IsInt()
  @Min(1, { message: 'Rating must be at least 1' })
  @Max(5, { message: 'Rating cannot exceed 5' })
  rating?: number;

  @ApiPropertyOptional({ maxLength: 5000, description: 'Updated review content' })
  @IsOptional()
  @IsString()
  @MaxLength(5000)
  content?: string;

  @ApiPropertyOptional({ maxLength: 200, description: 'Updated review title' })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  title?: string;
}
