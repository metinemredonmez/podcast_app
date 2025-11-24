import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../infra/prisma.service';
import { CreateTenantDto } from './dto/create-tenant.dto';
import { UpdateTenantDto } from './dto/update-tenant.dto';
import { CreateAdminUserDto } from './dto/create-admin-user.dto';
import { UpdateAdminUserDto } from './dto/update-admin-user.dto';
import { ListTenantsDto } from './dto/list-tenants.dto';
import { ListUsersDto } from './dto/list-users.dto';
import { ImportTenantsDto } from './dto/import-tenants.dto';
import { ConfigService } from '@nestjs/config';
import { Prisma, Tenant, User } from '@prisma/client';
import { UserRole } from '../../common/enums/prisma.enums';
import * as bcrypt from 'bcrypt';
import { AssignUserRoleDto } from './dto/assign-user-role.dto';

@Injectable()
export class AdminService {
  private readonly saltRounds: number;

  constructor(private readonly prisma: PrismaService, private readonly config: ConfigService) {
    this.saltRounds = Number(this.config.get<number>('BCRYPT_SALT_ROUNDS', 12));
  }

  async listTenants(filter: ListTenantsDto): Promise<{ data: Tenant[]; total: number; page: number; limit: number }> {
    const page = Number(filter.page ?? 1);
    const limit = Number(filter.limit ?? 10);
    const skip = (page - 1) * limit;

    const where = filter.search
      ? {
          OR: [
            { name: { contains: filter.search, mode: 'insensitive' } },
            { slug: { contains: filter.search, mode: 'insensitive' } },
          ],
        }
      : undefined;

    const [data, total] = await Promise.all([
      this.prisma.tenant.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.tenant.count({ where }),
    ]);

    return { data, total, page, limit };
  }

  async getTenantStats(): Promise<{
    totalTenants: number;
    activeTenants: number;
    trialEndingSoon: number;
    monthlyRevenue: number;
  }> {
    const [totalTenants, activeTenants] = await Promise.all([
      this.prisma.tenant.count(),
      this.prisma.tenant.count({ where: { isActive: true } }),
    ]);

    return {
      totalTenants,
      activeTenants,
      trialEndingSoon: 0, // Would need trial end date tracking
      monthlyRevenue: 0, // Would need subscription/payment tracking
    };
  }

  async getTenant(id: string): Promise<Tenant> {
    return this.prisma.tenant.findUniqueOrThrow({ where: { id } });
  }

  async createTenant(dto: CreateTenantDto): Promise<Tenant> {
    const existing = await this.prisma.tenant.findUnique({ where: { slug: dto.slug } });
    if (existing) {
      throw new ConflictException(`Tenant slug '${dto.slug}' is already in use.`);
    }

    return this.prisma.tenant.create({
      data: {
        name: dto.name,
        slug: dto.slug,
      },
    });
  }

  async updateTenant(id: string, dto: UpdateTenantDto): Promise<Tenant> {
    if (dto.slug) {
      const slugOwner = await this.prisma.tenant.findUnique({ where: { slug: dto.slug } });
      if (slugOwner && slugOwner.id !== id) {
        throw new ConflictException(`Tenant slug '${dto.slug}' is already in use.`);
      }
    }

    return this.prisma.tenant.update({
      where: { id },
      data: {
        ...(dto.name ? { name: dto.name } : {}),
        ...(dto.slug ? { slug: dto.slug } : {}),
      },
    });
  }

  async deleteTenant(id: string): Promise<void> {
    await this.prisma.tenant.delete({ where: { id } });
  }

  async importTenants(dto: ImportTenantsDto): Promise<{ imported: number; tenants: Tenant[] }> {
    const tenants: Tenant[] = [];
    for (const tenantDto of dto.tenants) {
      const tenant = await this.prisma.tenant.create({
        data: { name: tenantDto.name, slug: tenantDto.slug },
      });
      tenants.push(tenant);
    }
    return { imported: tenants.length, tenants };
  }

  async exportTenants(): Promise<Tenant[]> {
    return this.prisma.tenant.findMany({ orderBy: { createdAt: 'asc' } });
  }

  async listUsers(filter: ListUsersDto): Promise<User[]> {
    return this.prisma.user.findMany({
      where: {
        ...(filter.tenantId ? { tenantId: filter.tenantId } : {}),
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getUser(id: string): Promise<User> {
    return this.prisma.user.findUniqueOrThrow({ where: { id } });
  }

  async createUser(dto: CreateAdminUserDto): Promise<User> {
    const passwordHash = await bcrypt.hash(dto.password, this.saltRounds);

    return this.prisma.user.create({
      data: {
        tenantId: dto.tenantId,
        email: dto.email,
        passwordHash,
        name: dto.name,
        role: dto.role ?? UserRole.ADMIN,
      },
    });
  }

  async updateUser(id: string, dto: UpdateAdminUserDto): Promise<User> {
    const data: Prisma.UserUpdateInput = {
      ...(dto.name !== undefined ? { name: dto.name } : {}),
      ...(dto.role !== undefined ? { role: dto.role } : {}),
      ...(dto.isActive !== undefined ? { isActive: dto.isActive } : {}),
    };

    if (dto.password) {
      data.passwordHash = await bcrypt.hash(dto.password, this.saltRounds);
    }

    return this.prisma.user.update({
      where: { id },
      data,
    });
  }

  async deleteUser(id: string): Promise<void> {
    await this.prisma.user.delete({ where: { id } });
  }

  async assignUserRole(id: string, dto: AssignUserRoleDto): Promise<User> {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user || user.tenantId !== dto.tenantId) {
      throw new NotFoundException(`User ${id} not found for tenant ${dto.tenantId}.`);
    }

    return this.prisma.user.update({
      where: { id },
      data: { role: dto.role },
    });
  }
}
