import { BadRequestException, ForbiddenException } from '@nestjs/common';
import { StreamingService } from '../../../src/modules/streaming/streaming.service';
import { PrismaService } from '../../../src/infra/prisma.service';
import { LiveStreamGateway } from '../../../src/ws/gateways/live-stream.gateway';
import { StreamStatus } from '@podcast-app/shared-types';
import { UserRole } from '../../../src/common/enums/prisma.enums';

describe('StreamingService', () => {
  let service: StreamingService;
  let prisma: jest.Mocked<PrismaService>;
  let gateway: jest.Mocked<LiveStreamGateway>;
  const actor = { tenantId: 'tenant-1', userId: 'host-1', role: UserRole.CREATOR };

  beforeEach(() => {
    prisma = {
      streamingSession: {
        findMany: jest.fn(),
        findFirst: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
      },
    } as unknown as jest.Mocked<PrismaService>;

    gateway = {
      emitSessionStarted: jest.fn(),
      emitSessionEnded: jest.fn(),
      emitViewerCount: jest.fn(),
      emitSessionStatusChanged: jest.fn(),
    } as unknown as jest.Mocked<LiveStreamGateway>;

    service = new StreamingService(prisma, gateway);
  });

  it('creates a streaming session', async () => {
    const session = { id: 's1', status: StreamStatus.SCHEDULED, tenantId: 'tenant-1' } as any;
    prisma.streamingSession.create.mockResolvedValue(session);

    const dto = {
      hostId: 'host-1',
    };

    const result = await service.create(dto, actor);

    expect(result).toBe(session);
    expect(prisma.streamingSession.create).toHaveBeenCalledWith({
      data: expect.objectContaining({ tenantId: actor.tenantId, hostId: dto.hostId }),
      include: expect.any(Object),
    });
    expect(gateway.emitSessionStatusChanged).toHaveBeenCalledWith(session);
    expect(gateway.emitSessionStarted).not.toHaveBeenCalled();
  });

  it('filters sessions by tenant and host', async () => {
    prisma.streamingSession.findMany.mockResolvedValue([]);

    await service.findAll({ tenantId: undefined, hostId: 'host-1', page: 2, limit: 5 }, actor);

    expect(prisma.streamingSession.findMany).toHaveBeenCalledWith({
      where: expect.objectContaining({ tenantId: actor.tenantId, hostId: 'host-1' }),
      orderBy: { createdAt: 'desc' },
      skip: 5,
      take: 5,
      include: expect.any(Object),
    });
  });

  it('fires gateway when creating live session', async () => {
    const session = { id: 's1', status: StreamStatus.LIVE, tenantId: 'tenant-1' } as any;
    prisma.streamingSession.create.mockResolvedValue(session);

    await service.create({ hostId: 'host-1', status: StreamStatus.LIVE }, actor);

    expect(gateway.emitSessionStarted).toHaveBeenCalledWith(session);
    expect(gateway.emitSessionStatusChanged).toHaveBeenCalledWith(session);
  });

  it('rejects creation with invalid initial status', async () => {
    await expect(
      service.create({ hostId: 'host-1', status: StreamStatus.CANCELLED }, actor),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(prisma.streamingSession.create).not.toHaveBeenCalled();
  });

  it('updates status to live and triggers gateway', async () => {
    prisma.streamingSession.findFirst.mockResolvedValue({
      id: 's1',
      tenantId: 'tenant-1',
      hostId: 'host-1',
      status: StreamStatus.SCHEDULED,
    } as any);
    const updated = { id: 's1', status: StreamStatus.LIVE, tenantId: 'tenant-1' } as any;
    prisma.streamingSession.update.mockResolvedValue(updated);

    const result = await service.updateStatus('tenant-1', 's1', { status: StreamStatus.LIVE }, actor);

    expect(prisma.streamingSession.update).toHaveBeenCalledWith({
      where: { id: 's1' },
      data: expect.objectContaining({ status: StreamStatus.LIVE, startedAt: expect.any(Date) }),
      include: expect.any(Object),
    });
    expect(result).toBe(updated);
    expect(gateway.emitSessionStarted).toHaveBeenCalledWith(updated);
    expect(gateway.emitSessionStatusChanged).toHaveBeenCalledWith(updated);
  });

  it('updates status to ended and triggers gateway', async () => {
    prisma.streamingSession.findFirst.mockResolvedValue({
      id: 's1',
      tenantId: 'tenant-1',
      hostId: 'host-1',
      status: StreamStatus.LIVE,
    } as any);
    const updated = { id: 's1', status: StreamStatus.ENDED, tenantId: 'tenant-1' } as any;
    prisma.streamingSession.update.mockResolvedValue(updated);

    await service.updateStatus('tenant-1', 's1', { status: StreamStatus.ENDED }, actor);

    expect(gateway.emitSessionEnded).toHaveBeenCalledWith(updated);
    expect(gateway.emitSessionStatusChanged).toHaveBeenCalledWith(updated);
  });

  it('updates status to cancelled and triggers gateway', async () => {
    prisma.streamingSession.findFirst.mockResolvedValue({
      id: 's1',
      tenantId: 'tenant-1',
      hostId: 'host-1',
      status: StreamStatus.LIVE,
    } as any);
    const updated = { id: 's1', status: StreamStatus.CANCELLED, tenantId: 'tenant-1' } as any;
    prisma.streamingSession.update.mockResolvedValue(updated);

    await service.updateStatus('tenant-1', 's1', { status: StreamStatus.CANCELLED }, actor);

    expect(gateway.emitSessionEnded).toHaveBeenCalledWith(updated);
    expect(gateway.emitSessionStatusChanged).toHaveBeenCalledWith(updated);
  });

  it('deletes a session after existence check', async () => {
    prisma.streamingSession.findFirst.mockResolvedValue({
      id: 's1',
      tenantId: 'tenant-1',
      hostId: 'host-1',
      status: StreamStatus.SCHEDULED,
    } as any);

    await service.delete('tenant-1', 's1', actor);

    expect(prisma.streamingSession.delete).toHaveBeenCalledWith({ where: { id: 's1' } });
  });

  it('prevents invalid transitions', async () => {
    prisma.streamingSession.findFirst.mockResolvedValue({
      id: 's1',
      tenantId: 'tenant-1',
      hostId: 'host-1',
      status: StreamStatus.SCHEDULED,
    } as any);

    await expect(
      service.updateStatus('tenant-1', 's1', { status: StreamStatus.ENDED }, actor),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(prisma.streamingSession.update).not.toHaveBeenCalled();
  });

  it('prevents non-host updates when not admin', async () => {
    prisma.streamingSession.findFirst.mockResolvedValue({
      id: 's1',
      tenantId: 'tenant-1',
      hostId: 'other-host',
      status: StreamStatus.SCHEDULED,
    } as any);

    await expect(
      service.update('tenant-1', 's1', { podcastId: 'pod-1' }, actor),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('prevents non-host status changes when not admin', async () => {
    prisma.streamingSession.findFirst.mockResolvedValue({
      id: 's1',
      tenantId: 'tenant-1',
      hostId: 'other-host',
      status: StreamStatus.SCHEDULED,
    } as any);

    await expect(
      service.updateStatus('tenant-1', 's1', { status: StreamStatus.LIVE }, actor),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });
});
