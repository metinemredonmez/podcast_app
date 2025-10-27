import { registerAs } from '@nestjs/config';

export default registerAs('queue', () => ({
  prefix: 'podcast-app',
  retryAttempts: Number(process.env.QUEUE_RETRY_ATTEMPTS ?? 3),
}));
