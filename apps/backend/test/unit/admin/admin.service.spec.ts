import 'reflect-metadata';
import { ConfigService } from '@nestjs/config';
import { ConflictException, NotFoundException } from '@nestjs/common';
import { AdminService } from '../../../src/modules/admin/admin.service';
import { PrismaService } from '../../../src/infra/prisma.service';
import { CreateTenantDto } from '../../../src/modules/admin/dto/create-tenant.dto';
import { AssignUserRoleDto } from '../../../src/modules/admin/dto/assign-user-role.dto';
import { UserRole } from '../../../src/common/enums/prisma.enums';

describe('AdminService', () => {
  let prisma: jest.Mocked<PrismaService>;
  let config: jest.Mocked<ConfigService>;
  let service: AdminService;

  beforeEach(() => {
    prisma = {
      tenant: {
        findUnique: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
      },
      user: {
        findUnique: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
      },
    } as unknown as jest.Mocked<PrismaService>;

    config = {
      get: jest.fn().mockImplementation((_key: string, defaultValue: unknown) => defaultValue ?? 12),
    } as unknown as jest.Mocked<ConfigService>;

    service = new AdminService(prisma, config);
  });

  describe('createTenant', () => {
    it('creates a tenant when slug is unique', async () => {
      const dto: CreateTenantDto = { name: 'Acme', slug: 'acme' };
      (prisma.tenant.findUnique as jest.Mock).mockResolvedValue(null);
      const created = { id: 't1', ...dto } as any;
      (prisma.tenant.create as jest.Mock).mockResolvedValue(created);

      const result = await service.createTenant(dto);

      expect(prisma.tenant.findUnique).toHaveBeenCalledWith({ where: { slug: dto.slug } });
      expect(prisma.tenant.create).toHaveBeenCalledWith({
        data: { name: dto.name, slug: dto.slug },
      });
      expect(result).toBe(created);
    });

    it('throws ConflictException if slug already exists', async () => {
      const dto: CreateTenantDto = { name: 'Acme', slug: 'acme' };
      (prisma.tenant.findUnique as jest.Mock).mockResolvedValue({ id: 'existing' } as any);

      await expect(service.createTenant(dto)).rejects.toBeInstanceOf(ConflictException);
    });
  });

  describe('assignUserRole', () => {
    it('updates user role when tenant matches', async () => {
      const dto: AssignUserRoleDto = { tenantId: 'tenant-1', role: UserRole.EDITOR };
      (prisma.user.findUnique as jest.Mock).mockResolvedValue({ id: 'user-1', tenantId: dto.tenantId } as any);
      const updatedUser = { id: 'user-1', tenantId: dto.tenantId, role: dto.role } as any;
      (prisma.user.update as jest.Mock).mockResolvedValue(updatedUser);

      const result = await service.assignUserRole('user-1', dto);

      expect(prisma.user.findUnique).toHaveBeenCalledWith({ where: { id: 'user-1' } });
      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: 'user-1' },
        data: { role: dto.role },
      });
      expect(result).toBe(updatedUser);
    });

    it('throws NotFoundException when tenant does not match', async () => {
      const dto: AssignUserRoleDto = { tenantId: 'tenant-1', role: UserRole.EDITOR };
      (prisma.user.findUnique as jest.Mock).mockResolvedValue({ id: 'user-1', tenantId: 'other-tenant' } as any);

      await expect(service.assignUserRole('user-1', dto)).rejects.toBeInstanceOf(NotFoundException);
    });
  });
});
