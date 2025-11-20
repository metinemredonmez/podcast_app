import { UserRole } from '../../../common/enums/prisma.enums';

export const USERS_REPOSITORY = Symbol('USERS_REPOSITORY');

export interface UserModel {
  id: string;
  tenantId: string;
  email: string;
  passwordHash: string;
  refreshTokenHash: string | null;
  name: string | null;
  role: UserRole;
  isActive: boolean;
  emailVerified: boolean;
  avatarUrl: string | null;
  bio: string | null;
  preferences: Record<string, any> | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateUserInput {
  tenantId: string;
  email: string;
  passwordHash: string;
  name?: string | null;
  role?: UserRole;
}

export interface UpdateUserInput {
  name?: string | null;
  role?: UserRole;
  isActive?: boolean;
  refreshTokenHash?: string | null;
}

export interface UpdateProfileInput {
  name?: string | null;
  avatarUrl?: string | null;
  bio?: string | null;
  preferences?: Record<string, any> | null;
}

export interface PaginationOptions {
  tenantId: string;
  cursor?: string;
  limit: number;
  orderBy?: keyof UserModel;
  orderDirection?: 'asc' | 'desc';
}

export interface UsersRepository {
  findMany(options: PaginationOptions): Promise<UserModel[]>;
  findById(id: string, tenantId: string): Promise<UserModel | null>;
  findByEmail(email: string): Promise<UserModel | null>;
  create(payload: CreateUserInput): Promise<UserModel>;
  update(id: string, tenantId: string, payload: UpdateUserInput): Promise<UserModel>;
  updateProfile(id: string, tenantId: string, payload: UpdateProfileInput): Promise<UserModel | null>;
  updatePassword(id: string, tenantId: string, passwordHash: string): Promise<void>;
}
