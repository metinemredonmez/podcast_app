import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { JwtPayload } from '../../modules/auth/interfaces/jwt-payload.interface';

@Injectable()
export class WsAuthGuard implements CanActivate {
  constructor(private readonly configService: ConfigService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const client = context.switchToWs().getClient();
    const token = this.extractToken(client?.handshake?.headers?.authorization ?? '');
    if (!token) {
      return false;
    }

    try {
      const secret = this.configService.get<string>('jwt.accessSecret');
      if (!secret) {
        return false;
      }
      const jwt = new JwtService({ secret });
      const payload = await jwt.verifyAsync<JwtPayload>(token, { secret });
      client.data = client.data ?? {};
      client.data.user = payload;
      return true;
    } catch {
      return false;
    }
  }

  private extractToken(header: string): string | null {
    if (!header) {
      return null;
    }
    const [type, value] = header.split(' ');
    if (type?.toLowerCase() !== 'bearer' || !value) {
      return null;
    }
    return value;
  }
}
