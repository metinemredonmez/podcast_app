import { Injectable } from '@nestjs/common';
import { Prisma, User } from '@prisma/client';
import { PrismaService } from '../../../infra/prisma.service';
import {
  CreateUserInput,
  PaginationOptions,
  UpdateUserInput,
  UsersRepository,
} from './users.repository';

@Injectable()
export class UsersPrismaRepository implements UsersRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findMany(options: PaginationOptions): Promise<User[]> {
    const { cursor, limit, orderBy = 'createdAt', orderDirection = 'desc' } = options;
    const where: Prisma.UserWhereInput = {};
    const paginationCursor = cursor ? { id: cursor } : undefined;

    return this.prisma.user.findMany({
      take: limit + 1,
      skip: paginationCursor ? 1 : 0,
      cursor: paginationCursor,
      where,
      orderBy: { [orderBy]: orderDirection },
    });
  }

  findById(id: string): Promise<User | null> {
    return this.prisma.user.findUnique({ where: { id } });
  }

  findByEmail(email: string): Promise<User | null> {
    return this.prisma.user.findUnique({ where: { email } });
  }

  create(payload: CreateUserInput): Promise<User> {
    const { tenantId, email, passwordHash, name, role } = payload;
    return this.prisma.user.create({
      data: {
        tenantId,
        email,
        passwordHash,
        name,
        role,
      },
    });
  }

  update(id: string, payload: UpdateUserInput): Promise<User> {
    return this.prisma.user.update({
      where: { id },
      data: payload,
    });
  }
}
