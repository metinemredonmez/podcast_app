import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { AppLoggerService } from '../logger/logger.service';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  constructor(private readonly logger: AppLoggerService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const { method, url, ip, headers } = request;
    const userAgent = headers['user-agent'] || 'Unknown';
    const startTime = Date.now();

    return next.handle().pipe(
      tap({
        next: () => {
          const response = context.switchToHttp().getResponse();
          const { statusCode } = response;
          const duration = Date.now() - startTime;

          // Log successful requests
          this.logger.logRequest(method, url, statusCode, duration, {
            ip,
            userAgent,
            userId: request.user?.userId,
          });
        },
        error: (error) => {
          const duration = Date.now() - startTime;
          const statusCode = error.status || 500;

          // Log failed requests
          this.logger.error(
            `HTTP Request Failed: ${method} ${url}`,
            error.stack,
            'HTTP',
            {
              method,
              url,
              statusCode,
              duration: `${duration}ms`,
              ip,
              userAgent,
              userId: request.user?.userId,
              errorMessage: error.message,
            },
          );
        },
      }),
    );
  }
}
