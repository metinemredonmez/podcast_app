import { UserRole } from '@prisma/client';

export interface JwtPayload {
  sub: string;
  email: string;
  tenantId: string;
  role: UserRole;
}

export interface RefreshPayload extends JwtPayload {
  refreshToken?: string;
}
