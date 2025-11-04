import 'reflect-metadata';
import { Test, TestingModule } from '@nestjs/testing';
import { CommentsController } from '../../../src/modules/comments/comments.controller';
import { CommentsService } from '../../../src/modules/comments/comments.service';
import { JwtPayload } from '../../../src/modules/auth/interfaces/jwt-payload.interface';
import { UserRole } from '../../../src/common/enums/prisma.enums';

describe('CommentsController', () => {
  let controller: CommentsController;
  let service: jest.Mocked<CommentsService>;

  const user: JwtPayload = {
    sub: 'user-1',
    email: 'user@example.com',
    tenantId: 'tenant-1',
    role: UserRole.LISTENER,
  };

  beforeEach(async () => {
    service = {
      findAll: jest.fn(),
      findOne: jest.fn(),
      create: jest.fn(),
      reply: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    } as unknown as jest.Mocked<CommentsService>;

    const module: TestingModule = await Test.createTestingModule({
      controllers: [CommentsController],
      providers: [{ provide: CommentsService, useValue: service }],
    }).compile();

    controller = module.get<CommentsController>(CommentsController);
  });

  it('falls back to user tenant when listing comments', async () => {
    service.findAll.mockResolvedValue([]);

    await controller.findAll({ tenantId: undefined } as any, user);

    expect(service.findAll).toHaveBeenCalledWith({ tenantId: user.tenantId });
  });

  it('creates comments using authenticated user context', async () => {
    service.create.mockResolvedValue({ id: 'comment-1' } as any);

    const result = await controller.create({ episodeId: 'episode-1', content: 'Hello' } as any, user);

    expect(service.create).toHaveBeenCalledWith(
      expect.objectContaining({
        tenantId: user.tenantId,
        userId: user.sub,
        episodeId: 'episode-1',
        content: 'Hello',
      }),
      expect.objectContaining({ userId: user.sub, tenantId: user.tenantId, role: user.role }),
    );
    expect(result).toEqual({ id: 'comment-1' });
  });
});
