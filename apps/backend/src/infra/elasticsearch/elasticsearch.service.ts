import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class ElasticsearchService {
  private readonly logger = new Logger(ElasticsearchService.name);
  private readonly node?: string;
  private readonly authHeader?: string;

  constructor(private readonly config: ConfigService) {
    const node =
      this.config.get<string>('ELASTICSEARCH_NODE', { infer: true }) ?? process.env.ELASTICSEARCH_NODE;
    if (!node) {
      this.logger.warn('Elasticsearch node not configured; features depending on search stay disabled.');
    } else {
      this.node = node;
    }
    const username =
      this.config.get<string>('ELASTICSEARCH_USERNAME', { infer: true }) ??
      process.env.ELASTICSEARCH_USERNAME;
    const password =
      this.config.get<string>('ELASTICSEARCH_PASSWORD', { infer: true }) ??
      process.env.ELASTICSEARCH_PASSWORD;

    if (username && password) {
      this.authHeader = `Basic ${Buffer.from(`${username}:${password}`).toString('base64')}`;
    }
  }

  isEnabled(): boolean {
    return Boolean(this.node);
  }

  async search(indexes: string, body: Record<string, unknown>): Promise<any> {
    if (!this.node) {
      this.logger.warn('Attempted to execute Elasticsearch search without a configured node.');
      return { hits: { hits: [] } };
    }

    const url = `${this.node.replace(/\/$/, '')}/${indexes}/_search`;
    const fetchFn: typeof fetch | undefined = (globalThis as any).fetch;
    if (!fetchFn) {
      throw new Error('Fetch API is not available in this environment.');
    }

    const response = await fetchFn(url, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        ...(this.authHeader ? { authorization: this.authHeader } : {}),
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errorText = await response.text();
      this.logger.warn(`Elasticsearch request failed: ${response.status} ${errorText}`);
      throw new Error(`Elasticsearch request failed: ${response.status}`);
    }

    return response.json();
  }
}
