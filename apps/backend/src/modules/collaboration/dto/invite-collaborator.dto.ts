import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEmail, IsEnum, IsNotEmpty, IsObject, IsOptional, IsUUID } from 'class-validator';
import { CollaboratorRole } from '../../../common/enums/prisma.enums';

export class InviteCollaboratorDto {
  @ApiProperty({ format: 'uuid', description: 'Podcast ID' })
  @IsUUID()
  @IsNotEmpty()
  podcastId!: string;

  @ApiPropertyOptional({ format: 'uuid', description: 'User ID (if existing user)' })
  @IsOptional()
  @IsUUID()
  userId?: string;

  @ApiPropertyOptional({ description: 'Email (if inviting by email)' })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiProperty({ enum: CollaboratorRole, description: 'Role to assign' })
  @IsEnum(CollaboratorRole)
  @IsNotEmpty()
  role!: CollaboratorRole;

  @ApiPropertyOptional({
    description: 'Custom permissions object',
    example: { canEdit: true, canPublish: false, canDelete: false },
  })
  @IsOptional()
  @IsObject()
  permissions?: Record<string, boolean>;
}
