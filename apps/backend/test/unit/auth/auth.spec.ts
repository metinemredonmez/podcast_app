import 'reflect-metadata';
import { ConflictException, UnauthorizedException } from '@nestjs/common';
import { AuthService } from '../../../src/modules/auth/auth.service';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { USERS_REPOSITORY, UsersRepository } from '../../../src/modules/users/repositories/users.repository';
import { EmailQueueService } from '../../../src/jobs/queues/email.queue';
import { PrismaService } from '../../../src/infra/prisma.service';
import { Test } from '@nestjs/testing';
import { UserRole } from '../../../src/common/enums/prisma.enums';
import * as bcrypt from 'bcrypt';

jest.mock('bcrypt', () => ({
  hash: jest.fn().mockResolvedValue('hashed-password'),
  compare: jest.fn().mockResolvedValue(true),
}));

describe('AuthService', () => {

  const mockUsersRepository = (): jest.Mocked<UsersRepository> => ({
    findByEmail: jest.fn(),
    create: jest.fn(),
    findById: jest.fn(),
    update: jest.fn(),
    findMany: jest.fn() as any,
  }) as unknown as jest.Mocked<UsersRepository>;

  const mockJwtService = (): Partial<JwtService> => ({
    signAsync: jest.fn().mockImplementation(async (_payload: any, options?: any) => {
      return options?.secret ? 'refresh-token' : 'access-token';
    }),
  });

  const mockConfigService = (): Partial<ConfigService> => ({
    get: jest.fn((key: string, defaultValue?: any) => {
      switch (key) {
        case 'jwt.refreshSecret':
          return 'refresh-secret';
        case 'jwt.refreshTokenTtl':
          return '7d';
        default:
          return defaultValue;
      }
    }),
  });

  const mockEmailQueueService = (): Partial<EmailQueueService> => ({
    sendWelcomeEmail: jest.fn().mockResolvedValue(undefined),
    sendPasswordResetEmail: jest.fn().mockResolvedValue(undefined),
    sendVerificationEmail: jest.fn().mockResolvedValue(undefined),
  });

  const mockPrismaService = (): Partial<PrismaService> => ({
    passwordReset: { create: jest.fn(), findFirst: jest.fn(), update: jest.fn() } as any,
    emailVerification: { create: jest.fn(), findFirst: jest.fn(), update: jest.fn() } as any,
  });

  beforeEach(() => {
    jest.resetModules();
    jest.resetAllMocks();
    process.env.BCRYPT_SALT_ROUNDS = '10';
    jest.mocked(bcrypt.hash).mockResolvedValue('hashed-password');
    jest.mocked(bcrypt.compare).mockResolvedValue(true);
  });

  it('registers new user and returns tokens', async () => {
    const usersRepo = mockUsersRepository();
    usersRepo.findByEmail.mockResolvedValue(null);
    usersRepo.create.mockResolvedValue({
      id: 'user-1',
      tenantId: 'tenant-1',
      email: 'user@example.com',
      passwordHash: 'hashed',
      name: 'User',
      role: UserRole.LISTENER,
    } as any);

    const moduleRef = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: JwtService, useValue: mockJwtService() },
        { provide: ConfigService, useValue: mockConfigService() },
        { provide: USERS_REPOSITORY, useValue: usersRepo },
        { provide: EmailQueueService, useValue: mockEmailQueueService() },
        { provide: PrismaService, useValue: mockPrismaService() },
      ],
    }).compile();

    const service = moduleRef.get(AuthService);
    const result = await service.register({
      tenantId: 'tenant-1',
      email: 'user@example.com',
      password: 'secret',
      name: 'User',
    } as any);

    expect(result.tokens.accessToken).toBe('access-token');
    expect(usersRepo.create).toHaveBeenCalledWith(
      expect.objectContaining({ email: 'user@example.com', passwordHash: 'hashed-password' }),
    );
    expect(usersRepo.update).toHaveBeenCalledWith('user-1', 'tenant-1', { refreshTokenHash: expect.any(String) });
  });

  it('throws conflict when registering existing email', async () => {
    const usersRepo = mockUsersRepository();
    usersRepo.findByEmail.mockResolvedValue({ id: 'existing' } as any);

    const moduleRef = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: JwtService, useValue: mockJwtService() },
        { provide: ConfigService, useValue: mockConfigService() },
        { provide: USERS_REPOSITORY, useValue: usersRepo },
        { provide: EmailQueueService, useValue: mockEmailQueueService() },
        { provide: PrismaService, useValue: mockPrismaService() },
      ],
    }).compile();

    const service = moduleRef.get(AuthService);

    await expect(
      service.register({ tenantId: 'tenant-1', email: 'exists@example.com', password: 'secret' } as any),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('fails login when password mismatch', async () => {
    const usersRepo = mockUsersRepository();
    usersRepo.findByEmail.mockResolvedValue({
      id: 'user-1',
      tenantId: 'tenant-1',
      email: 'user@example.com',
      passwordHash: 'hash',
      isActive: true,
      role: UserRole.LISTENER,
    } as any);

    const moduleRef = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: JwtService, useValue: mockJwtService() },
        { provide: ConfigService, useValue: mockConfigService() },
        { provide: USERS_REPOSITORY, useValue: usersRepo },
        { provide: EmailQueueService, useValue: mockEmailQueueService() },
        { provide: PrismaService, useValue: mockPrismaService() },
      ],
    }).compile();

    const service = moduleRef.get(AuthService);
    jest.mocked(bcrypt.compare).mockResolvedValue(false);

    await expect(
      service.login({ email: 'user@example.com', password: 'wrong' } as any),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });
});
