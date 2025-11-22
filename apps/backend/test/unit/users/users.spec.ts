import 'reflect-metadata';
import { ConflictException, NotFoundException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { UsersService } from '../../../src/modules/users/users.service';
import { USERS_REPOSITORY, UsersRepository } from '../../../src/modules/users/repositories/users.repository';
import { StorageService } from '../../../src/modules/storage/storage.service';
import { CursorPaginationDto } from '../../../src/common/dto/cursor-pagination.dto';
import { UserRole } from '../../../src/common/enums/prisma.enums';
import { JwtPayload } from '../../../src/modules/auth/interfaces/jwt-payload.interface';
import * as bcrypt from 'bcrypt';

jest.mock('bcrypt', () => ({
  hash: jest.fn().mockResolvedValue('hashed-password'),
  compare: jest.fn(),
}));

describe('UsersService', () => {

  const mockUsersRepository = (): jest.Mocked<UsersRepository> => ({
    findMany: jest.fn(),
    findByEmail: jest.fn(),
    create: jest.fn(),
    findById: jest.fn(),
    update: jest.fn(),
  }) as unknown as jest.Mocked<UsersRepository>;

  const mockStorageService = (): Partial<StorageService> => ({
    deleteFile: jest.fn(),
  });

  const adminActor: JwtPayload = {
    sub: 'admin-user',
    email: 'admin@example.com',
    tenantId: 't1',
    role: UserRole.ADMIN,
  };

  beforeEach(() => {
    jest.resetModules();
    jest.resetAllMocks();
    process.env.BCRYPT_SALT_ROUNDS = '10';
    jest.mocked(bcrypt.hash).mockResolvedValue('hashed-password');
  });

  it('paginates user list with cursor params', async () => {
    const repo = mockUsersRepository();
    repo.findMany.mockResolvedValue([
      { id: 'u1', tenantId: 't1', email: 'a@b.com', name: 'A', role: UserRole.LISTENER, isActive: true, createdAt: new Date(), updatedAt: new Date() },
    ] as any);

    const moduleRef = await Test.createTestingModule({
      providers: [
        UsersService,
        { provide: USERS_REPOSITORY, useValue: repo },
        { provide: StorageService, useValue: mockStorageService() },
      ],
    }).compile();

    const service = moduleRef.get(UsersService);
    const result = await service.findAll({ limit: 10 } as CursorPaginationDto, adminActor);

    expect(repo.findMany).toHaveBeenCalledWith(expect.objectContaining({ tenantId: 't1', limit: 10 }));
    expect(result.data).toHaveLength(1);
  });

  it('creates user when email is unique', async () => {
    const repo = mockUsersRepository();
    repo.findByEmail.mockResolvedValue(null);
    repo.create.mockResolvedValue({
      id: 'u1',
      tenantId: 't1',
      email: 'new@example.com',
      passwordHash: 'hash',
      name: 'New',
      role: UserRole.LISTENER,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    } as any);

    const moduleRef = await Test.createTestingModule({
      providers: [
        UsersService,
        { provide: USERS_REPOSITORY, useValue: repo },
        { provide: StorageService, useValue: mockStorageService() },
      ],
    }).compile();

    const service = moduleRef.get(UsersService);
    const result = await service.create({ tenantId: 't1', email: 'new@example.com', password: 'secret' } as any, adminActor);

    expect(repo.create).toHaveBeenCalledWith(
      expect.objectContaining({ tenantId: 't1', email: 'new@example.com', passwordHash: 'hashed-password' }),
    );
    expect(result.email).toBe('new@example.com');
  });

  it('throws conflict when email already exists', async () => {
    const repo = mockUsersRepository();
    repo.findByEmail.mockResolvedValue({ id: 'existing' } as any);

    const moduleRef = await Test.createTestingModule({
      providers: [
        UsersService,
        { provide: USERS_REPOSITORY, useValue: repo },
        { provide: StorageService, useValue: mockStorageService() },
      ],
    }).compile();

    const service = moduleRef.get(UsersService);

    await expect(
      service.create({ tenantId: 't1', email: 'taken@example.com', password: 'secret' } as any, adminActor),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('updates user when found', async () => {
    const repo = mockUsersRepository();
    repo.findById.mockResolvedValue({ id: 'u1', tenantId: 't1', role: UserRole.LISTENER } as any);
    repo.update.mockResolvedValue({ id: 'u1', tenantId: 't1', role: UserRole.ADMIN } as any);

    const moduleRef = await Test.createTestingModule({
      providers: [
        UsersService,
        { provide: USERS_REPOSITORY, useValue: repo },
        { provide: StorageService, useValue: mockStorageService() },
      ],
    }).compile();

    const service = moduleRef.get(UsersService);
    const result = await service.update('u1', { role: UserRole.ADMIN }, adminActor);

    expect(repo.update).toHaveBeenCalledWith('u1', 't1', expect.objectContaining({ role: UserRole.ADMIN }));
    expect(result.role).toBe(UserRole.ADMIN);
  });

  it('throws NotFound when updating missing user', async () => {
    const repo = mockUsersRepository();
    repo.findById.mockResolvedValue(null);

    const moduleRef = await Test.createTestingModule({
      providers: [
        UsersService,
        { provide: USERS_REPOSITORY, useValue: repo },
        { provide: StorageService, useValue: mockStorageService() },
      ],
    }).compile();

    const service = moduleRef.get(UsersService);

    await expect(service.update('missing', { role: UserRole.ADMIN }, adminActor)).rejects.toBeInstanceOf(NotFoundException);
  });
});
