import { registerAs } from '@nestjs/config';

export default registerAs('mail', () => ({
  sender: process.env.MAIL_SENDER ?? 'no-reply@podcast-app.local',
  provider: process.env.MAIL_PROVIDER ?? 'log',
}));
