import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { MetricsService } from '../metrics/metrics.service';

@Injectable()
export class MetricsInterceptor implements NestInterceptor {
  constructor(private readonly metricsService: MetricsService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const request = context.switchToHttp().getRequest();
    const { method, url } = request;
    const startTime = Date.now();

    // Extract route pattern (remove query params and IDs)
    const route = this.extractRoute(url);

    return next.handle().pipe(
      tap({
        next: () => {
          const response = context.switchToHttp().getResponse();
          const { statusCode } = response;
          const duration = (Date.now() - startTime) / 1000; // Convert to seconds

          // Record metrics
          this.metricsService.incrementHttpRequests(method, route, statusCode);
          this.metricsService.recordHttpDuration(method, route, duration);
        },
        error: (error) => {
          const statusCode = error.status || 500;
          const duration = (Date.now() - startTime) / 1000;

          // Record error metrics
          this.metricsService.incrementHttpRequests(method, route, statusCode);
          this.metricsService.recordHttpDuration(method, route, duration);
        },
      }),
    );
  }

  /**
   * Extract route pattern from URL (replace UUIDs and IDs with placeholders)
   */
  private extractRoute(url: string): string {
    return url
      .split('?')[0] // Remove query params
      .replace(/\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/gi, '/:id') // Replace UUIDs
      .replace(/\/\d+/g, '/:id'); // Replace numeric IDs
  }
}
