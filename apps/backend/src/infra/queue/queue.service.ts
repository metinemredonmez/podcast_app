import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Queue, Worker, Job, QueueEvents } from 'bullmq';
import { Redis } from 'ioredis';

// Queue names
export const QUEUE_NAMES = {
  EMAIL: 'email',
  NOTIFICATION: 'notification',
  ANALYTICS: 'analytics',
  AUDIO_PROCESSING: 'audio-processing',
} as const;

export type QueueName = (typeof QUEUE_NAMES)[keyof typeof QUEUE_NAMES];

// Job types
export interface EmailJob {
  type: 'welcome' | 'password-reset' | 'email-verification' | 'notification';
  to: string;
  subject: string;
  template: string;
  data: Record<string, unknown>;
}

export interface NotificationJob {
  type: 'push' | 'in-app' | 'both';
  userId: string;
  tenantId: string;
  title: string;
  body: string;
  data?: Record<string, unknown>;
}

export interface AnalyticsJob {
  type: 'track-event' | 'aggregate-daily' | 'update-stats';
  tenantId: string;
  data: Record<string, unknown>;
}

export interface AudioProcessingJob {
  type: 'transcode' | 'generate-waveform' | 'extract-metadata';
  episodeId: string;
  tenantId: string;
  sourceUrl: string;
}

type JobData = EmailJob | NotificationJob | AnalyticsJob | AudioProcessingJob;

@Injectable()
export class QueueService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(QueueService.name);
  private connection: Redis | null = null;
  private queues: Map<QueueName, Queue> = new Map();
  private workers: Map<QueueName, Worker> = new Map();
  private queueEvents: Map<QueueName, QueueEvents> = new Map();
  private isEnabled = false;

  constructor(private readonly configService: ConfigService) {}

  async onModuleInit(): Promise<void> {
    const redisUrl = this.configService.get<string>('REDIS_URL');
    if (!redisUrl) {
      this.logger.warn('REDIS_URL not configured - Queue service disabled');
      return;
    }

    try {
      this.connection = new Redis(redisUrl, {
        maxRetriesPerRequest: null, // Required for BullMQ
        enableReadyCheck: false,
      });

      // Initialize queues
      for (const queueName of Object.values(QUEUE_NAMES)) {
        await this.initializeQueue(queueName);
      }

      this.isEnabled = true;
      this.logger.log('Queue service initialized successfully');
    } catch (error) {
      this.logger.error('Failed to initialize queue service', error);
    }
  }

  async onModuleDestroy(): Promise<void> {
    // Close all workers first
    for (const [name, worker] of this.workers) {
      try {
        await worker.close();
        this.logger.debug(`Worker ${name} closed`);
      } catch (error) {
        this.logger.error(`Error closing worker ${name}`, error);
      }
    }

    // Close queue events
    for (const [name, events] of this.queueEvents) {
      try {
        await events.close();
        this.logger.debug(`QueueEvents ${name} closed`);
      } catch (error) {
        this.logger.error(`Error closing queue events ${name}`, error);
      }
    }

    // Close queues
    for (const [name, queue] of this.queues) {
      try {
        await queue.close();
        this.logger.debug(`Queue ${name} closed`);
      } catch (error) {
        this.logger.error(`Error closing queue ${name}`, error);
      }
    }

    // Close Redis connection
    if (this.connection) {
      await this.connection.quit();
      this.logger.log('Queue service shut down gracefully');
    }
  }

  private async initializeQueue(queueName: QueueName): Promise<void> {
    if (!this.connection) return;

    const prefix = this.configService.get<string>('queue.prefix', 'podcast-app');

    const queue = new Queue(queueName, {
      connection: this.connection,
      prefix,
      defaultJobOptions: {
        attempts: this.configService.get<number>('queue.retryAttempts', 3),
        backoff: {
          type: 'exponential',
          delay: 1000,
        },
        removeOnComplete: {
          age: 24 * 60 * 60, // Keep completed jobs for 24 hours
          count: 1000, // Keep last 1000 completed jobs
        },
        removeOnFail: {
          age: 7 * 24 * 60 * 60, // Keep failed jobs for 7 days
        },
      },
    });

    this.queues.set(queueName, queue);

    // Initialize queue events for monitoring
    const queueEvents = new QueueEvents(queueName, {
      connection: this.connection,
      prefix,
    });
    this.queueEvents.set(queueName, queueEvents);

    this.logger.debug(`Queue ${queueName} initialized`);
  }

  /**
   * Add a job to the specified queue
   */
  async addJob<T extends JobData>(
    queueName: QueueName,
    jobData: T,
    options?: {
      priority?: number;
      delay?: number;
      jobId?: string;
    },
  ): Promise<Job<T> | null> {
    if (!this.isEnabled) {
      this.logger.warn(`Queue service disabled - job not added to ${queueName}`);
      return null;
    }

    const queue = this.queues.get(queueName);
    if (!queue) {
      this.logger.error(`Queue ${queueName} not found`);
      return null;
    }

    const job = await queue.add(jobData.type, jobData, {
      priority: options?.priority,
      delay: options?.delay,
      jobId: options?.jobId,
    });

    this.logger.debug(`Job ${job.id} added to queue ${queueName}`);
    return job as Job<T>;
  }

  /**
   * Register a worker to process jobs from a queue
   */
  registerWorker<T extends JobData>(
    queueName: QueueName,
    processor: (job: Job<T>) => Promise<void>,
  ): void {
    if (!this.connection) {
      this.logger.warn(`Cannot register worker - connection not available`);
      return;
    }

    const prefix = this.configService.get<string>('queue.prefix', 'podcast-app');

    const worker = new Worker<T>(
      queueName,
      async (job) => {
        this.logger.debug(`Processing job ${job.id} from queue ${queueName}`);
        try {
          await processor(job);
          this.logger.debug(`Job ${job.id} completed successfully`);
        } catch (error) {
          this.logger.error(`Job ${job.id} failed`, error);
          throw error;
        }
      },
      {
        connection: this.connection,
        prefix,
        concurrency: 5,
      },
    );

    worker.on('failed', (job, error) => {
      this.logger.error(`Job ${job?.id} in queue ${queueName} failed: ${error.message}`);
    });

    worker.on('completed', (job) => {
      this.logger.debug(`Job ${job.id} in queue ${queueName} completed`);
    });

    this.workers.set(queueName, worker);
    this.logger.log(`Worker registered for queue ${queueName}`);
  }

  /**
   * Get queue statistics
   */
  async getQueueStats(queueName: QueueName): Promise<{
    waiting: number;
    active: number;
    completed: number;
    failed: number;
    delayed: number;
  } | null> {
    const queue = this.queues.get(queueName);
    if (!queue) return null;

    const [waiting, active, completed, failed, delayed] = await Promise.all([
      queue.getWaitingCount(),
      queue.getActiveCount(),
      queue.getCompletedCount(),
      queue.getFailedCount(),
      queue.getDelayedCount(),
    ]);

    return { waiting, active, completed, failed, delayed };
  }

  /**
   * Health check
   */
  async healthCheck(): Promise<{ healthy: boolean; queues: Record<string, boolean> }> {
    const result: Record<string, boolean> = {};

    for (const [name, queue] of this.queues) {
      try {
        await queue.getWaitingCount();
        result[name] = true;
      } catch {
        result[name] = false;
      }
    }

    return {
      healthy: Object.values(result).every((v) => v),
      queues: result,
    };
  }

  // Convenience methods for specific queues
  async sendEmail(job: EmailJob, options?: { delay?: number }): Promise<Job<EmailJob> | null> {
    return this.addJob(QUEUE_NAMES.EMAIL, job, options);
  }

  async sendNotification(job: NotificationJob): Promise<Job<NotificationJob> | null> {
    return this.addJob(QUEUE_NAMES.NOTIFICATION, job);
  }

  async trackAnalytics(job: AnalyticsJob): Promise<Job<AnalyticsJob> | null> {
    return this.addJob(QUEUE_NAMES.ANALYTICS, job, { priority: 10 }); // Lower priority
  }

  async processAudio(job: AudioProcessingJob): Promise<Job<AudioProcessingJob> | null> {
    return this.addJob(QUEUE_NAMES.AUDIO_PROCESSING, job);
  }

  /**
   * Legacy ping method for backward compatibility
   */
  ping(): string {
    return this.isEnabled ? 'Queue ok' : 'Queue disabled';
  }
}
