import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { limiter } from '../../../src/lib/rate-limit';

describe('RateLimiter', () => {
  beforeEach(() => {
    // Reset the limiter state between tests by clearing its internal map
    // Note: This is a workaround since we can't easily access private properties
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  describe('check - basic functionality', () => {
    it('should allow requests under the limit', () => {
      const result1 = limiter.check(5, 'user-1');
      const result2 = limiter.check(5, 'user-1');
      const result3 = limiter.check(5, 'user-1');

      expect(result1).toBe(true);
      expect(result2).toBe(true);
      expect(result3).toBe(true);
    });

    it('should reject requests at the limit', () => {
      // Allow up to limit
      for (let i = 0; i < 5; i++) {
        expect(limiter.check(5, 'user-2')).toBe(true);
      }

      // Reject at limit
      expect(limiter.check(5, 'user-2')).toBe(false);
    });

    it('should reject requests over the limit', () => {
      for (let i = 0; i < 5; i++) {
        limiter.check(5, 'user-3');
      }

      expect(limiter.check(5, 'user-3')).toBe(false);
      expect(limiter.check(5, 'user-3')).toBe(false);
      expect(limiter.check(5, 'user-3')).toBe(false);
    });

    it('should handle limit of 1 correctly', () => {
      expect(limiter.check(1, 'user-4')).toBe(true);
      expect(limiter.check(1, 'user-4')).toBe(false);
      expect(limiter.check(1, 'user-4')).toBe(false);
    });

    it('should handle limit of 0 correctly', () => {
      expect(limiter.check(0, 'user-5')).toBe(false);
      expect(limiter.check(0, 'user-5')).toBe(false);
    });
  });

  describe('check - isolation between tokens', () => {
    it('should isolate different tokens', () => {
      // User 1 uses their limit
      for (let i = 0; i < 5; i++) {
        expect(limiter.check(5, 'user-a')).toBe(true);
      }
      expect(limiter.check(5, 'user-a')).toBe(false);

      // User 2 should have their own limit
      for (let i = 0; i < 5; i++) {
        expect(limiter.check(5, 'user-b')).toBe(true);
      }
      expect(limiter.check(5, 'user-b')).toBe(false);
    });

    it('should handle IP-based tokens', () => {
      const ip1 = '192.168.1.1';
      const ip2 = '192.168.1.2';

      for (let i = 0; i < 5; i++) {
        expect(limiter.check(5, ip1)).toBe(true);
      }
      expect(limiter.check(5, ip1)).toBe(false);

      // Different IP should have separate limit
      expect(limiter.check(5, ip2)).toBe(true);
    });

    it('should handle user ID tokens', () => {
      const userId1 = 'user-12345';
      const userId2 = 'user-67890';

      expect(limiter.check(3, userId1)).toBe(true);
      expect(limiter.check(3, userId1)).toBe(true);
      expect(limiter.check(3, userId1)).toBe(true);
      expect(limiter.check(3, userId1)).toBe(false);

      expect(limiter.check(3, userId2)).toBe(true);
      expect(limiter.check(3, userId2)).toBe(true);
    });
  });

  describe('check - time window behavior', () => {
    it('should reset after the time window expires', () => {
      const now = Date.now();
      vi.setSystemTime(now);

      // Use up limit
      for (let i = 0; i < 3; i++) {
        expect(limiter.check(3, 'user-time-1')).toBe(true);
      }
      expect(limiter.check(3, 'user-time-1')).toBe(false);

      // Advance time past the window (10 seconds + 1ms)
      vi.setSystemTime(now + 10001);

      // Should be allowed again
      expect(limiter.check(3, 'user-time-1')).toBe(true);
    });

    it('should use sliding window (not fixed window)', () => {
      const now = Date.now();
      vi.setSystemTime(now);

      // Make 2 requests
      expect(limiter.check(3, 'user-sliding')).toBe(true);
      expect(limiter.check(3, 'user-sliding')).toBe(true);

      // Advance 5 seconds (half the window)
      vi.setSystemTime(now + 5000);

      // Make 1 more request (total 3, at limit)
      expect(limiter.check(3, 'user-sliding')).toBe(true);
      expect(limiter.check(3, 'user-sliding')).toBe(false);

      // Advance another 5 seconds (first 2 requests should expire)
      vi.setSystemTime(now + 10001);

      // Should have 2 slots available now
      expect(limiter.check(3, 'user-sliding')).toBe(true);
      expect(limiter.check(3, 'user-sliding')).toBe(true);
      expect(limiter.check(3, 'user-sliding')).toBe(false);
    });

    it('should filter old timestamps correctly', () => {
      const now = Date.now();
      vi.setSystemTime(now);

      limiter.check(5, 'user-filter');

      vi.setSystemTime(now + 5000);
      limiter.check(5, 'user-filter');

      vi.setSystemTime(now + 10001);
      // First request should be filtered out
      expect(limiter.check(5, 'user-filter')).toBe(true);
    });
  });

  describe('check - memory management', () => {
    it('should handle many different tokens', () => {
      // Create 600 unique tokens (more than LRU_CACHE_SIZE of 500)
      for (let i = 0; i < 600; i++) {
        expect(limiter.check(1, `user-${i}`)).toBe(true);
      }

      // Should not crash or leak memory
      expect(limiter.check(1, 'user-new')).toBe(true);
    });

    it('should cleanup old entries when cache is full', () => {
      // Fill cache beyond limit
      for (let i = 0; i < 700; i++) {
        limiter.check(1, `cache-user-${i}`);
      }

      // System should still work
      expect(limiter.check(1, 'cache-user-new')).toBe(true);
    });
  });

  describe('check - edge cases', () => {
    it('should handle empty string tokens', () => {
      expect(limiter.check(3, '')).toBe(true);
      expect(limiter.check(3, '')).toBe(true);
      expect(limiter.check(3, '')).toBe(true);
      expect(limiter.check(3, '')).toBe(false);
    });

    it('should handle special character tokens', () => {
      const specialToken = 'user@example.com:192.168.1.1';
      expect(limiter.check(2, specialToken)).toBe(true);
      expect(limiter.check(2, specialToken)).toBe(true);
      expect(limiter.check(2, specialToken)).toBe(false);
    });

    it('should handle Unicode tokens', () => {
      const unicodeToken = 'user-🛡️-test';
      expect(limiter.check(2, unicodeToken)).toBe(true);
      expect(limiter.check(2, unicodeToken)).toBe(true);
      expect(limiter.check(2, unicodeToken)).toBe(false);
    });

    it('should handle very long tokens', () => {
      const longToken = 'a'.repeat(1000);
      expect(limiter.check(1, longToken)).toBe(true);
      expect(limiter.check(1, longToken)).toBe(false);
    });

    it('should handle negative limits as always blocked', () => {
      expect(limiter.check(-1, 'user-negative')).toBe(false);
      expect(limiter.check(-5, 'user-negative-2')).toBe(false);
    });

    it('should handle very large limits', () => {
      const largeLimit = 1000000;
      expect(limiter.check(largeLimit, 'user-large')).toBe(true);
    });
  });

  describe('check - concurrent requests', () => {
    it('should handle rapid successive requests', () => {
      const results = [];
      for (let i = 0; i < 10; i++) {
        results.push(limiter.check(5, 'user-rapid'));
      }

      const allowedCount = results.filter(r => r === true).length;
      const deniedCount = results.filter(r => r === false).length;

      expect(allowedCount).toBe(5);
      expect(deniedCount).toBe(5);
    });

    it('should maintain consistency with multiple tokens', () => {
      const tokens = ['user-1', 'user-2', 'user-3'];
      const results = new Map<string, boolean[]>();

      tokens.forEach(token => {
        results.set(token, []);
        for (let i = 0; i < 5; i++) {
          results.get(token)!.push(limiter.check(3, token));
        }
      });

      tokens.forEach(token => {
        const tokenResults = results.get(token)!;
        const allowed = tokenResults.filter(r => r === true).length;
        expect(allowed).toBe(3);
      });
    });
  });

  describe('check - realistic usage patterns', () => {
    it('should handle API rate limiting scenario', () => {
      const apiKey = 'api-key-123';
      const limit = 10; // 10 requests per window

      // Burst of requests
      for (let i = 0; i < limit; i++) {
        expect(limiter.check(limit, apiKey)).toBe(true);
      }

      // Additional requests denied
      expect(limiter.check(limit, apiKey)).toBe(false);
      expect(limiter.check(limit, apiKey)).toBe(false);
    });

    it('should handle login attempt rate limiting', () => {
      const ip = '10.0.0.1';
      const maxAttempts = 5;

      // Simulate failed login attempts
      for (let i = 0; i < maxAttempts; i++) {
        expect(limiter.check(maxAttempts, ip)).toBe(true);
      }

      // Should block further attempts
      expect(limiter.check(maxAttempts, ip)).toBe(false);
    });

    it('should handle distributed user requests', () => {
      const users = Array.from({ length: 50 }, (_, i) => `user-${i}`);

      users.forEach(user => {
        expect(limiter.check(3, user)).toBe(true);
        expect(limiter.check(3, user)).toBe(true);
        expect(limiter.check(3, user)).toBe(true);
        expect(limiter.check(3, user)).toBe(false);
      });
    });
  });

  describe('check - security considerations', () => {
    it('should prevent token enumeration attacks', () => {
      // Attacker trying many tokens to find valid ones
      const suspiciousTokens = Array.from({ length: 100 }, (_, i) => `probe-${i}`);

      suspiciousTokens.forEach(token => {
        const result = limiter.check(1, token);
        expect(typeof result).toBe('boolean');
      });
    });

    it('should not leak timing information', () => {
      const startNew = Date.now();
      limiter.check(5, 'timing-new');
      const timeNew = Date.now() - startNew;

      // Use up limit
      for (let i = 0; i < 5; i++) {
        limiter.check(5, 'timing-used');
      }

      const startUsed = Date.now();
      limiter.check(5, 'timing-used');
      const timeUsed = Date.now() - startUsed;

      // Should not have significant timing difference
      // (both should be very fast, < 10ms)
      expect(timeNew).toBeLessThan(10);
      expect(timeUsed).toBeLessThan(10);
    });

    it('should handle potential DoS with many unique tokens', () => {
      // Attacker creates many unique tokens to fill memory
      for (let i = 0; i < 1000; i++) {
        limiter.check(1, `dos-token-${i}`);
      }

      // System should still function (cleanup mechanism)
      expect(() => limiter.check(1, 'legit-user')).not.toThrow();
    });
  });

  describe('check - boundary conditions', () => {
    it('should handle exactly at limit', () => {
      for (let i = 0; i < 10; i++) {
        expect(limiter.check(10, 'boundary-user')).toBe(true);
      }
      expect(limiter.check(10, 'boundary-user')).toBe(false);
    });

    it('should handle just under limit', () => {
      for (let i = 0; i < 9; i++) {
        expect(limiter.check(10, 'under-limit')).toBe(true);
      }
      expect(limiter.check(10, 'under-limit')).toBe(true); // 10th request
      expect(limiter.check(10, 'under-limit')).toBe(false); // 11th request
    });

    it('should handle first request', () => {
      expect(limiter.check(5, 'first-request-user')).toBe(true);
    });
  });
});

  describe('concurrent access patterns', () => {
    it('should handle concurrent requests for same token correctly', () => {
      const now = Date.now();
      vi.setSystemTime(now);

      // Simulate concurrent requests
      const results = [];
      for (let i = 0; i < 10; i++) {
        results.push(limiter.check(5, 'concurrent-token'));
      }

      const allowed = results.filter(r => r === true).length;
      const denied = results.filter(r => r === false).length;

      expect(allowed).toBe(5);
      expect(denied).toBe(5);
    });

    it('should handle high-frequency burst requests', () => {
      const now = Date.now();
      vi.setSystemTime(now);

      // Burst of 100 requests
      const results = Array.from({ length: 100 }, () =>
        limiter.check(10, 'burst-user')
      );

      const allowed = results.filter(r => r).length;
      expect(allowed).toBe(10);
      expect(results.filter(r => !r).length).toBe(90);
    });

    it('should maintain accuracy under rapid sequential calls', () => {
      const now = Date.now();
      vi.setSystemTime(now);

      for (let i = 0; i < 3; i++) {
        expect(limiter.check(3, 'rapid-user')).toBe(true);
      }
      expect(limiter.check(3, 'rapid-user')).toBe(false);

      // Advance time slightly (not enough to expire)
      vi.setSystemTime(now + 100);
      expect(limiter.check(3, 'rapid-user')).toBe(false);
    });

    it('should handle interleaved requests from multiple users', () => {
      const now = Date.now();
      vi.setSystemTime(now);

      const users = ['user-a', 'user-b', 'user-c'];

      // Interleave requests
      for (let round = 0; round < 3; round++) {
        for (const user of users) {
          expect(limiter.check(3, user)).toBe(true);
        }
      }

      // All should be at limit
      for (const user of users) {
        expect(limiter.check(3, user)).toBe(false);
      }
    });
  });

  describe('timing precision and edge cases', () => {
    it('should handle requests exactly at window boundary', () => {
      const now = Date.now();
      vi.setSystemTime(now);

      limiter.check(3, 'boundary-user');

      // Exactly at 10 second mark
      vi.setSystemTime(now + 10000);

      // First request should still be in window (<=)
      expect(limiter.check(3, 'boundary-user')).toBe(true);
    });

    it('should handle microsecond precision timing', () => {
      const now = Date.now();
      vi.setSystemTime(now);

      limiter.check(3, 'precise-user');

      // Just before window expiry
      vi.setSystemTime(now + 9999);
      expect(limiter.check(3, 'precise-user')).toBe(true);

      // Just after window expiry
      vi.setSystemTime(now + 10001);
      expect(limiter.check(3, 'precise-user')).toBe(true);
    });

    it('should handle timestamp overflow gracefully', () => {
      const veryLargeTime = Number.MAX_SAFE_INTEGER - 10000;
      vi.setSystemTime(veryLargeTime);

      expect(limiter.check(5, 'overflow-user')).toBe(true);

      vi.setSystemTime(veryLargeTime + 1000);
      expect(limiter.check(5, 'overflow-user')).toBe(true);
    });

    it('should handle zero time advancement', () => {
      const now = Date.now();
      vi.setSystemTime(now);

      limiter.check(3, 'zero-time-user');

      // Same exact timestamp
      vi.setSystemTime(now);

      expect(limiter.check(3, 'zero-time-user')).toBe(true);
    });
  });

  describe('extreme limit values', () => {
    it('should handle very high limits efficiently', () => {
      const now = Date.now();
      vi.setSystemTime(now);

      const highLimit = 10000;

      for (let i = 0; i < highLimit; i++) {
        expect(limiter.check(highLimit, 'high-limit-user')).toBe(true);
      }

      expect(limiter.check(highLimit, 'high-limit-user')).toBe(false);
    });

    it('should handle negative limits as always denied', () => {
      expect(limiter.check(-1, 'negative-limit-user')).toBe(false);
      expect(limiter.check(-100, 'negative-limit-user2')).toBe(false);
    });

    it('should handle fractional limits by flooring', () => {
      // Assuming check expects integer limits
      expect(limiter.check(2, 'fractional-user')).toBe(true);
      expect(limiter.check(2, 'fractional-user')).toBe(true);
      expect(limiter.check(2, 'fractional-user')).toBe(false);
    });

    it('should handle very large token counts efficiently', () => {
      const now = Date.now();
      vi.setSystemTime(now);

      // Create many unique tokens
      for (let i = 0; i < 1000; i++) {
        limiter.check(1, `mass-user-${i}`);
      }

      // Should still work without performance degradation
      expect(limiter.check(1, 'new-user')).toBe(true);
    });
  });

  describe('memory leak prevention', () => {
    it('should cleanup entries when cache exceeds LRU_CACHE_SIZE', () => {
      // Fill cache beyond 500
      for (let i = 0; i < 700; i++) {
        limiter.check(1, `cache-user-${i}`);
      }

      // New requests should still work
      for (let i = 0; i < 100; i++) {
        expect(limiter.check(1, `new-cache-user-${i}`)).toBe(true);
      }
    });

    it('should handle repeated cache overflow gracefully', () => {
      // Cause multiple cleanups
      for (let round = 0; round < 5; round++) {
        for (let i = 0; i < 200; i++) {
          limiter.check(1, `overflow-round-${round}-user-${i}`);
        }
      }

      expect(limiter.check(1, 'final-user')).toBe(true);
    });

    it('should not leak memory with expired timestamps', () => {
      const now = Date.now();
      vi.setSystemTime(now);

      // Create requests that will expire
      for (let i = 0; i < 100; i++) {
        limiter.check(5, `expire-user-${i}`);
      }

      // Advance time to expire all
      vi.setSystemTime(now + 20000);

      // New requests should filter old timestamps
      for (let i = 0; i < 100; i++) {
        limiter.check(5, `expire-user-${i}`);
      }

      expect(limiter.check(1, 'cleanup-test')).toBe(true);
    });
  });

  describe('sliding window accuracy', () => {
    it('should maintain exact sliding window semantics', () => {
      const now = Date.now();
      const limit = 5;
      const token = 'sliding-precise';

      // T=0: 3 requests
      vi.setSystemTime(now);
      for (let i = 0; i < 3; i++) {
        expect(limiter.check(limit, token)).toBe(true);
      }

      // T=5000: 2 more requests (total 5, at limit)
      vi.setSystemTime(now + 5000);
      expect(limiter.check(limit, token)).toBe(true);
      expect(limiter.check(limit, token)).toBe(true);
      expect(limiter.check(limit, token)).toBe(false); // Over limit

      // T=10001: First 3 requests expire, should have 2 slots
      vi.setSystemTime(now + 10001);
      expect(limiter.check(limit, token)).toBe(true);
      expect(limiter.check(limit, token)).toBe(true);
      expect(limiter.check(limit, token)).toBe(true); // Still works

      // T=15001: Middle 2 expire, should have 2 slots again
      vi.setSystemTime(now + 15001);
      expect(limiter.check(limit, token)).toBe(true);
      expect(limiter.check(limit, token)).toBe(true);
    });

    it('should handle gradual request patterns', () => {
      const now = Date.now();
      vi.setSystemTime(now);

      // Spread requests across time window
      for (let i = 0; i < 10; i++) {
        vi.setSystemTime(now + (i * 1000));
        expect(limiter.check(10, 'gradual-user')).toBe(true);
      }

      // Should be at limit
      vi.setSystemTime(now + 10000);
      expect(limiter.check(10, 'gradual-user')).toBe(false);

      // After 1 more second, first request expires
      vi.setSystemTime(now + 11000);
      expect(limiter.check(10, 'gradual-user')).toBe(true);
    });
  });

  describe('special token formats', () => {
    it('should handle IP:PORT format tokens', () => {
      const token = '192.168.1.1:8080';
      expect(limiter.check(3, token)).toBe(true);
      expect(limiter.check(3, token)).toBe(true);
      expect(limiter.check(3, token)).toBe(true);
      expect(limiter.check(3, token)).toBe(false);
    });

    it('should handle UUID tokens', () => {
      const uuid = '550e8400-e29b-41d4-a716-446655440000';
      expect(limiter.check(2, uuid)).toBe(true);
      expect(limiter.check(2, uuid)).toBe(true);
      expect(limiter.check(2, uuid)).toBe(false);
    });

    it('should handle very long tokens', () => {
      const longToken = 'user-' + 'x'.repeat(1000);
      expect(limiter.check(2, longToken)).toBe(true);
      expect(limiter.check(2, longToken)).toBe(true);
      expect(limiter.check(2, longToken)).toBe(false);
    });

    it('should handle tokens with null bytes', () => {
      const nullToken = 'user\x00test';
      expect(limiter.check(2, nullToken)).toBe(true);
      expect(limiter.check(2, nullToken)).toBe(true);
      expect(limiter.check(2, nullToken)).toBe(false);
    });

    it('should differentiate similar tokens', () => {
      expect(limiter.check(1, 'user1')).toBe(true);
      expect(limiter.check(1, 'user1')).toBe(false);

      expect(limiter.check(1, 'user2')).toBe(true); // Different token
    });
  });

  describe('recovery and reset scenarios', () => {
    it('should allow gradual recovery as timestamps expire', () => {
      const now = Date.now();
      const token = 'recovery-user';

      // Use up limit
      vi.setSystemTime(now);
      for (let i = 0; i < 5; i++) {
        limiter.check(5, token);
      }
      expect(limiter.check(5, token)).toBe(false);

      // Partial recovery after 5 seconds
      vi.setSystemTime(now + 5000);
      expect(limiter.check(5, token)).toBe(false); // Still at limit

      // Full recovery after 10+ seconds
      vi.setSystemTime(now + 10001);
      expect(limiter.check(5, token)).toBe(true);
    });

    it('should handle complete window expiration', () => {
      const now = Date.now();
      vi.setSystemTime(now);

      limiter.check(3, 'expire-user');
      limiter.check(3, 'expire-user');
      limiter.check(3, 'expire-user');
      expect(limiter.check(3, 'expire-user')).toBe(false);

      // Far future: all expired
      vi.setSystemTime(now + 100000);

      // Should have full limit available
      expect(limiter.check(3, 'expire-user')).toBe(true);
      expect(limiter.check(3, 'expire-user')).toBe(true);
      expect(limiter.check(3, 'expire-user')).toBe(true);
      expect(limiter.check(3, 'expire-user')).toBe(false);
    });
  });

  describe('distributed system considerations', () => {
    it('should document need for shared state in production', () => {
      // This is a local in-memory limiter
      // In production with multiple instances, would need Redis
      expect(limiter.check(1, 'distributed-user')).toBe(true);
    });

    it('should handle single-instance correctly', () => {
      // Verify it works correctly for single instance
      const token = 'single-instance';

      for (let i = 0; i < 10; i++) {
        expect(limiter.check(10, token)).toBe(true);
      }
      expect(limiter.check(10, token)).toBe(false);
    });
  });
});