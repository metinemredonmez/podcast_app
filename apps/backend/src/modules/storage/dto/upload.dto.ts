import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsOptional, IsString, IsUUID, MaxLength, Min } from 'class-validator';

export class UploadDto {
  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  tenantId!: string;

  @ApiProperty({ description: 'Logical owner id for the asset', required: false })
  @IsOptional()
  @IsUUID()
  ownerId?: string;

  @ApiProperty({ example: 'podcast-cover' })
  @IsString()
  @MaxLength(100)
  ownerType!: string;

  @ApiProperty({ example: 'podcasts' })
  @IsString()
  @MaxLength(100)
  bucket!: string;

  @ApiProperty({ example: 'covers/episode-1.png' })
  @IsString()
  @MaxLength(512)
  objectKey!: string;

  @ApiProperty({ example: 'https://cdn.example.com/covers/episode-1.png' })
  @IsString()
  url!: string;

  @ApiProperty({ example: 'image/png', required: false })
  @IsOptional()
  @IsString()
  mimeType?: string;

  @ApiProperty({ example: 102400, required: false })
  @IsOptional()
  @IsInt()
  @Min(0)
  sizeBytes?: number;
}
