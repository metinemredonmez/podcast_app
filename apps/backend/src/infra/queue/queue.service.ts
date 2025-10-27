import { Injectable } from '@nestjs/common';

@Injectable()
export class QueueService {
  ping(): string {
    return 'Queue ok';
  }
}
