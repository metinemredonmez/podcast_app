import { Injectable } from '@nestjs/common';

@Injectable()
export class RedisService {
  ping(): string {
    return 'Redis ok';
  }
}
