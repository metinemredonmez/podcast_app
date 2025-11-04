import { ApiPropertyOptional, ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString, IsUUID } from 'class-validator';

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

  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  podcastId?: string;

  @ApiProperty({ description: 'Comment body' })
  @IsString()
  @IsNotEmpty()
  content!: string;

  @ApiPropertyOptional({ format: 'uuid', description: 'Optional parent comment identifier for replies' })
  @IsOptional()
  @IsUUID()
  parentId?: string;
}
