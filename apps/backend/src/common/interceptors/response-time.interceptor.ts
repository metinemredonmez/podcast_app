import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import { Observable, tap } from 'rxjs';

@Injectable()
export class ResponseTimeInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const startedAt = Date.now();
    const http = context.switchToHttp();
    const res = http.getResponse();
    return next.handle().pipe(
      tap(() => {
        const durationMs = Date.now() - startedAt;
        if (res && typeof res.setHeader === 'function') {
          res.setHeader('X-Response-Time', `${durationMs}ms`);
        }
      }),
    );
  }
}


