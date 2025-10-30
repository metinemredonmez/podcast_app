import { plainToInstance } from 'class-transformer';
import { IsBoolean, IsEnum, IsNotEmpty, IsNumber, IsOptional, IsString, IsUrl, IsUUID, Min, validateSync } from 'class-validator';

class EnvironmentVariables {
  @IsString()
  NODE_ENV!: string;

  @IsNumber()
  @Min(0)
  PORT!: number;

  @IsString()
  @IsNotEmpty()
  DATABASE_URL!: string;

  @IsString()
  @IsNotEmpty()
  REDIS_URL!: string;

  @IsString()
  @IsNotEmpty()
  JWT_ACCESS_SECRET!: string;

  @IsString()
  @IsNotEmpty()
  JWT_REFRESH_SECRET!: string;

  @IsString()
  @IsNotEmpty()
  JWT_ACCESS_TTL!: string;

  @IsString()
  @IsNotEmpty()
  JWT_REFRESH_TTL!: string;

  @IsNumber()
  @Min(4)
  BCRYPT_SALT_ROUNDS!: number;

  @IsString()
  CORS_ORIGINS!: string;

  @IsString()
  @IsNotEmpty()
  S3_ENDPOINT!: string;

  @IsString()
  @IsNotEmpty()
  S3_ACCESS_KEY!: string;

  @IsString()
  @IsNotEmpty()
  S3_SECRET_KEY!: string;

  @IsString()
  @IsNotEmpty()
  ELASTICSEARCH_NODE!: string;

  @IsString()
  @IsNotEmpty()
  ADMIN_TENANT_NAME!: string;

  @IsString()
  @IsNotEmpty()
  ADMIN_TENANT_SLUG!: string;

  @IsString()
  @IsNotEmpty()
  ADMIN_EMAIL!: string;

  @IsOptional()
  @IsString()
  ADMIN_PASSWORD?: string;

  @IsOptional()
  @IsString()
  ADMIN_PASSWORD_HASH?: string;

  @IsNumber()
  @Min(4)
  ADMIN_PASSWORD_SALT_ROUNDS!: number;
}

export const validateEnvironment = (config: Record<string, unknown>) => {
  const validatedConfig = plainToInstance(EnvironmentVariables, config, {
    enableImplicitConversion: true,
  });

  const errors = validateSync(validatedConfig, {
    skipMissingProperties: false,
    forbidUnknownValues: true,
  });

  if (errors.length > 0) {
    throw new Error(errors.toString());
  }
  return validatedConfig;
};
