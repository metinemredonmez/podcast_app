import { registerAs } from '@nestjs/config';

export default registerAs('jwt', () => ({
  accessTokenTtl: process.env.JWT_ACCESS_TTL ?? '15m',
  refreshTokenTtl: process.env.JWT_REFRESH_TTL ?? '7d',
  accessSecret: process.env.JWT_ACCESS_SECRET ?? 'change-me',
  refreshSecret: process.env.JWT_REFRESH_SECRET ?? 'change-me-too',
}));
