import { Module } from '@nestjs/common';
import { makeCounterProvider, makeHistogramProvider, makeGaugeProvider } from '@willsoto/nestjs-prometheus';
import { MetricsService } from './metrics.service';

@Module({
  providers: [
    // HTTP metrics
    makeCounterProvider({
      name: 'http_requests_total',
      help: 'Total number of HTTP requests',
      labelNames: ['method', 'route', 'status_code'],
    }),
    makeHistogramProvider({
      name: 'http_request_duration_seconds',
      help: 'HTTP request duration in seconds',
      labelNames: ['method', 'route'],
      buckets: [0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5, 10],
    }),

    // User metrics
    makeGaugeProvider({
      name: 'active_users_total',
      help: 'Total number of active users',
    }),
    makeCounterProvider({
      name: 'user_registrations_total',
      help: 'Total number of user registrations',
    }),

    // Auth metrics
    makeCounterProvider({
      name: 'auth_attempts_total',
      help: 'Total number of authentication attempts',
      labelNames: ['type', 'success'],
    }),

    // Content metrics
    makeCounterProvider({
      name: 'podcast_plays_total',
      help: 'Total number of podcast plays',
      labelNames: ['podcast_id'],
    }),
    makeCounterProvider({
      name: 'episode_plays_total',
      help: 'Total number of episode plays',
      labelNames: ['episode_id'],
    }),

    MetricsService,
  ],
  exports: [MetricsService],
})
export class MetricsModule {}
