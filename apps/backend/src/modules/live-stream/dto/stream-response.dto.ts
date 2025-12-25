import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

type LiveStreamStatusType = 'SCHEDULED' | 'PREPARING' | 'LIVE' | 'PAUSED' | 'ENDED' | 'CANCELLED';

export class HostInfoDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  name: string;

  @ApiPropertyOptional()
  avatarUrl: string | null;
}

export class RoomInfoDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  roomNumber: number;

  @ApiProperty()
  currentCount: number;

  @ApiProperty()
  capacity: number;
}

export class StreamResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  title: string;

  @ApiPropertyOptional()
  description: string | null;

  @ApiPropertyOptional({ description: 'Kategori bilgisi' })
  category?: { id: string; name: string } | null;

  @ApiProperty({ type: String, enum: ['SCHEDULED', 'PREPARING', 'LIVE', 'PAUSED', 'ENDED', 'CANCELLED'] })
  status: LiveStreamStatusType;

  @ApiProperty({ type: HostInfoDto })
  host: HostInfoDto;

  @ApiPropertyOptional()
  hlsUrl: string | null;

  @ApiProperty()
  viewerCount: number;

  @ApiProperty()
  roomCount: number;

  @ApiPropertyOptional()
  startedAt: Date | null;

  @ApiPropertyOptional()
  endedAt: Date | null;

  @ApiPropertyOptional()
  duration: number | null;

  @ApiPropertyOptional()
  recordingUrl: string | null;
}

export class ActiveStreamResponseDto extends StreamResponseDto {
  @ApiProperty({ description: 'Stream key (sadece host görür)' })
  streamKey: string;
}

export class StreamStatsDto {
  @ApiProperty()
  streamId: string;

  @ApiProperty({ type: String, enum: ['SCHEDULED', 'PREPARING', 'LIVE', 'PAUSED', 'ENDED', 'CANCELLED'] })
  status: LiveStreamStatusType;

  @ApiProperty()
  viewerCount: number;

  @ApiProperty()
  peakViewers: number;

  @ApiProperty()
  roomCount: number;

  @ApiProperty({ type: [RoomInfoDto] })
  rooms: RoomInfoDto[];

  @ApiProperty({ description: 'Yayın süresi (saniye)' })
  duration: number;

  @ApiPropertyOptional()
  startedAt: Date | null;
}
