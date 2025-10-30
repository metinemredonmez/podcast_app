import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { NotificationType } from '../../../common/enums/prisma.enums';
import { IsEnum, IsJSON, IsOptional, IsString, IsUUID } from 'class-validator';

export class SendNotificationDto {
  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  tenantId!: string;

  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  userId!: string;

  @ApiProperty({ enum: NotificationType })
  @IsEnum(NotificationType)
  type!: NotificationType;

  @ApiProperty({ description: 'JSON payload describing the notification body' })
  @IsString()
  payload!: string;

  @ApiPropertyOptional({ description: 'Optional topic for grouping notifications' })
  @IsOptional()
  @IsString()
  topic?: string;
}
