/**
 * Simple Token Bucket Rate Limiter
 * Note: In a production environment with multiple instances (serverless/containers),
 * you should use Redis (e.g., Upstash) to share state.
 */

import { LRUCache } from './lru-cache';

interface RateLimitConfig {
  interval: number; // in milliseconds
  uniqueTokenPerInterval: number; // max requests per interval
}

const LRU_CACHE_SIZE = 500;

class RateLimiter {
  private tokens: LRUCache<string, number[]>;
  private config: RateLimitConfig;

  constructor(config: RateLimitConfig) {
    this.config = config;
    this.tokens = new LRUCache(LRU_CACHE_SIZE);
  }

  /**
   * Check if a token is rate limited.
   * Returns true if allowed, false if limited.
   */
  check(limit: number, token: string): boolean {
    const now = Date.now();
    const windowStart = now - this.config.interval;

    // get() updates recency
    let timestamps = this.tokens.get(token);
    
    if (!timestamps) {
      timestamps = [];
    } else {
      // Optimize: Timestamps are sorted, so we can find the cutoff and slice
      // This is faster than filter() which checks every element and allocates incrementally
      const firstValidIndex = timestamps.findIndex((t) => t > windowStart);
      if (firstValidIndex === -1) {
        // No valid timestamps (all expired)
        timestamps = [];
      } else if (firstValidIndex > 0) {
        // Remove expired timestamps
        timestamps = timestamps.slice(firstValidIndex);
      }
    }

    if (timestamps.length >= limit) {
      return false;
    }

    timestamps.push(now);

    // set() updates recency and handles eviction if full
    this.tokens.set(token, timestamps);

    return true;
  }

  /**
   * Reset the rate limiter state.
   * Useful for testing.
   */
  reset(): void {
    this.tokens.clear();
  }
}

// Default limiter: 10 requests per 10 seconds per user/IP
// WARNING: This is an in-memory limiter. It will not share state across Next.js serverless functions or containers.
// For production, replace with: https://vercel.com/docs/functions/edge-middleware/middleware-helper#rate-limit
console.warn('⚠️  Using in-memory rate limiter. This is NOT safe for production environments with multiple instances.');

export const limiter = new RateLimiter({
  interval: 10 * 1000,
  uniqueTokenPerInterval: 500,
});
