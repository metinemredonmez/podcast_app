import { ApiProperty } from '@nestjs/swagger';
import { UserRole } from '../../../common/enums/prisma.enums';

export class UserResponseDto {
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

  @ApiProperty()
  isActive!: boolean;

  @ApiProperty()
  createdAt!: Date;

  @ApiProperty()
  updatedAt!: Date;
}
