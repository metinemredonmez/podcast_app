import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsDefined, IsEnum, IsOptional, IsString, IsUUID, ValidateNested } from 'class-validator';
import { UserRole } from '../../../common/enums/prisma.enums';

export class AuthTokensDto {
  @ApiProperty()
  @IsString()
  accessToken!: string;

  @ApiProperty()
  @IsString()
  refreshToken!: string;
}

export class AuthUserDto {
  @ApiProperty()
  @IsUUID()
  id!: string;

  @ApiProperty()
  @IsUUID()
  tenantId!: string;

  @ApiProperty()
  @IsString()
  email!: string;

  @ApiProperty({ nullable: true })
  @IsOptional()
  @IsString()
  name!: string | null;

  @ApiProperty({ enum: UserRole })
  @IsEnum(UserRole)
  role!: UserRole;

  @ApiProperty({ nullable: true })
  @IsOptional()
  @IsString()
  avatarUrl?: string | null;
}

export class AuthResponseDto {
  @ApiProperty({ type: AuthTokensDto })
  @IsDefined()
  @ValidateNested()
  @Type(() => AuthTokensDto)
  tokens!: AuthTokensDto;

  @ApiProperty({ type: AuthUserDto })
  @IsDefined()
  @ValidateNested()
  @Type(() => AuthUserDto)
  user!: AuthUserDto;
}
