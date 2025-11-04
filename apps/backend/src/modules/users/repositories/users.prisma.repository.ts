import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../infra/prisma.service';
import {
  CreateUserInput,
  PaginationOptions,
  UpdateUserInput,
  UsersRepository,
  UserModel,
} from './users.repository';

@Injectable()
export class UsersPrismaRepository implements UsersRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findMany(options: PaginationOptions): Promise<UserModel[]> {
    const { tenantId, cursor, limit, orderBy = 'createdAt', orderDirection = 'desc' } = options;
    const paginationCursor = cursor ? { id: cursor } : undefined;

    const rows = await this.prisma.user.findMany({
      take: limit + 1,
      skip: paginationCursor ? 1 : 0,
      cursor: paginationCursor,
      where: { tenantId },
      orderBy: { [orderBy]: orderDirection } as any,
    });
    return rows as unknown as UserModel[];
  }

  async findById(id: string, tenantId: string): Promise<UserModel | null> {
    const user = await this.prisma.user.findFirst({ where: { id, tenantId } });
    return user as UserModel | null;
  }

  async findByEmail(email: string): Promise<UserModel | null> {
    const user = await this.prisma.user.findUnique({ where: { email } });
    return user as UserModel | null;
  }

  async create(payload: CreateUserInput): Promise<UserModel> {
    const { tenantId, email, passwordHash, name, role } = payload;
    const created = await this.prisma.user.create({
      data: {
        tenantId,
        email,
        passwordHash,
        name,
        role,
      },
    });
    return created as unknown as UserModel;
  }

  async update(id: string, tenantId: string, payload: UpdateUserInput): Promise<UserModel> {
    const existing = await this.prisma.user.findFirst({ where: { id, tenantId } });
    if (!existing) {
      throw new Error(`User ${id} not found within tenant ${tenantId}`);
    }
    const updated = await this.prisma.user.update({
      where: { id },
      data: payload,
    });
    return updated as unknown as UserModel;
  }
}
