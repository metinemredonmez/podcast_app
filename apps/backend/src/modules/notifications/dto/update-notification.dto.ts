import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsObject, IsOptional } from 'class-validator';

export class UpdateNotificationDto {
  @ApiPropertyOptional({ description: 'Updated payload contents', type: () => Object })
  @IsOptional()
  @IsObject()
  payload?: Record<string, unknown>;

  @ApiPropertyOptional({ description: 'Mark notification as read (true) or unread (false)' })
  @IsOptional()
  @IsBoolean()
  read?: boolean;
}
