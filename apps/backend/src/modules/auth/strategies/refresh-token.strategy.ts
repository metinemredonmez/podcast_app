import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { RefreshPayload, enrichJwtPayload } from '../interfaces/jwt-payload.interface';

@Injectable()
export class RefreshTokenStrategy extends PassportStrategy(Strategy, 'jwt-refresh') {
  constructor(configService: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('jwt.refreshSecret'),
      passReqToCallback: true,
    });
  }

  validate(req: Record<string, unknown>, payload: Omit<RefreshPayload, 'userId'>): RefreshPayload {
    const extractor = ExtractJwt.fromAuthHeaderAsBearerToken();
    const token = extractor(req as any) ?? undefined;
    // Enrich payload with userId getter for backward compatibility
    const enriched = enrichJwtPayload(payload);
    return { ...enriched, refreshToken: token };
  }
}
