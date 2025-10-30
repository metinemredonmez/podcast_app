import { ApiProperty } from '@nestjs/swagger';
import { UserRole } from '../../../common/enums/prisma.enums';

export class AuthTokensDto {
  @ApiProperty()
  accessToken!: string;

  @ApiProperty()
  refreshToken!: string;
}

export class AuthUserDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  tenantId!: string;

  @ApiProperty()
  email!: string;

  @ApiProperty({ nullable: true })
  name!: string | null;

  @ApiProperty({ enum: UserRole })
  role!: UserRole;
}

export class AuthResponseDto {
  @ApiProperty({ type: AuthTokensDto })
  tokens!: AuthTokensDto;

  @ApiProperty({ type: AuthUserDto })
  user!: AuthUserDto;
}
