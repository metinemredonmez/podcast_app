import { registerAs } from '@nestjs/config';

export default registerAs('metrics', () => ({
  enabled: process.env.METRICS_ENABLED !== 'false',
  defaultLabels: {
    app: 'podcast-backend',
  },
}));
