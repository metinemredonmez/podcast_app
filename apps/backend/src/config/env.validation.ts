import { z } from 'zod';

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().positive().default(3300),
  DATABASE_URL: z.string().url(),
  TEST_DATABASE_URL: z.string().url().optional(),
  REDIS_URL: z.string().url(),
  JWT_ACCESS_SECRET: z.string().min(32),
  JWT_REFRESH_SECRET: z.string().min(32),
  JWT_ACCESS_TTL: z.string().default('15m'),
  JWT_REFRESH_TTL: z.string().default('7d'),
  BCRYPT_SALT_ROUNDS: z.coerce.number().int().min(10).max(15).default(12),
  CORS_ORIGINS: z.string(),
  S3_ENDPOINT: z.string().url(),
  S3_ACCESS_KEY: z.string().min(3),
  S3_SECRET_KEY: z.string().min(8),
  S3_BUCKET: z.string().min(3),
  ELASTICSEARCH_NODE: z.string().url().optional(),
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

export function validateEnv(): EnvConfig {
  try {
    return envSchema.parse(process.env);
  } catch (error) {
    console.error('❌ Environment validation failed:');
    if (error instanceof z.ZodError) {
      console.error(JSON.stringify(error.errors, null, 2));
    }
    process.exit(1);
  }
}

export const env = validateEnv();
