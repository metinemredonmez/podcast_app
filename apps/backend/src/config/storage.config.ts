import { registerAs } from '@nestjs/config';

export default registerAs('storage', () => ({
  endpoint: process.env.S3_ENDPOINT ?? 'http://localhost:9000',
  accessKey: process.env.S3_ACCESS_KEY ?? 'local',
  secretKey: process.env.S3_SECRET_KEY ?? 'local',
  bucket: process.env.S3_BUCKET ?? 'podcast-app',
}));
