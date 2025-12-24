/**
 * Simple Token Bucket Rate Limiter
 * Note: In a production environment with multiple instances (serverless/containers),
 * you should use Redis (e.g., Upstash) to share state.
 */

interface RateLimitConfig {
  interval: number; // in milliseconds
  uniqueTokenPerInterval: number; // max requests per interval
}

const LRU_CACHE_SIZE = 500;

class RateLimiter {
  private tokens: Map<string, number[]>;
  private config: RateLimitConfig;

  constructor(config: RateLimitConfig) {
    this.config = config;
    this.tokens = new Map();
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

    if (timestamps.length >= limit) {
      return false;
    }

    timestamps.push(now);
    this.tokens.set(token, timestamps);

    // Basic cleanup to prevent memory leaks (LRU-like behavior would be better)
    if (this.tokens.size > LRU_CACHE_SIZE) {
        // Clear old entries naively if too big
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
}

// Default limiter: 10 requests per 10 seconds per user/IP
// WARNING: This is an in-memory limiter. It will not share state across Next.js serverless functions or containers.
// For production, replace with: https://vercel.com/docs/functions/edge-middleware/middleware-helper#rate-limit
console.warn('⚠️  Using in-memory rate limiter. This is NOT safe for production environments with multiple instances.');

export const limiter = new RateLimiter({
  interval: 10 * 1000,
  uniqueTokenPerInterval: 500,
});
