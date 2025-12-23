import { UserRole } from '../../../common/enums/prisma.enums';

export interface JwtPayload {
  sub: string;
  email: string;
  tenantId: string;
  role: UserRole;
  /** @deprecated Use `sub` instead. This is an alias for backward compatibility. */
  get userId(): string;
}

/** Runtime implementation that adds userId getter to JWT payload */
export function enrichJwtPayload(payload: Omit<JwtPayload, 'userId'>): JwtPayload {
  return {
    ...payload,
    get userId() {
      return this.sub;
    },
  };
}

export interface RefreshPayload extends JwtPayload {
  refreshToken?: string;
}
