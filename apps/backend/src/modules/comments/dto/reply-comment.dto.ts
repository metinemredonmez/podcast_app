import { ApiPropertyOptional, ApiProperty } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  MinLength,
} from 'class-validator';

export class ReplyCommentDto {
  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  tenantId?: string;

  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  userId?: string;

  @ApiProperty({
    description: 'Reply body',
    minLength: 1,
    maxLength: 5000,
    example: 'I agree with your point!',
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(1)
  @MaxLength(5000, { message: 'Reply content cannot exceed 5000 characters' })
  content!: string;
}
