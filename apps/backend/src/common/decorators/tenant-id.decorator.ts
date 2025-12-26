import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export const TenantId = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): string => {
    const request = ctx.switchToHttp().getRequest();
    // Get tenant ID from header, query, or use default
    const tenantId =
      request.headers['x-tenant-id'] ||
      request.query?.tenantId ||
      request.body?.tenantId ||
      'c2e65cb4-f34f-4b28-a99c-752345736adb'; // Default tenant
    return tenantId;
  },
);
