import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';

export enum ReportEntityType {
  PODCAST = 'PODCAST',
  EPISODE = 'EPISODE',
  COMMENT = 'COMMENT',
  REVIEW = 'REVIEW',
  USER = 'USER',
}

export class ReportContentDto {
  @ApiProperty({ enum: ReportEntityType, description: 'Type of content being reported' })
  @IsEnum(ReportEntityType)
  @IsNotEmpty()
  entityType!: ReportEntityType;

  @ApiProperty({ format: 'uuid', description: 'ID of the reported entity' })
  @IsUUID()
  @IsNotEmpty()
  entityId!: string;

  @ApiPropertyOptional({ maxLength: 1000, description: 'Reason for reporting' })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  reason?: string;
}
