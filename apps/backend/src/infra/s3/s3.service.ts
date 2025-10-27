import { Injectable } from '@nestjs/common';

@Injectable()
export class S3Service {
  ping(): string {
    return 'S3 ok';
  }
}
