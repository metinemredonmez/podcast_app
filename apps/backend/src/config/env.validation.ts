import { z } from 'zod';

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().positive().default(3300),

  // Database
  DATABASE_URL: z.string().url(),
  TEST_DATABASE_URL: z.string().url().optional(),

  // Redis
  REDIS_URL: z.string().url(),

  // JWT
  JWT_ACCESS_SECRET: z.string().min(32),
  JWT_REFRESH_SECRET: z.string().min(32),
  JWT_ACCESS_TTL: z.string().default('15m'),
  JWT_REFRESH_TTL: z.string().default('7d'),

  // Security
  BCRYPT_SALT_ROUNDS: z.coerce.number().int().min(10).max(15).default(12),

  // CORS
  CORS_ORIGINS: z.string(),

  // S3/MinIO
  S3_ENDPOINT: z.string().url(),
  S3_ACCESS_KEY: z.string().min(3),
  S3_SECRET_KEY: z.string().min(8),
  S3_BUCKET: z.string().min(3),

  // Elasticsearch (optional)
  ELASTICSEARCH_NODE: z.string().url().optional(),

  // Admin Setup
  ADMIN_TENANT_NAME: z.string().min(1),
  ADMIN_TENANT_SLUG: z.string().min(1),
  ADMIN_EMAIL: z.string().email(),
  ADMIN_NAME: z.string().min(1),
  ADMIN_PASSWORD: z.string().min(8),
  ADMIN_PASSWORD_SALT_ROUNDS: z.coerce.number().int().min(10).max(15).default(12),

  // Application
  SWAGGER_ENABLED: z.coerce.boolean().default(true),
  LOG_LEVEL: z.enum(['debug', 'info', 'warn', 'error']).default('info'),
});

export type EnvConfig = z.infer<typeof envSchema>;

export function validateEnv(): EnvConfig {
  try {
    const parsed = envSchema.parse(process.env);
    return parsed;
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error('❌ Environment validation failed:');
      console.error(JSON.stringify(error.errors, null, 2));
      process.exit(1);
    }
    throw error;
  }
}

export const env = validateEnv();
