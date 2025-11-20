import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class AuditLogResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  userId: string;

  @ApiProperty()
  action: string; // CREATE, UPDATE, DELETE, etc.

  @ApiProperty()
  entityType: string; // User, Podcast, Episode, etc.

  @ApiPropertyOptional()
  entityId?: string;

  @ApiPropertyOptional()
  changes?: any; // Before/after data

  @ApiPropertyOptional()
  ipAddress?: string;

  @ApiPropertyOptional()
  userAgent?: string;

  @ApiProperty()
  createdAt: Date;

  @ApiPropertyOptional()
  user?: {
    id: string;
    name?: string;
    email: string;
    role: string;
  };
}
