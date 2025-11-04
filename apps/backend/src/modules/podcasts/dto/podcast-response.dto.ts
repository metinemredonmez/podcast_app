import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsBoolean, IsDate, IsOptional, IsString, IsUUID } from 'class-validator';

export class PodcastResponseDto {
  @ApiProperty()
  @IsUUID()
  id!: string;

  @ApiProperty()
  @IsUUID()
  tenantId!: string;

  @ApiProperty()
  @IsUUID()
  ownerId!: string;

  @ApiProperty()
  @IsString()
  title!: string;

  @ApiProperty()
  @IsString()
  slug!: string;

  @ApiProperty({ nullable: true })
  @IsOptional()
  @IsString()
  description!: string | null;

  @ApiProperty({ nullable: true })
  @IsOptional()
  @IsString()
  coverImageUrl!: string | null;

  @ApiProperty()
  @IsBoolean()
  isPublished!: boolean;

  @ApiProperty({ nullable: true })
  @IsOptional()
  @Type(() => Date)
  @IsDate()
  publishedAt!: Date | null;

  @ApiProperty()
  @Type(() => Date)
  @IsDate()
  createdAt!: Date;

  @ApiProperty()
  @Type(() => Date)
  @IsDate()
  updatedAt!: Date;
}
