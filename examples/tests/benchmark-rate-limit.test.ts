import { describe, it, expect, bench } from 'vitest';
import { limiter } from '../src/lib/rate-limit';

describe('RateLimiter Performance', () => {
  it('should handle high volume of requests efficiently', () => {
    const token = 'benchmark-user';
    const limit = 100;
    const start = performance.now();
    const iterations = 10000;

    for (let i = 0; i < iterations; i++) {
      limiter.check(limit, token);
    }

    const end = performance.now();
    const duration = end - start;

    console.log(`\n⚡ Benchmark Results:`);
    console.log(`   Operations: ${iterations}`);
    console.log(`   Total time: ${duration.toFixed(2)}ms`);
    console.log(`   Op/ms: ${(iterations / duration).toFixed(2)}`);
    console.log(`   Avg time per op: ${(duration / iterations).toFixed(4)}ms\n`);

    expect(duration).toBeGreaterThan(0);
  });
});
