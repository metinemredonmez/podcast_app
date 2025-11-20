import { Module } from '@nestjs/common';
import { WinstonModule } from 'nest-winston';
import { AppLoggerService } from './logger.service';
import { loggerConfig } from './logger.config';

@Module({
  imports: [WinstonModule.forRoot(loggerConfig)],
  providers: [AppLoggerService],
  exports: [AppLoggerService],
})
export class LoggerModule {}
