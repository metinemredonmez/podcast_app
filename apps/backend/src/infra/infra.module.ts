import { Global, Module } from '@nestjs/common';
import { RedisModule } from './redis/redis.module';
import { QueueModule } from './queue/queue.module';
import { LoggerModule } from './logger/logger.module';
import { MetricsModule } from './metrics/metrics.module';
import { ElasticsearchModule } from './elasticsearch/elasticsearch.module';
import { S3Module } from './s3/s3.module';

@Global()
@Module({
  imports: [RedisModule, QueueModule, LoggerModule, MetricsModule, ElasticsearchModule, S3Module],
  exports: [RedisModule, QueueModule, LoggerModule, MetricsModule, ElasticsearchModule, S3Module],
})
export class InfraModule {}
