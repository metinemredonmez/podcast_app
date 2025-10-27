import { Injectable } from '@nestjs/common';

@Injectable()
export class MetricsService {
  ping(): string {
    return 'Metrics ok';
  }
}
