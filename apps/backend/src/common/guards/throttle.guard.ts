/**
 * @deprecated This custom guard is no longer used.
 * Use @nestjs/throttler's ThrottlerGuard instead, which is already
 * configured as a global guard in app.module.ts.
 *
 * For custom throttle limits, use decorators from common/decorators/throttle.decorator.ts:
 * - @ThrottleAuth() - for auth endpoints (5 req/5min)
 * - @ThrottleStandard() - for standard endpoints (100 req/min)
 * - @ThrottleStrict() - for sensitive endpoints (3 req/min)
 * - @ThrottleUpload() - for upload endpoints (10 req/min)
 */
export {};
