import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';
import { ModerationStatus } from '@prisma/client';

export class ModerationActionDto {
  @ApiProperty({
    enum: ['APPROVED', 'REJECTED'],
    description: 'Moderation decision',
  })
  @IsEnum(['APPROVED', 'REJECTED'] as const)
  @IsNotEmpty()
  action!: 'APPROVED' | 'REJECTED';

  @ApiPropertyOptional({ maxLength: 2000, description: 'Moderator notes' })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  notes?: string;
}

export class EscalateDto {
  @ApiPropertyOptional({ maxLength: 2000, description: 'Reason for escalation' })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  notes?: string;
}

export class SetPriorityDto {
  @ApiProperty({ minimum: 0, maximum: 10, description: 'Priority level (0-10)' })
  @IsNotEmpty()
  priority!: number;
}
