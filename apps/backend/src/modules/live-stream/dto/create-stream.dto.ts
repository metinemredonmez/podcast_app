import {
  IsString,
  IsOptional,
  IsBoolean,
  IsDateString,
  IsNumber,
  Max,
  Min,
  MinLength,
  MaxLength,
  IsUUID,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

// Maksimum canlı yayın süresi: 45 dakika = 2700 saniye
export const MAX_STREAM_DURATION_SECONDS = 2700;

export class CreateStreamDto {
  @ApiProperty({ description: 'Yayın başlığı', minLength: 3, maxLength: 100 })
  @IsString()
  @MinLength(3)
  @MaxLength(100)
  title: string;

  @ApiPropertyOptional({ description: 'Yayın açıklaması', maxLength: 500 })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;

  @ApiProperty({ description: 'Kategori', format: 'uuid' })
  @IsUUID()
  categoryId: string;

  @ApiPropertyOptional({ description: 'Planlanan başlangıç zamanı' })
  @IsOptional()
  @IsDateString()
  scheduledAt?: string;

  @ApiPropertyOptional({ description: 'Yayın kaydedilsin mi?', default: true })
  @IsOptional()
  @IsBoolean()
  isRecorded?: boolean;

  @ApiPropertyOptional({
    description: 'Maksimum yayın süresi saniye (varsayılan ve maksimum: 45 dakika = 2700 saniye)',
    default: 2700,
    maximum: 2700
  })
  @IsOptional()
  @IsNumber()
  @Min(60, { message: 'Minimum yayın süresi 1 dakika olmalı' })
  @Max(MAX_STREAM_DURATION_SECONDS, { message: 'Maksimum yayın süresi 45 dakika (2700 saniye) olabilir' })
  maxDuration?: number;
}
