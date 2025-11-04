import 'reflect-metadata';
import { NotificationsService } from '../../../src/modules/notifications/notifications.service';
import { NotificationQueueService } from '../../../src/jobs/queues/notification.queue';
import { NotificationsGateway } from '../../../src/ws/gateways/notifications.gateway';
import { PrismaService } from '../../../src/infra/prisma.service';
import { CreateNotificationDto } from '../../../src/modules/notifications/dto/create-notification.dto';
import { SendNotificationDto } from '../../../src/modules/notifications/dto/send-notification.dto';
import { MarkNotificationReadDto } from '../../../src/modules/notifications/dto/mark-notification-read.dto';
import { NotificationType } from '../../../src/common/enums/prisma.enums';

const createDto: CreateNotificationDto = {
  tenantId: 'tenant-1',
  userId: 'user-1',
  type: NotificationType.SYSTEM,
  payload: { message: 'Hello' },
};

const sendDto: SendNotificationDto = {
  tenantId: 'tenant-1',
  userId: 'user-1',
  type: NotificationType.SYSTEM,
  payload: { message: 'Queued' },
};

describe('NotificationsService', () => {
  let prisma: jest.Mocked<PrismaService>;
  let queue: jest.Mocked<NotificationQueueService>;
  let gateway: jest.Mocked<NotificationsGateway>;
  let service: NotificationsService;

  beforeEach(() => {
    prisma = {
      notification: {
        findMany: jest.fn(),
        findFirst: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        updateMany: jest.fn(),
        delete: jest.fn(),
      },
    } as unknown as jest.Mocked<PrismaService>;

    queue = {
      enqueue: jest.fn(),
    } as unknown as jest.Mocked<NotificationQueueService>;

    gateway = {
      emitNotification: jest.fn(),
    } as unknown as jest.Mocked<NotificationsGateway>;

    service = new NotificationsService(prisma, queue, gateway);
  });

  it('creates notifications via Prisma and emits over WebSocket', async () => {
    const notification = { id: 'n1', ...createDto, payload: createDto.payload, readAt: null, createdAt: new Date(), updatedAt: new Date() } as any;
    prisma.notification.create.mockResolvedValue(notification);

    const result = await service.create(createDto);

    expect(prisma.notification.create).toHaveBeenCalledWith({
      data: {
        tenantId: createDto.tenantId,
        userId: createDto.userId,
        type: createDto.type,
        payload: createDto.payload,
      },
    });
    expect(gateway.emitNotification).toHaveBeenCalledWith(notification);
    expect(result).toBe(notification);
  });

  it('enqueues notifications for async send()', async () => {
    await service.send(sendDto);

    expect(queue.enqueue).toHaveBeenCalledWith({
      tenantId: sendDto.tenantId,
      userId: sendDto.userId,
      type: sendDto.type,
      payload: sendDto.payload,
    });
  });

  it('marks all notifications as read and emits via WebSocket when updates occur', async () => {
    const dto: MarkNotificationReadDto = { tenantId: 'tenant-1', userId: 'user-1' };
    prisma.notification.updateMany.mockResolvedValue({ count: 2 } as any);
    const updatedNotifications = [
      { id: 'n1', tenantId: dto.tenantId, userId: dto.userId, type: NotificationType.SYSTEM, payload: {}, readAt: new Date(), createdAt: new Date(), updatedAt: new Date() },
      { id: 'n2', tenantId: dto.tenantId, userId: dto.userId, type: NotificationType.SYSTEM, payload: {}, readAt: new Date(), createdAt: new Date(), updatedAt: new Date() },
    ];
    (prisma.notification.findMany as jest.Mock).mockResolvedValue(updatedNotifications);

    const result = await service.markAllAsRead(dto);

    expect(prisma.notification.updateMany).toHaveBeenCalledWith({
      where: {
        tenantId: dto.tenantId,
        userId: dto.userId,
        readAt: null,
      },
      data: { readAt: expect.any(Date) },
    });
    expect(prisma.notification.findMany).toHaveBeenCalledWith({
      where: { tenantId: dto.tenantId, userId: dto.userId, readAt: { not: null } },
      orderBy: { updatedAt: 'desc' },
      take: 2,
    });
    expect(gateway.emitNotification).toHaveBeenCalledTimes(2);
    expect(result).toEqual({ updated: 2 });
  });
});
