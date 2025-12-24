import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export const TenantId = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): string => {
    const request = ctx.switchToHttp().getRequest();
    // Get tenant ID from header, query, or use default
    const tenantId =
      request.headers['x-tenant-id'] ||
      request.query?.tenantId ||
      request.body?.tenantId ||
      '1b68c1de-15de-4889-95aa-7ab6b3093111'; // Default tenant
    return tenantId;
  },
);
