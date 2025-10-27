import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';

@Injectable()
export class ThrottleGuard implements CanActivate {
  canActivate(_: ExecutionContext): boolean {
    return true;
  }
}
