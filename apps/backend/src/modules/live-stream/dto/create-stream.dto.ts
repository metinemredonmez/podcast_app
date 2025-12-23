import {
  IsString,
  IsOptional,
  IsBoolean,
  IsDateString,
  MinLength,
  MaxLength,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

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

  @ApiPropertyOptional({ description: 'Planlanan başlangıç zamanı' })
  @IsOptional()
  @IsDateString()
  scheduledAt?: string;

  @ApiPropertyOptional({ description: 'Yayın kaydedilsin mi?', default: true })
  @IsOptional()
  @IsBoolean()
  isRecorded?: boolean;
}
