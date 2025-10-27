import { ArgumentMetadata } from '@nestjs/common';
import { ValidationPipe as BaseValidationPipe } from '@nestjs/common';

export class ValidationPipe extends BaseValidationPipe {
  constructor() {
    super({ whitelist: true, transform: true });
  }

  override transform(value: unknown, metadata: ArgumentMetadata): unknown {
    return super.transform(value, metadata);
  }
}
