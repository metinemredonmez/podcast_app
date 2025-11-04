import { z } from 'zod';

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().positive().default(3300),
  DATABASE_URL: z.string().url(),
  TEST_DATABASE_URL: z.string().url().optional(),
  REDIS_URL: z.string().url(),
  KAFKA_BROKER: z.string().optional().default('localhost:9092'),
  JWT_ACCESS_SECRET: z.string().min(32),
  JWT_REFRESH_SECRET: z.string().min(32),
  JWT_ACCESS_TTL: z.string().default('15m'),
  JWT_REFRESH_TTL: z.string().default('7d'),
  BCRYPT_SALT_ROUNDS: z.coerce.number().int().min(10).max(15).default(12),
  CORS_ORIGINS: z.string(),
  QUEUE_RETRY_ATTEMPTS: z.coerce.number().int().min(0).max(10).default(3),
  S3_ENDPOINT: z
    .string()
    .url()
    .optional()
    .default('http://localhost:9000'),
  S3_ACCESS_KEY: z.string().min(3).optional().default('local'),
  S3_SECRET_KEY: z.string().min(8).optional().default('local'),
  S3_BUCKET: z.string().min(3).optional().default('podcast-app'),
  ELASTICSEARCH_NODE: z.string().url().optional(),
  ELASTICSEARCH_USERNAME: z.string().min(1).optional(),
  ELASTICSEARCH_PASSWORD: z.string().min(1).optional(),
  ADMIN_TENANT_NAME: z.string().min(1),
  ADMIN_TENANT_SLUG: z.string().min(1),
  ADMIN_EMAIL: z.string().email(),
  ADMIN_NAME: z.string().min(1),
  ADMIN_PASSWORD: z.string().min(8),
  ADMIN_PASSWORD_SALT_ROUNDS: z.coerce.number().int().min(10).max(15).default(12),
  SWAGGER_ENABLED: z.coerce.boolean().default(true),
  LOG_LEVEL: z.enum(['debug', 'info', 'warn', 'error']).default('info'),
});

export type EnvConfig = z.infer<typeof envSchema>;

export function validateEnv(config: Record<string, unknown> = process.env): EnvConfig {
  const parsed = envSchema.safeParse(config);
  if (!parsed.success) {
    const formatted = parsed.error.format();
    throw new Error(`Environment validation failed: ${JSON.stringify(formatted)}`);
  }
  return parsed.data;
}
