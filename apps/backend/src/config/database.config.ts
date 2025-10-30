import { registerAs } from '@nestjs/config';

export default registerAs('database', () => ({
  url:
    process.env.DATABASE_URL ??
    'postgresql://postgres:postgres@postgres:5432/podcast_app?schema=public',
  logging: process.env.DB_LOGGING === 'true',
}));
