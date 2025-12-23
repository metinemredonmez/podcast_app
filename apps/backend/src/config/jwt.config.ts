import { registerAs } from '@nestjs/config';

export default registerAs('jwt', () => {
  const accessSecret = process.env.JWT_ACCESS_SECRET;
  const refreshSecret = process.env.JWT_REFRESH_SECRET;

  if (!accessSecret || accessSecret.length < 32) {
    throw new Error(
      'JWT_ACCESS_SECRET must be set and at least 32 characters long. ' +
        'Generate one with: node -e "console.log(require(\'crypto\').randomBytes(64).toString(\'hex\'))"',
    );
  }

  if (!refreshSecret || refreshSecret.length < 32) {
    throw new Error(
      'JWT_REFRESH_SECRET must be set and at least 32 characters long. ' +
        'Generate one with: node -e "console.log(require(\'crypto\').randomBytes(64).toString(\'hex\'))"',
    );
  }

  return {
    accessTokenTtl: process.env.JWT_ACCESS_TTL ?? '15m',
    refreshTokenTtl: process.env.JWT_REFRESH_TTL ?? '7d',
    accessSecret,
    refreshSecret,
  };
});
