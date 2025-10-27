import { Injectable } from '@nestjs/common';

@Injectable()
export class ElasticsearchService {
  ping(): string {
    return 'Elasticsearch ok';
  }
}
