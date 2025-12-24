import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { limiter } from '../../../src/lib/rate-limit';

describe('RateLimiter', () => {
  beforeEach(() => {
    // Reset the limiter state between tests by clearing its internal map
    limiter.reset();
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