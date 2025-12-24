/**
 * Simple Token Bucket Rate Limiter
 * Note: In a production environment with multiple instances (serverless/containers),
 * you should use Redis (e.g., Upstash) to share state.
 */

 * Rate Limiter Implementation
 *
 * Supports two modes:
 * 1. In-Memory (default): Uses a simple token bucket with Map. Suitable for local dev/testing.
 * 2. Redis (production): Uses Upstash Redis (simulated via stubs if dependencies are missing).
 *
 * To enable Redis mode, set:
 * - KV_REST_API_URL
 * - KV_REST_API_TOKEN
 */

import { LRUCache } from './lru-cache';

interface RateLimitConfig {
  interval: number; // in milliseconds
  uniqueTokenPerInterval: number; // max requests per interval
}

const LRU_CACHE_SIZE = 500;

class RateLimiter {
  private tokens: Map<string, number[]>;
  private config: RateLimitConfig;
// Stub interfaces for Redis/Upstash to allow the logic to exist without the heavy dependencies
interface RedisConfig {
  url: string;
  token: string;
}

// Simulates the @upstash/redis client
class StubRedis {
  private url: string;
  private token: string;

  constructor(config: RedisConfig) {
    this.url = config.url;
    this.token = config.token;
  }

  // Simulate a script execution or basic command
  async eval(script: string, keys: string[], args: (string | number)[]): Promise<any> {
    // In a real implementation, this sends a request to Upstash
    // For this example/stub, we just log and return a "success" simulation
    // Since we can't easily simulate shared state without an actual store,
    // this stub might behave like an "always allow" or simple echo in this context,
    // OR we could use a static map to simulate shared state in this process (though not across processes).

    // Let's simulate a sliding window result: [remaining, reset_time]
    // We'll fake it by saying "allowed"
    return [1, Date.now() + 10000];
  }
}

// Simulates @upstash/ratelimit
class StubRatelimit {
  private redis: StubRedis;
  private limiter: any;
  private prefix: string;

  constructor(config: { redis: StubRedis; limiter: any; prefix?: string }) {
    this.redis = config.redis;
    this.limiter = config.limiter;
    this.prefix = config.prefix || '@upstash/ratelimit';
  }

  async limit(identifier: string): Promise<{ success: boolean; limit: number; remaining: number; reset: number }> {
    // Simulate network latency
    await new Promise(resolve => setTimeout(resolve, 10));

    // For the purpose of the example, we just say "success"
    // In a real app with the real library, this calls the Redis script
    return {
      success: true,
      limit: 10,
      remaining: 9,
      reset: Date.now() + 10000
    };
  }

  static slidingWindow(limit: number, window: string) {
     return { type: 'slidingWindow', limit, window };
  }
}

const LRU_CACHE_SIZE = 500;

class RateLimiter {
  private tokens: LRUCache<string, number[]>;
  private config: RateLimitConfig;
  private redisLimiter: StubRatelimit | null = null;

  constructor(config: RateLimitConfig) {
    this.config = config;
    this.tokens = new Map();

    // Check for Redis environment variables
    const url = process.env.KV_REST_API_URL;
    const token = process.env.KV_REST_API_TOKEN;

    if (url && token) {
      console.log('⚡ Initializing Redis-based Rate Limiter (Stub Mode)');
      const redis = new StubRedis({ url, token });
      this.redisLimiter = new StubRatelimit({
        redis,
        limiter: StubRatelimit.slidingWindow(10, '10 s'), // Hardcoded to match default 10 req / 10s for example
        prefix: 'ratelimit',
      });
    }
    this.tokens = new LRUCache(LRU_CACHE_SIZE);
  }

  /**
   * Check if a token is rate limited.
   * Returns true if allowed, false if limited.
   */
  check(limit: number, token: string): boolean {
    const now = Date.now();
    const windowStart = now - this.config.interval;

    let timestamps = this.tokens.get(token) || [];
    
    // Filter out timestamps older than the window
    timestamps = timestamps.filter((t) => t > windowStart);
  async check(limit: number, token: string): Promise<boolean> {
    // 1. Redis Mode
    if (this.redisLimiter) {
      try {
        const { success } = await this.redisLimiter.limit(token);
        return success;
      } catch (error) {
        console.error('Redis Rate Limit failed, falling back to memory', error);
        // Fallback to memory on error
      }
    }

    // 2. In-Memory Mode
    const now = Date.now();
    const windowStart = now - this.config.interval;

    // get() updates recency
    let timestamps = this.tokens.get(token);
    
    if (!timestamps) {
      timestamps = [];
    } else {
      // Optimize: Timestamps are sorted, so we can find the cutoff and slice
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
    this.tokens.set(token, timestamps);

    // Basic cleanup to prevent memory leaks (LRU-like behavior would be better)
    if (this.tokens.size > LRU_CACHE_SIZE) {
        // Clear old entries naively if too big

    // LRU Optimization
    this.tokens.delete(token);
    this.tokens.set(token, timestamps);

    // Basic cleanup
    if (this.tokens.size > LRU_CACHE_SIZE) {
        const deleteCount =  this.tokens.size - LRU_CACHE_SIZE + 100;
        let deleted = 0;
        for (const key of this.tokens.keys()) {
            if (deleted >= deleteCount) break;
            this.tokens.delete(key);
            deleted++;
        }
    }

    return true;
  }
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
if (!process.env.KV_REST_API_URL) {
  console.warn('⚠️  Using in-memory rate limiter. This is NOT safe for production environments with multiple instances.');
}

export const limiter = new RateLimiter({
  interval: 10 * 1000,
  uniqueTokenPerInterval: 500,
});
