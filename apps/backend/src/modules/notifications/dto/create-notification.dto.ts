import { ApiProperty } from '@nestjs/swagger';
import { NotificationType } from '../../../common/enums/prisma.enums';
import { IsEnum, IsObject, IsUUID } from 'class-validator';

export class CreateNotificationDto {
  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  tenantId!: string;

  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  userId!: string;

  @ApiProperty({ enum: NotificationType })
  @IsEnum(NotificationType)
  type!: NotificationType;

  @ApiProperty({ description: 'Structured payload for the notification', type: () => Object })
  @IsObject()
  payload!: Record<string, unknown>;
}
