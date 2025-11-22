import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsNotEmpty, IsOptional, IsString, IsUUID, Max, MaxLength, Min } from 'class-validator';

export class CreateReviewDto {
  @ApiProperty({ format: 'uuid', description: 'Podcast ID to review' })
  @IsUUID()
  @IsNotEmpty()
  podcastId!: string;

  @ApiProperty({ minimum: 1, maximum: 5, description: 'Rating (1-5 stars)' })
  @IsInt()
  @Min(1, { message: 'Rating must be at least 1' })
  @Max(5, { message: 'Rating cannot exceed 5' })
  rating!: number;

  @ApiPropertyOptional({ maxLength: 5000, description: 'Review content' })
  @IsOptional()
  @IsString()
  @MaxLength(5000)
  content?: string;

  @ApiPropertyOptional({ maxLength: 200, description: 'Review title' })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  title?: string;
}
