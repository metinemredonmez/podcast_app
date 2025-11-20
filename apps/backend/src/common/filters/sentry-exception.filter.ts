import { ArgumentsHost, Catch, ExceptionFilter, HttpException, HttpStatus } from '@nestjs/common';
import { Response } from 'express';
import * as Sentry from '@sentry/node';
import { AppLoggerService } from '../logger/logger.service';

@Catch()
export class SentryExceptionFilter implements ExceptionFilter {
  constructor(private readonly logger: AppLoggerService) {}

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'Internal server error';
    let error = 'Internal Server Error';

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const exceptionResponse = exception.getResponse();

      if (typeof exceptionResponse === 'string') {
        message = exceptionResponse;
      } else if (typeof exceptionResponse === 'object') {
        const response = exceptionResponse as any;
        message = response.message || exception.message;
        error = response.error || error;
      }
    } else if (exception instanceof Error) {
      message = exception.message;
    }

    // Log error with Winston
    this.logger.error(
      `HTTP Exception: ${request.method} ${request.url}`,
      exception instanceof Error ? exception.stack : undefined,
      'ExceptionFilter',
      {
        statusCode: status,
        path: request.url,
        method: request.method,
        userId: request.user?.userId,
        ip: request.ip,
        userAgent: request.headers['user-agent'],
      },
    );

    // Send to Sentry if it's a server error (5xx)
    if (status >= 500) {
      Sentry.withScope((scope) => {
        scope.setUser({
          id: request.user?.userId,
          email: request.user?.email,
        });
        scope.setContext('request', {
          method: request.method,
          url: request.url,
          headers: request.headers,
          query: request.query,
          params: request.params,
        });
        scope.setTag('path', request.url);
        scope.setTag('method', request.method);

        if (exception instanceof Error) {
          Sentry.captureException(exception);
        } else {
          Sentry.captureMessage(`Unknown error: ${message}`, 'error');
        }
      });
    }

    // Send response
    response.status(status).json({
      statusCode: status,
      message,
      error,
      timestamp: new Date().toISOString(),
      path: request.url,
    });
  }
}
