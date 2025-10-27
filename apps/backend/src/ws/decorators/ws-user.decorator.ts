import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export const WsUser = createParamDecorator((_: unknown, ctx: ExecutionContext) => {
  const data = ctx.switchToWs().getData();
  return data?.user;
});
