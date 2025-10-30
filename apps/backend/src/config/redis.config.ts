import { registerAs } from '@nestjs/config';

export default registerAs('redis', () => ({
  url: process.env.REDIS_URL ?? 'redis://redis:6379',
  keyPrefix: 'podcast-app',
}));
