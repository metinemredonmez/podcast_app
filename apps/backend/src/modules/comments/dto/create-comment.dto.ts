import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsUUID, Length } from 'class-validator';

export class CreateCommentDto {
  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  tenantId!: string;

  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  episodeId!: string;

  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  userId!: string;

  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  parentId?: string;

  @ApiProperty({ minLength: 1, maxLength: 2000 })
  @IsString()
  @Length(1, 2000)
  content!: string;
}
