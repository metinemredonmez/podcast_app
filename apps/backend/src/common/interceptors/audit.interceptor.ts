import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { AuditService } from '../../modules/audit/audit.service';

@Injectable()
export class AuditInterceptor implements NestInterceptor {
  constructor(private readonly auditService: AuditService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const { method, url, user, body, ip, headers } = request;

    // Only audit write operations (POST, PATCH, PUT, DELETE)
    if (!['POST', 'PATCH', 'PUT', 'DELETE'].includes(method)) {
      return next.handle();
    }

    // Skip audit logs endpoint itself to avoid infinite loop
    if (url.includes('/audit-logs')) {
      return next.handle();
    }

    // Determine action type
    let action = 'UNKNOWN';
    if (method === 'POST') action = 'CREATE';
    else if (method === 'PATCH' || method === 'PUT') action = 'UPDATE';
    else if (method === 'DELETE') action = 'DELETE';

    // Extract entity type from URL
    const urlParts = url.split('/').filter(Boolean);
    const entityType = urlParts[1] || 'Unknown'; // e.g., /api/podcasts -> podcasts
    const entityId = urlParts[2] || undefined; // e.g., /api/podcasts/123 -> 123

    return next.handle().pipe(
      tap({
        next: () => {
          // Only log if user is authenticated
          if (user && user.userId) {
            this.auditService.logAction(
              user.userId,
              action,
              entityType,
              entityId,
              body,
              ip,
              headers['user-agent'],
            );
          }
        },
      }),
    );
  }
}
