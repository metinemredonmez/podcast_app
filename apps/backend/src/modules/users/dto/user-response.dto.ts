import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsBoolean, IsDate, IsEmail, IsEnum, IsOptional, IsString, IsUUID } from 'class-validator';
import { UserRole } from '../../../common/enums/prisma.enums';

export class UserResponseDto {
  @ApiProperty()
  @IsUUID()
  id!: string;

  @ApiProperty()
  @IsUUID()
  tenantId!: string;

  @ApiProperty()
  @IsEmail()
  email!: string;

  @ApiProperty({ nullable: true })
  @IsOptional()
  @IsString()
  name!: string | null;

  @ApiProperty({ enum: UserRole })
  @IsEnum(UserRole)
  role!: UserRole;

  @ApiProperty()
  @IsBoolean()
  isActive!: boolean;

  @ApiProperty()
  @IsBoolean()
  emailVerified!: boolean;

  @ApiProperty({ nullable: true })
  @IsOptional()
  @IsString()
  avatarUrl!: string | null;

  @ApiProperty({ nullable: true })
  @IsOptional()
  @IsString()
  bio!: string | null;

  @ApiProperty({ nullable: true, type: 'object' })
  @IsOptional()
  preferences!: Record<string, any> | null;

  @ApiProperty()
  @Type(() => Date)
  @IsDate()
  createdAt!: Date;

  @ApiProperty()
  @Type(() => Date)
  @IsDate()
  updatedAt!: Date;
}
