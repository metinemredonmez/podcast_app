import { ApiProperty } from '@nestjs/swagger';
import { IsDateString, IsNumber, IsString, IsUrl } from 'class-validator';

export class SignedUrlResponseDto {
  @ApiProperty({ description: 'Object storage key' })
  @IsString()
  readonly key!: string;

  @ApiProperty({ description: 'Presigned URL granting temporary access' })
  @IsString()
  @IsUrl()
  readonly signedUrl!: string;

  @ApiProperty({ description: 'ISO timestamp when the signed URL expires' })
  @IsDateString()
  readonly expiresAt!: string;

  @ApiProperty({ description: 'URL expiry duration in seconds', example: 3600 })
  @IsNumber()
  readonly expiresIn!: number;
}
