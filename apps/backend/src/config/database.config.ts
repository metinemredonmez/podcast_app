import { registerAs } from '@nestjs/config';

export default registerAs('database', () => ({
  url: process.env.DATABASE_URL ?? 'postgresql://postgres:postgres@localhost:5432/podcast_app',
  logging: process.env.DB_LOGGING === 'true',
}));
