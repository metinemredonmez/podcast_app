import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../infra/prisma.service';
import { LiveStreamGateway } from '../../ws/gateways/live-stream.gateway';
import { CreateSessionDto } from './dto/create-session.dto';
import { UpdateStreamingDto } from './dto/update-streaming.dto';
import { UpdateSessionStatusDto } from './dto/update-session-status.dto';
import { ListStreamingDto } from './dto/list-streaming.dto';
import { UserRole, StreamStatus } from '../../common/enums/prisma.enums';

const sessionInclude = {
  host: {
    select: {
      id: true,
      name: true,
      email: true,
    },
  },
  podcast: {
    select: {
      id: true,
      title: true,
    },
  },
  episode: {
    select: {
      id: true,
      title: true,
    },
  },
} as const;

type StreamingSessionWithRelations = Prisma.StreamingSessionGetPayload<{
  include: typeof sessionInclude;
}>;

interface StreamingActorContext {
  tenantId: string;
  userId: string;
  role: UserRole;
}

const ALLOWED_TRANSITIONS: Record<StreamStatus, StreamStatus[]> = {
  [StreamStatus.SCHEDULED]: [StreamStatus.LIVE, StreamStatus.CANCELLED],
  [StreamStatus.LIVE]: [StreamStatus.ENDED, StreamStatus.CANCELLED],
  [StreamStatus.ENDED]: [],
  [StreamStatus.CANCELLED]: [],
};

const INITIAL_ALLOWED_STATUSES = new Set<StreamStatus>([
  StreamStatus.SCHEDULED,
  StreamStatus.LIVE,
]);

@Injectable()
export class StreamingService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly gateway: LiveStreamGateway,
  ) {}

  async findAll(filter: ListStreamingDto, actor: StreamingActorContext): Promise<StreamingSessionWithRelations[]> {
    const tenantId = filter.tenantId ?? actor.tenantId;
    this.ensureTenantAccess(tenantId, actor);

    const page = filter.page ?? 1;
    const limit = filter.limit ?? 20;
    const skip = (page - 1) * limit;

    return this.prisma.streamingSession.findMany({
      where: {
        tenantId,
        ...(filter.hostId ? { hostId: filter.hostId } : {}),
        ...(filter.status ? { status: filter.status } : {}),
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
      include: sessionInclude,
    });
  }

  async findOne(tenantId: string, id: string, actor: StreamingActorContext): Promise<StreamingSessionWithRelations> {
    this.ensureTenantAccess(tenantId, actor);
    return this.ensureExists(tenantId, id);
  }

  async create(dto: CreateSessionDto, actor: StreamingActorContext): Promise<StreamingSessionWithRelations> {
    const tenantId = dto.tenantId ?? actor.tenantId;
    this.ensureTenantAccess(tenantId, actor);

    const status = dto.status ?? StreamStatus.SCHEDULED;
    if (!INITIAL_ALLOWED_STATUSES.has(status)) {
      throw new BadRequestException(`Cannot create streaming session with status ${status}.`);
    }

    const session = await this.prisma.streamingSession.create({
      data: {
        tenantId,
        hostId: dto.hostId,
        podcastId: dto.podcastId,
        episodeId: dto.episodeId,
        status,
        startedAt: status === StreamStatus.LIVE ? new Date() : undefined,
      },
      include: sessionInclude,
    });

    this.dispatchStatusEvents(session);

    return session;
  }

  async update(tenantId: string, id: string, dto: UpdateStreamingDto, actor: StreamingActorContext): Promise<StreamingSessionWithRelations> {
    this.ensureTenantAccess(tenantId, actor);
    const session = await this.ensureExists(tenantId, id);
    this.ensureCanControl(session, actor);

    const updated = await this.prisma.streamingSession.update({
      where: { id },
      data: {
        ...(dto.podcastId !== undefined ? { podcastId: dto.podcastId } : {}),
        ...(dto.episodeId !== undefined ? { episodeId: dto.episodeId } : {}),
      },
      include: sessionInclude,
    });

    return updated;
  }

  async updateStatus(tenantId: string, id: string, dto: UpdateSessionStatusDto, actor: StreamingActorContext): Promise<StreamingSessionWithRelations> {
    this.ensureTenantAccess(tenantId, actor);
    const current = await this.ensureExists(tenantId, id);
    this.ensureCanControl(current, actor);

    if (current.status === dto.status) {
      return current;
    }

    const allowed = ALLOWED_TRANSITIONS[current.status] ?? [];
    if (!allowed.includes(dto.status)) {
      throw new BadRequestException(`Invalid status transition from ${current.status} to ${dto.status}.`);
    }

    const data: Prisma.StreamingSessionUpdateInput = {
      status: dto.status,
    };

    if (dto.status === StreamStatus.LIVE) {
      data.startedAt = current.startedAt ?? new Date();
    }

    if (dto.status === StreamStatus.ENDED || dto.status === StreamStatus.CANCELLED) {
      data.endedAt = new Date();
    }

    const session = await this.prisma.streamingSession.update({
      where: { id },
      data,
      include: sessionInclude,
    });

    this.dispatchStatusEvents(session);

    return session;
  }

  async delete(tenantId: string, id: string, actor: StreamingActorContext): Promise<void> {
    this.ensureTenantAccess(tenantId, actor);
    const session = await this.ensureExists(tenantId, id);
    this.ensureCanControl(session, actor);
    await this.prisma.streamingSession.delete({ where: { id } });
  }

  private async ensureExists(tenantId: string, id: string): Promise<StreamingSessionWithRelations> {
    const exists = await this.prisma.streamingSession.findFirst({
      where: { id, tenantId },
      include: sessionInclude,
    });

    if (!exists) {
      throw new NotFoundException(`Streaming session ${id} not found.`);
    }

    return exists;
  }

  private ensureTenantAccess(tenantId: string, actor: StreamingActorContext) {
    if (actor.role !== UserRole.ADMIN && actor.tenantId !== tenantId) {
      throw new ForbiddenException('Access denied for streaming sessions in this tenant.');
    }
  }

  private ensureCanControl(session: StreamingSessionWithRelations, actor: StreamingActorContext) {
    if (actor.role === UserRole.ADMIN) {
      return;
    }

    if (session.hostId !== actor.userId) {
      throw new ForbiddenException('Only the host or an admin can modify this session.');
    }
  }

  private dispatchStatusEvents(session: StreamingSessionWithRelations) {
    this.gateway.emitSessionStatusChanged(session);

    if (session.status === StreamStatus.LIVE) {
      this.gateway.emitSessionStarted(session);
    }

    if (session.status === StreamStatus.ENDED || session.status === StreamStatus.CANCELLED) {
      this.gateway.emitSessionEnded(session);
    }
  }
}
