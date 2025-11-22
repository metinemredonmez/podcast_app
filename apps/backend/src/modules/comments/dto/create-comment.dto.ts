import { ApiPropertyOptional, ApiProperty } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  MinLength,
} from 'class-validator';

export class CreateCommentDto {
  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  tenantId?: string;

  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  userId?: string;

  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  episodeId!: string;

  @ApiProperty({
    description: 'Comment body',
    minLength: 1,
    maxLength: 5000,
    example: 'Great episode! Really enjoyed the discussion.',
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(1)
  @MaxLength(5000, { message: 'Comment content cannot exceed 5000 characters' })
  content!: string;

  @ApiPropertyOptional({
    format: 'uuid',
    description: 'Optional parent comment identifier for replies',
  })
  @IsOptional()
  @IsUUID()
  parentId?: string;
}
