import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';

export class UpdateCommentDto {
  @ApiPropertyOptional({
    description: 'Updated comment content',
    minLength: 1,
    maxLength: 5000,
    example: 'Updated: Great episode! Really enjoyed the discussion.',
  })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MinLength(1)
  @MaxLength(5000, { message: 'Comment content cannot exceed 5000 characters' })
  content?: string;
}
