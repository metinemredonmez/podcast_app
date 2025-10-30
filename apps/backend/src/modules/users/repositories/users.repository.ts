import { User, UserRole } from '@prisma/client';

export const USERS_REPOSITORY = Symbol('USERS_REPOSITORY');

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

export interface PaginationOptions {
  cursor?: string;
  limit: number;
  orderBy?: keyof User;
  orderDirection?: 'asc' | 'desc';
}

export interface UsersRepository {
  findMany(options: PaginationOptions): Promise<User[]>;
  findById(id: string): Promise<User | null>;
  findByEmail(email: string): Promise<User | null>;
  create(payload: CreateUserInput): Promise<User>;
  update(id: string, payload: UpdateUserInput): Promise<User>;
}
