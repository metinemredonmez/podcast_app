import 'reflect-metadata';
import { NotFoundException } from '@nestjs/common';
import { HocasService } from '../../../src/modules/hocas/hocas.service';
import { PrismaService } from '../../../src/infra/prisma.service';
import { ListHocaDto } from '../../../src/modules/hocas/dto/list-hoca.dto';

describe('HocasService', () => {
  let prisma: jest.Mocked<PrismaService>;
  let service: HocasService;

  beforeEach(() => {
    prisma = {
      hoca: {
        findMany: jest.fn(),
        findFirst: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
      },
    } as unknown as jest.Mocked<PrismaService>;

    service = new HocasService(prisma);
  });

  it('lists hocas with pagination and search', async () => {
    prisma.hoca.findMany.mockResolvedValue([]);
    const filter: ListHocaDto = { tenantId: 'tenant-1', search: 'ali', page: 2, limit: 5 };

    await service.findAll(filter);

    expect(prisma.hoca.findMany).toHaveBeenCalledWith({
      where: {
        tenantId: 'tenant-1',
        name: { contains: 'ali', mode: 'insensitive' },
      },
      orderBy: { createdAt: 'desc' },
      skip: 5,
      take: 5,
      include: expect.any(Object),
    });
  });

  it('creates a new hoca', async () => {
    const dto = { tenantId: 'tenant-1', name: 'Ali', bio: 'Mentor', expertise: 'Audio' };
    prisma.hoca.create.mockResolvedValue({ id: 'h1', ...dto } as any);

    const result = await service.create(dto as any);

    expect(prisma.hoca.create).toHaveBeenCalledWith({
      data: expect.objectContaining(dto),
      include: expect.any(Object),
    });
    expect(result).toEqual({ id: 'h1', ...dto });
  });

  it('updates an existing hoca', async () => {
    prisma.hoca.findFirst.mockResolvedValue({ id: 'h1', tenantId: 'tenant-1' } as any);
    prisma.hoca.update.mockResolvedValue({ id: 'h1', name: 'Updated' } as any);

    const result = await service.update('tenant-1', 'h1', { name: 'Updated' });

    expect(prisma.hoca.update).toHaveBeenCalledWith({
      where: { id: 'h1' },
      data: { name: 'Updated' },
      include: expect.any(Object),
    });
    expect(result).toEqual({ id: 'h1', name: 'Updated' });
  });

  it('throws when updating missing hoca', async () => {
    prisma.hoca.findFirst.mockResolvedValue(null);

    await expect(service.update('tenant-1', 'missing', { name: 'Updated' })).rejects.toBeInstanceOf(
      NotFoundException,
    );
    expect(prisma.hoca.update).not.toHaveBeenCalled();
  });

  it('deletes hoca when found', async () => {
    prisma.hoca.findFirst.mockResolvedValue({ id: 'h1', tenantId: 'tenant-1' } as any);

    await service.delete('tenant-1', 'h1');

    expect(prisma.hoca.delete).toHaveBeenCalledWith({ where: { id: 'h1' } });
  });
});
