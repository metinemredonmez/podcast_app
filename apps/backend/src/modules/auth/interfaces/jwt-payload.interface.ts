import { UserRole } from '../../../common/enums/prisma.enums';

export interface JwtPayload {
  sub: string;
  email: string;
  tenantId: string;
  role: UserRole;
}

export interface RefreshPayload extends JwtPayload {
  refreshToken?: string;
}
