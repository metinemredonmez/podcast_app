import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';

@Injectable()
export class WsAuthGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const client = context.switchToWs().getClient();
    return Boolean(client?.handshake?.headers?.authorization);
  }
}
