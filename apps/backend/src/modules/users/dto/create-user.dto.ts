import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { UserRole } from '../../../common/enums/prisma.enums';
import { IsEmail, IsEnum, IsOptional, IsString, IsUUID, MinLength } from 'class-validator';

export class CreateUserDto {
  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  tenantId!: string;

  @ApiProperty({ example: 'listener@example.com' })
  @IsEmail()
  email!: string;

  @ApiProperty({ minLength: 8, example: 'strong-password' })
  @IsString()
  @MinLength(8)
  password!: string;

  @ApiPropertyOptional({ example: 'Listener User' })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({ enum: UserRole, default: UserRole.LISTENER })
  @IsOptional()
  @IsEnum(UserRole)
  role?: UserRole;
}
