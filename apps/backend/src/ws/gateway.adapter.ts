import { IoAdapter } from '@nestjs/platform-socket.io';
import { INestApplication } from '@nestjs/common';

export class GatewayAdapter extends IoAdapter {
  constructor(app: INestApplication) {
    super(app);
  }
}
