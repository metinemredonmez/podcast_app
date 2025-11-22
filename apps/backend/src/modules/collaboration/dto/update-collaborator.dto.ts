import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsObject, IsOptional } from 'class-validator';
import { CollaboratorRole, CollaboratorStatus } from '../../../common/enums/prisma.enums';

export class UpdateCollaboratorDto {
  @ApiPropertyOptional({ enum: CollaboratorRole, description: 'New role' })
  @IsOptional()
  @IsEnum(CollaboratorRole)
  role?: CollaboratorRole;

  @ApiPropertyOptional({
    description: 'Updated permissions',
    example: { canEdit: true, canPublish: true, canDelete: false },
  })
  @IsOptional()
  @IsObject()
  permissions?: Record<string, boolean>;
}

export class RespondInviteDto {
  @ApiPropertyOptional({ enum: ['ACCEPTED', 'REJECTED'], description: 'Response to invitation' })
  @IsEnum(['ACCEPTED', 'REJECTED'] as const)
  response!: 'ACCEPTED' | 'REJECTED';
}
