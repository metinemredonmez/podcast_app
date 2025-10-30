import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import { IsEmail, IsEnum, IsOptional, IsString, IsUUID, MinLength } from 'class-validator';

export class RegisterDto {
  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  tenantId!: string;

  @ApiProperty({ example: 'listener@example.com' })
  @IsEmail()
  email!: string;

  @ApiPropertyOptional({ example: 'Listener' })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiProperty({ minLength: 8 })
  @IsString()
  @MinLength(8)
  password!: string;

  @ApiPropertyOptional({ enum: UserRole, default: UserRole.LISTENER })
  @IsOptional()
  @IsEnum(UserRole)
  role?: UserRole;
}
