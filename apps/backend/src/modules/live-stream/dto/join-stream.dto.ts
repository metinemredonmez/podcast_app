import { IsString, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class JoinStreamDto {
  @ApiProperty({ description: 'Yayın ID' })
  @IsString()
  streamId: string;

  @ApiPropertyOptional({ description: 'Cihaz türü' })
  @IsOptional()
  @IsString()
  deviceType?: string;
}

export class JoinStreamResponseDto {
  @ApiProperty()
  success: boolean;

  @ApiProperty()
  streamId: string;

  @ApiProperty()
  roomId: string;

  @ApiProperty()
  roomNumber: number;

  @ApiProperty()
  hlsUrl: string;

  @ApiProperty()
  viewerCount: number;
}

export class LeaveStreamResponseDto {
  @ApiProperty()
  success: boolean;
}
