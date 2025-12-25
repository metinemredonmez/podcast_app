import { Injectable, Logger, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../infra/prisma.service';
import { EncryptionService } from '../../common/encryption';
import {
  DevicePlatform,
  PushProviderType,
  PushTargetType,
  PushStatus,
  UserDevice,
  UserPushSettings,
  PushConfig,
  PushNotificationLog,
} from '@prisma/client';
import { JwtPayload } from '../auth/interfaces/jwt-payload.interface';
import { CreatorBroadcastDto } from './dto';
import {
  PushProvider,
  PushMessage,
  SendResult,
  OneSignalProvider,
  FirebaseProvider,
  WebPushProvider,
} from './providers';

interface SendPushOptions {
  title: string;
  body: string;
  data?: Record<string, string>;
  imageUrl?: string;
  targetType: PushTargetType;
  userIds?: string[];
  topic?: string;
  segment?: string;
  scheduledAt?: Date;
  createdBy?: string;
}

@Injectable()
export class PushService {
  private readonly logger = new Logger(PushService.name);
  private providers: Map<string, PushProvider> = new Map();
  private webPushProvider: WebPushProvider | null = null;

  constructor(
    private readonly prisma: PrismaService,
    private readonly encryption: EncryptionService,
    private readonly oneSignalProvider: OneSignalProvider,
    private readonly firebaseProvider: FirebaseProvider,
    private readonly webPushProviderInstance: WebPushProvider,
  ) {
    this.webPushProvider = webPushProviderInstance;
  }

  // ==================== DEVICE MANAGEMENT ====================

  async registerDevice(
    tenantId: string,
    userId: string,
    data: {
      deviceToken: string;
      platform: DevicePlatform;
      deviceName?: string;
      appVersion?: string;
      osVersion?: string;
    },
  ): Promise<UserDevice> {
    // Upsert device - update if exists, create if not
    const device = await this.prisma.userDevice.upsert({
      where: {
        tenantId_deviceToken: {
          tenantId,
          deviceToken: data.deviceToken,
        },
      },
      update: {
        userId,
        platform: data.platform,
        deviceName: data.deviceName,
        appVersion: data.appVersion,
        osVersion: data.osVersion,
        isActive: true,
        lastActiveAt: new Date(),
      },
      create: {
        tenantId,
        userId,
        deviceToken: data.deviceToken,
        platform: data.platform,
        deviceName: data.deviceName,
        appVersion: data.appVersion,
        osVersion: data.osVersion,
      },
    });

    // Ensure user has push settings
    await this.ensurePushSettings(tenantId, userId);

    return device;
  }

  async unregisterDevice(tenantId: string, deviceId: string): Promise<void> {
    await this.prisma.userDevice.updateMany({
      where: { id: deviceId, tenantId },
      data: { isActive: false },
    });
  }

  async getUserDevices(tenantId: string, userId: string): Promise<UserDevice[]> {
    return this.prisma.userDevice.findMany({
      where: { tenantId, userId, isActive: true },
      orderBy: { lastActiveAt: 'desc' },
    });
  }

  async updateDeviceActivity(tenantId: string, deviceToken: string): Promise<void> {
    await this.prisma.userDevice.updateMany({
      where: { tenantId, deviceToken },
      data: { lastActiveAt: new Date() },
    });
  }

  // ==================== PUSH SETTINGS ====================

  async getPushSettings(tenantId: string, userId: string): Promise<UserPushSettings> {
    return this.ensurePushSettings(tenantId, userId);
  }

  async updatePushSettings(
    tenantId: string,
    userId: string,
    data: Partial<UserPushSettings>,
  ): Promise<UserPushSettings> {
    const settings = await this.ensurePushSettings(tenantId, userId);

    return this.prisma.userPushSettings.update({
      where: { id: settings.id },
      data: {
        enablePush: data.enablePush,
        newEpisodes: data.newEpisodes,
        comments: data.comments,
        likes: data.likes,
        follows: data.follows,
        systemUpdates: data.systemUpdates,
        marketingPromotions: data.marketingPromotions,
        quietHoursEnabled: data.quietHoursEnabled,
        quietHoursStart: data.quietHoursStart,
        quietHoursEnd: data.quietHoursEnd,
        timezone: data.timezone,
      },
    });
  }

  private async ensurePushSettings(tenantId: string, userId: string): Promise<UserPushSettings> {
    let settings = await this.prisma.userPushSettings.findUnique({
      where: { userId },
    });

    if (!settings) {
      settings = await this.prisma.userPushSettings.create({
        data: {
          tenantId,
          userId,
        },
      });
    }

    return settings;
  }

  // ==================== PUSH CONFIG (Admin) ====================

  async getPushConfig(tenantId: string): Promise<PushConfig | null> {
    return this.prisma.pushConfig.findUnique({
      where: { tenantId },
    });
  }

  async updatePushConfig(
    tenantId: string,
    data: {
      provider?: PushProviderType;
      isEnabled?: boolean;
      oneSignalAppId?: string;
      oneSignalApiKey?: string;
      firebaseProjectId?: string;
      firebaseCredentials?: string;
      vapidPublicKey?: string;
      vapidPrivateKey?: string;
      vapidSubject?: string;
      defaultTitle?: string;
      defaultIcon?: string;
      defaultBadge?: string;
      rateLimitPerMinute?: number;
    },
  ): Promise<PushConfig> {
    // Encrypt sensitive data
    const encryptedData: Record<string, unknown> = { ...data };

    if (data.oneSignalApiKey) {
      encryptedData.oneSignalApiKey = this.encryption.encrypt(data.oneSignalApiKey);
    }
    if (data.firebaseCredentials) {
      encryptedData.firebaseCredentials = this.encryption.encrypt(data.firebaseCredentials);
    }
    if (data.vapidPrivateKey) {
      encryptedData.vapidPrivateKey = this.encryption.encrypt(data.vapidPrivateKey);
    }

    const config = await this.prisma.pushConfig.upsert({
      where: { tenantId },
      update: encryptedData,
      create: {
        tenantId,
        ...encryptedData,
      } as Parameters<typeof this.prisma.pushConfig.create>[0]['data'],
    });

    // Re-initialize provider with new config
    await this.initializeProvider(tenantId);

    return config;
  }

  async generateVapidKeys(): Promise<{ publicKey: string; privateKey: string }> {
    return WebPushProvider.generateVapidKeys();
  }

  async getVapidPublicKey(tenantId: string): Promise<string | null> {
    const config = await this.getPushConfig(tenantId);
    return config?.vapidPublicKey || null;
  }

  // ==================== SEND NOTIFICATIONS ====================

  async sendPush(tenantId: string, options: SendPushOptions): Promise<PushNotificationLog> {
    const config = await this.getPushConfig(tenantId);

    if (!config?.isEnabled) {
      throw new BadRequestException('Push notifications are not enabled for this tenant');
    }

    // Create log entry
    const log = await this.prisma.pushNotificationLog.create({
      data: {
        tenantId,
        title: options.title,
        body: options.body,
        data: options.data || {},
        targetType: options.targetType,
        targetIds: options.userIds || [options.topic || options.segment || ''],
        status: options.scheduledAt ? PushStatus.QUEUED : PushStatus.PENDING,
        scheduledAt: options.scheduledAt,
        createdBy: options.createdBy,
        provider: config.provider,
      },
    });

    // If scheduled, don't send now
    if (options.scheduledAt && options.scheduledAt > new Date()) {
      return log;
    }

    // Send notification
    const result = await this.executeSend(tenantId, config, options);

    // Update log with result
    return this.prisma.pushNotificationLog.update({
      where: { id: log.id },
      data: {
        status: result.success ? PushStatus.SENT : PushStatus.FAILED,
        successCount: result.successCount || 0,
        failureCount: result.failureCount || 0,
        totalRecipients: (result.successCount || 0) + (result.failureCount || 0),
        providerMsgId: result.messageId,
        errorMessage: result.error,
        sentAt: new Date(),
      },
    });
  }

  async sendCreatorBroadcast(
    actor: JwtPayload,
    dto: CreatorBroadcastDto,
  ): Promise<PushNotificationLog> {
    if (!['CREATOR', 'HOCA', 'ADMIN', 'SUPER_ADMIN'].includes(actor.role)) {
      throw new ForbiddenException('Only creators can send broadcast messages.');
    }

    const tenantId = actor.tenantId;
    let podcastIds: string[] = [];

    if (dto.podcastId) {
      const podcast = await this.prisma.podcast.findFirst({
        where: { id: dto.podcastId, tenantId },
        select: { id: true, ownerId: true },
      });

      if (!podcast) {
        throw new NotFoundException('Podcast not found.');
      }

      if (!['ADMIN', 'SUPER_ADMIN'].includes(actor.role) && podcast.ownerId !== actor.userId) {
        throw new ForbiddenException('You do not have access to this podcast.');
      }

      podcastIds = [podcast.id];
    } else {
      const podcasts = await this.prisma.podcast.findMany({
        where: { tenantId, ownerId: actor.userId },
        select: { id: true },
      });

      podcastIds = podcasts.map((p) => p.id);
    }

    if (podcastIds.length === 0) {
      throw new BadRequestException('No podcasts found to broadcast.');
    }

    const followers = await this.prisma.follow.findMany({
      where: { tenantId, podcastId: { in: podcastIds } },
      select: { userId: true },
      distinct: ['userId'],
    });

    const userIds = followers
      .map((f) => f.userId)
      .filter((userId) => userId && userId !== actor.userId);

    if (userIds.length === 0) {
      throw new BadRequestException('No followers found for broadcast.');
    }

    return this.sendPush(tenantId, {
      title: dto.title,
      body: dto.body,
      imageUrl: dto.imageUrl,
      data: dto.data,
      targetType: PushTargetType.USER_IDS,
      userIds,
      createdBy: actor.userId,
    });
  }

  private async executeSend(
    tenantId: string,
    config: PushConfig,
    options: SendPushOptions,
  ): Promise<SendResult> {
    const provider = await this.getProvider(tenantId, config);

    if (!provider || !provider.isReady()) {
      return { success: false, error: 'Push provider not configured' };
    }

    const message: PushMessage = {
      title: options.title,
      body: options.body,
      data: options.data,
      imageUrl: options.imageUrl,
    };

    switch (options.targetType) {
      case PushTargetType.ALL:
        // Get all active device tokens
        const allDevices = await this.getActiveDeviceTokens(tenantId);
        if (allDevices.length === 0) {
          return { success: true, successCount: 0, failureCount: 0 };
        }
        return provider.sendToDevices(allDevices, message);

      case PushTargetType.USER_IDS:
        if (!options.userIds?.length) {
          return { success: false, error: 'No user IDs specified' };
        }
        // Filter by user settings
        const userDevices = await this.getDeviceTokensForUsers(tenantId, options.userIds);
        if (userDevices.length === 0) {
          return { success: true, successCount: 0, failureCount: 0 };
        }
        return provider.sendToDevices(userDevices, message);

      case PushTargetType.TOPIC:
        if (!options.topic) {
          return { success: false, error: 'No topic specified' };
        }
        return provider.sendToTopic(options.topic, message);

      case PushTargetType.SEGMENT:
        if (!options.segment) {
          return { success: false, error: 'No segment specified' };
        }
        return provider.sendToTopic(options.segment, message);

      default:
        return { success: false, error: 'Invalid target type' };
    }
  }

  private async getActiveDeviceTokens(tenantId: string): Promise<string[]> {
    const devices = await this.prisma.userDevice.findMany({
      where: {
        tenantId,
        isActive: true,
        user: {
          pushSettings: {
            enablePush: true,
          },
        },
      },
      select: { deviceToken: true },
    });

    return devices.map(d => d.deviceToken);
  }

  private async getDeviceTokensForUsers(tenantId: string, userIds: string[]): Promise<string[]> {
    const devices = await this.prisma.userDevice.findMany({
      where: {
        tenantId,
        userId: { in: userIds },
        isActive: true,
        user: {
          pushSettings: {
            enablePush: true,
          },
        },
      },
      select: { deviceToken: true },
    });

    return devices.map(d => d.deviceToken);
  }

  // ==================== PROVIDER MANAGEMENT ====================

  private async getProvider(tenantId: string, config: PushConfig): Promise<PushProvider | null> {
    const key = `${tenantId}:${config.provider}`;

    if (!this.providers.has(key)) {
      await this.initializeProvider(tenantId);
    }

    return this.providers.get(key) || null;
  }

  async initializeProvider(tenantId: string): Promise<void> {
    const config = await this.getPushConfig(tenantId);

    if (!config) {
      return;
    }

    const key = `${tenantId}:${config.provider}`;

    try {
      switch (config.provider) {
        case PushProviderType.ONESIGNAL:
          if (config.oneSignalAppId && config.oneSignalApiKey) {
            await this.oneSignalProvider.initialize({
              appId: config.oneSignalAppId,
              apiKey: this.encryption.decrypt(config.oneSignalApiKey),
            });
            this.providers.set(key, this.oneSignalProvider);
          }
          break;

        case PushProviderType.FIREBASE:
          if (config.firebaseProjectId && config.firebaseCredentials) {
            await this.firebaseProvider.initialize({
              projectId: config.firebaseProjectId,
              credentials: this.encryption.decrypt(config.firebaseCredentials),
            });
            this.providers.set(key, this.firebaseProvider);
          }
          break;
      }

      // Also initialize web push if VAPID keys exist
      if (config.vapidPublicKey && config.vapidPrivateKey && config.vapidSubject) {
        await this.webPushProvider?.initialize({
          vapidPublicKey: config.vapidPublicKey,
          vapidPrivateKey: this.encryption.decrypt(config.vapidPrivateKey),
          vapidSubject: config.vapidSubject,
        } as Parameters<typeof this.webPushProvider.initialize>[0]);
      }

      this.logger.log(`Push provider initialized for tenant ${tenantId}: ${config.provider}`);
    } catch (error) {
      this.logger.error(`Failed to initialize push provider for tenant ${tenantId}`, error);
    }
  }

  // ==================== LOGS & ANALYTICS ====================

  async getPushLogs(
    tenantId: string,
    options: { limit?: number; offset?: number; status?: PushStatus },
  ): Promise<{ data: PushNotificationLog[]; total: number }> {
    const where = {
      tenantId,
      ...(options.status && { status: options.status }),
    };

    const [data, total] = await Promise.all([
      this.prisma.pushNotificationLog.findMany({
        where,
        take: options.limit || 20,
        skip: options.offset || 0,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.pushNotificationLog.count({ where }),
    ]);

    return { data, total };
  }

  async getPushStats(tenantId: string): Promise<{
    totalSent: number;
    totalDelivered: number;
    totalFailed: number;
    deliveryRate: number;
    last24Hours: { sent: number; delivered: number; failed: number };
    last7Days: { sent: number; delivered: number; failed: number };
  }> {
    const now = new Date();
    const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const lastWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    const [totalStats, last24hStats, last7dStats] = await Promise.all([
      this.prisma.pushNotificationLog.aggregate({
        where: { tenantId },
        _sum: {
          totalRecipients: true,
          successCount: true,
          failureCount: true,
        },
      }),
      this.prisma.pushNotificationLog.aggregate({
        where: { tenantId, createdAt: { gte: yesterday } },
        _sum: {
          totalRecipients: true,
          successCount: true,
          failureCount: true,
        },
      }),
      this.prisma.pushNotificationLog.aggregate({
        where: { tenantId, createdAt: { gte: lastWeek } },
        _sum: {
          totalRecipients: true,
          successCount: true,
          failureCount: true,
        },
      }),
    ]);

    const totalSent = totalStats._sum.totalRecipients || 0;
    const totalDelivered = totalStats._sum.successCount || 0;
    const totalFailed = totalStats._sum.failureCount || 0;
    const deliveryRate = totalSent > 0 ? (totalDelivered / totalSent) * 100 : 0;

    return {
      totalSent,
      totalDelivered,
      totalFailed,
      deliveryRate: Math.round(deliveryRate * 100) / 100,
      last24Hours: {
        sent: last24hStats._sum.totalRecipients || 0,
        delivered: last24hStats._sum.successCount || 0,
        failed: last24hStats._sum.failureCount || 0,
      },
      last7Days: {
        sent: last7dStats._sum.totalRecipients || 0,
        delivered: last7dStats._sum.successCount || 0,
        failed: last7dStats._sum.failureCount || 0,
      },
    };
  }

  // ==================== AUTO-TRIGGER EVENTS ====================

  async sendNewEpisodeNotification(
    tenantId: string,
    podcastId: string,
    episodeTitle: string,
    episodeId: string,
  ): Promise<void> {
    // Get followers of the podcast who have newEpisodes enabled
    const followers = await this.prisma.follow.findMany({
      where: {
        tenantId,
        podcastId,
        user: {
          pushSettings: {
            enablePush: true,
            newEpisodes: true,
          },
        },
      },
      select: { userId: true },
    });

    if (followers.length === 0) return;

    const podcast = await this.prisma.podcast.findUnique({
      where: { id: podcastId },
      select: { title: true },
    });

    await this.sendPush(tenantId, {
      title: `Yeni Bölüm: ${podcast?.title || 'Podcast'}`,
      body: episodeTitle,
      data: {
        type: 'NEW_EPISODE',
        episodeId,
        podcastId,
      },
      targetType: PushTargetType.USER_IDS,
      userIds: followers.map(f => f.userId),
    });
  }

  async sendCommentNotification(
    tenantId: string,
    authorId: string,
    commenterName: string,
    episodeId: string,
  ): Promise<void> {
    // Check if author has comments enabled
    const settings = await this.prisma.userPushSettings.findUnique({
      where: { userId: authorId },
    });

    if (!settings?.enablePush || !settings?.comments) return;

    await this.sendPush(tenantId, {
      title: 'Yeni Yorum',
      body: `${commenterName} bölümünüze yorum yaptı`,
      data: {
        type: 'NEW_COMMENT',
        episodeId,
      },
      targetType: PushTargetType.USER_IDS,
      userIds: [authorId],
    });
  }

  async sendFollowNotification(
    tenantId: string,
    followedUserId: string,
    followerName: string,
    followerId: string,
  ): Promise<void> {
    const settings = await this.prisma.userPushSettings.findUnique({
      where: { userId: followedUserId },
    });

    if (!settings?.enablePush || !settings?.follows) return;

    await this.sendPush(tenantId, {
      title: 'Yeni Takipçi',
      body: `${followerName} sizi takip etmeye başladı`,
      data: {
        type: 'NEW_FOLLOWER',
        followerId,
      },
      targetType: PushTargetType.USER_IDS,
      userIds: [followedUserId],
    });
  }
}
