import { Injectable, Inject, LoggerService as NestLoggerService } from '@nestjs/common';
import { Logger } from 'winston';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';

@Injectable()
export class AppLoggerService implements NestLoggerService {
  constructor(@Inject(WINSTON_MODULE_PROVIDER) private readonly logger: Logger) {}

  /**
   * Log an info message
   */
  log(message: string, context?: string, metadata?: Record<string, any>) {
    this.logger.info(message, { context, ...metadata });
  }

  /**
   * Log an error message
   */
  error(message: string, trace?: string, context?: string, metadata?: Record<string, any>) {
    this.logger.error(message, { context, trace, ...metadata });
  }

  /**
   * Log a warning message
   */
  warn(message: string, context?: string, metadata?: Record<string, any>) {
    this.logger.warn(message, { context, ...metadata });
  }

  /**
   * Log a debug message
   */
  debug(message: string, context?: string, metadata?: Record<string, any>) {
    this.logger.debug(message, { context, ...metadata });
  }

  /**
   * Log a verbose message
   */
  verbose(message: string, context?: string, metadata?: Record<string, any>) {
    this.logger.verbose(message, { context, ...metadata });
  }

  /**
   * Log HTTP request
   */
  logRequest(method: string, url: string, statusCode: number, duration: number, metadata?: Record<string, any>) {
    this.logger.info('HTTP Request', {
      context: 'HTTP',
      method,
      url,
      statusCode,
      duration: `${duration}ms`,
      ...metadata,
    });
  }

  /**
   * Log database query
   */
  logQuery(query: string, duration: number, metadata?: Record<string, any>) {
    this.logger.debug('Database Query', {
      context: 'Database',
      query,
      duration: `${duration}ms`,
      ...metadata,
    });
  }

  /**
   * Log authentication event
   */
  logAuth(event: string, userId?: string, email?: string, metadata?: Record<string, any>) {
    this.logger.info('Authentication Event', {
      context: 'Auth',
      event,
      userId,
      email,
      ...metadata,
    });
  }

  /**
   * Log business metric
   */
  logMetric(metric: string, value: number | string, metadata?: Record<string, any>) {
    this.logger.info('Business Metric', {
      context: 'Metrics',
      metric,
      value,
      ...metadata,
    });
  }
}
