import { Injectable } from '@nestjs/common';

@Injectable()
export class LoggerService {
  ping(): string {
    return 'Logger ok';
  }
}
