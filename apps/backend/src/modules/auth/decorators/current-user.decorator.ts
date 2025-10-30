import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { JwtPayload, RefreshPayload } from '../interfaces/jwt-payload.interface';

export const CurrentUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): JwtPayload & Partial<RefreshPayload> => {
    const request = ctx.switchToHttp().getRequest();
    return request.user as JwtPayload & Partial<RefreshPayload>;
  },
);
