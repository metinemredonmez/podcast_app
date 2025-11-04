import 'reflect-metadata';
import { ConflictException, NotFoundException } from '@nestjs/common';
import { CategoriesService } from '../../../src/modules/categories/categories.service';
import { PrismaService } from '../../../src/infra/prisma.service';
import { ListCategoriesDto } from '../../../src/modules/categories/dto/list-categories.dto';

describe('CategoriesService', () => {
  let prisma: jest.Mocked<PrismaService>;
  let service: CategoriesService;

  beforeEach(() => {
    prisma = {
      category: {
        findMany: jest.fn(),
        findFirst: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
      },
    } as unknown as jest.Mocked<PrismaService>;

    service = new CategoriesService(prisma);
  });

  it('lists categories with pagination and search filters', async () => {
    prisma.category.findMany.mockResolvedValue([]);
    const filter: ListCategoriesDto = { tenantId: 'tenant-1', search: 'tech', page: 2, limit: 5 };

    await service.list(filter);

    expect(prisma.category.findMany).toHaveBeenCalledWith({
      where: {
        tenantId: 'tenant-1',
        name: { contains: 'tech', mode: 'insensitive' },
      },
      orderBy: { createdAt: 'desc' },
      skip: 5,
      take: 5,
    });
  });

  it('creates category when slug unique per tenant', async () => {
    prisma.category.findFirst.mockResolvedValueOnce(null);
    prisma.category.create.mockResolvedValue({ id: 'cat-1' } as any);

    const result = await service.create({ tenantId: 'tenant-1', name: 'Tech', description: 'desc' });

    expect(prisma.category.create).toHaveBeenCalledWith({
      data: expect.objectContaining({ tenantId: 'tenant-1', name: 'Tech', slug: expect.any(String) }),
    });
    expect(result).toEqual({ id: 'cat-1' });
  });

  it('throws conflict when slug exists', async () => {
    prisma.category.findFirst.mockResolvedValueOnce({ id: 'existing' } as any);

    await expect(
      service.create({ tenantId: 'tenant-1', name: 'Tech', slug: 'tech' }),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('updates category and enforces unique slug', async () => {
    prisma.category.findFirst.mockResolvedValueOnce({ id: 'cat-1', tenantId: 'tenant-1' } as any);
    prisma.category.findFirst.mockResolvedValueOnce(null);
    prisma.category.update.mockResolvedValue({ id: 'cat-1', name: 'Updated' } as any);

    const result = await service.update('tenant-1', 'cat-1', { slug: 'updated', name: 'Updated' });

    expect(prisma.category.update).toHaveBeenCalledWith({
      where: { id: 'cat-1' },
      data: { slug: 'updated', name: 'Updated' },
    });
    expect(result).toEqual({ id: 'cat-1', name: 'Updated' });
  });

  it('throws when updating missing category', async () => {
    prisma.category.findFirst.mockResolvedValueOnce(null);

    await expect(service.update('tenant-1', 'missing', { name: 'Updated' })).rejects.toBeInstanceOf(NotFoundException);
  });

  it('deletes category after existence check', async () => {
    prisma.category.findFirst.mockResolvedValueOnce({ id: 'cat-1', tenantId: 'tenant-1' } as any);

    await service.delete('tenant-1', 'cat-1');

    expect(prisma.category.delete).toHaveBeenCalledWith({ where: { id: 'cat-1' } });
  });
});
