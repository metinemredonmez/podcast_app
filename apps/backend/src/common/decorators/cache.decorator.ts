import { SetMetadata } from '@nestjs/common';

/**
 * Set custom cache TTL for endpoint
 * @param ttl Time to live in milliseconds
 */
export const CacheTTL = (ttl: number) => SetMetadata('cache:ttl', ttl);

/**
 * Disable caching for specific endpoint
 */
export const NoCache = () => SetMetadata('cache:disable', true);

/**
 * Predefined cache TTL values
 */
export const CACHE_TTL = {
  SHORT: 60 * 1000, // 1 minute
  MEDIUM: 5 * 60 * 1000, // 5 minutes
  LONG: 30 * 60 * 1000, // 30 minutes
  HOUR: 60 * 60 * 1000, // 1 hour
  DAY: 24 * 60 * 60 * 1000, // 1 day
};
