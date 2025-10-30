import { ArgumentMetadata, Injectable } from '@nestjs/common';
import { ValidationPipe as BaseValidationPipe } from '@nestjs/common';

@Injectable()
export class ValidationPipe extends BaseValidationPipe {
  constructor() {
    super({ whitelist: true, transform: true });
  }

  override async transform(value: unknown, metadata: ArgumentMetadata): Promise<unknown> {
    return super.transform(value, metadata);
  }
}
