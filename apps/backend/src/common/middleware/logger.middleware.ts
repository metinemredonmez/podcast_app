import { Injectable, NestMiddleware } from '@nestjs/common';
import { Logger } from '@nestjs/common';
import { Request, Response } from 'express';

@Injectable()
export class LoggerMiddleware implements NestMiddleware {
  private readonly logger = new Logger(LoggerMiddleware.name);

  use(req: Request, _: Response, next: () => void): void {
    this.logger.debug(`${req.method} ${req.url}`);
    next();
  }
}
