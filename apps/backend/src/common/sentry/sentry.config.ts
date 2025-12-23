import * as Sentry from '@sentry/node';
import { Logger } from '@nestjs/common';

// Note: @sentry/profiling-node disabled due to missing native binaries for Node.js v25
// Re-enable when Sentry releases compatible binaries
// import { nodeProfilingIntegration } from '@sentry/profiling-node';

const logger = new Logger('Sentry');

export function initSentry() {
  const sentryDsn = process.env.SENTRY_DSN;

  // Only initialize if DSN is provided
  if (!sentryDsn) {
    logger.log('Sentry DSN not provided, skipping initialization');
    return;
  }

  Sentry.init({
    dsn: sentryDsn,
    environment: process.env.NODE_ENV || 'development',
    release: process.env.APP_VERSION || '1.0.0',

    // Performance Monitoring
    tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,

    // Profiling disabled - native binaries not available for Node.js v25
    // profilesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,

    integrations: [
      // Profiling disabled for Node.js v25 compatibility
      // nodeProfilingIntegration(),

      // Auto-instrumentation for common libraries
      Sentry.httpIntegration(),
      Sentry.nativeNodeFetchIntegration(),
      Sentry.graphqlIntegration(),
      Sentry.mongoIntegration(),
      Sentry.mongooseIntegration(),
      Sentry.postgresIntegration(),
      Sentry.prismaIntegration(),
      Sentry.redisIntegration(),
    ],

    // Don't send errors in development unless explicitly enabled
    enabled: process.env.NODE_ENV === 'production' || process.env.SENTRY_ENABLED === 'true',

    // Filter out sensitive data
    beforeSend(event, hint) {
      // Remove passwords from event data
      if (event.request?.data) {
        const data = event.request.data as any;
        if (data.password) data.password = '[REDACTED]';
        if (data.passwordHash) data.passwordHash = '[REDACTED]';
        if (data.newPassword) data.newPassword = '[REDACTED]';
        if (data.oldPassword) data.oldPassword = '[REDACTED]';
        if (data.refreshToken) data.refreshToken = '[REDACTED]';
        if (data.accessToken) data.accessToken = '[REDACTED]';
      }

      // Filter out validation errors (400 status)
      const error = hint.originalException as any;
      if (error?.status === 400) {
        return null; // Don't send to Sentry
      }

      return event;
    },

    // Ignore common errors
    ignoreErrors: [
      'UnauthorizedException',
      'ForbiddenException',
      'BadRequestException',
      'NotFoundException',
      'ConflictException',
      'ValidationError',
    ],
  });

  logger.log('Sentry initialized successfully');
}
