import { SetMetadata } from '@nestjs/common';
import { Throttle as NestThrottle } from '@nestjs/throttler';

// Predefined rate limit tiers
export const RATE_LIMITS = {
  // Strict limits for sensitive operations
  STRICT: { ttl: 60, limit: 10 }, // 10 req/min
  AUTH: { ttl: 300, limit: 5 }, // 5 req/5min (login, register, password reset)

  // Standard limits
  STANDARD: { ttl: 60, limit: 100 }, // 100 req/min (default)

  // Relaxed limits for read operations
  RELAXED: { ttl: 60, limit: 300 }, // 300 req/min

  // Very relaxed for public content
  PUBLIC: { ttl: 60, limit: 1000 }, // 1000 req/min

  // File upload limits
  UPLOAD: { ttl: 60, limit: 10 }, // 10 uploads/min
};

/**
 * Apply strict rate limiting (10 req/min)
 * Use for sensitive operations like password changes
 */
export const ThrottleStrict = () => NestThrottle([RATE_LIMITS.STRICT]);

/**
 * Apply auth rate limiting (5 req/5min)
 * Use for authentication endpoints
 */
export const ThrottleAuth = () => NestThrottle([RATE_LIMITS.AUTH]);

/**
 * Apply standard rate limiting (100 req/min)
 * Default for most endpoints
 */
export const ThrottleStandard = () => NestThrottle([RATE_LIMITS.STANDARD]);

/**
 * Apply relaxed rate limiting (300 req/min)
 * Use for read-heavy operations
 */
export const ThrottleRelaxed = () => NestThrottle([RATE_LIMITS.RELAXED]);

/**
 * Apply public rate limiting (1000 req/min)
 * Use for public content endpoints
 */
export const ThrottlePublic = () => NestThrottle([RATE_LIMITS.PUBLIC]);

/**
 * Apply upload rate limiting (10 uploads/min)
 * Use for file upload endpoints
 */
export const ThrottleUpload = () => NestThrottle([RATE_LIMITS.UPLOAD]);

/**
 * Skip rate limiting for specific endpoint
 */
export const SkipThrottle = () => SetMetadata('skipThrottle', true);
