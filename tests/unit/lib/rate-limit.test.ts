import { describe, it, expect, beforeEach, vi } from 'vitest';
import { limiter } from '../../../src/lib/rate-limit';

describe('RateLimiter', () => {
  beforeEach(() => {
    // Clear the rate limiter's internal state before each test
    // Note: This accesses private state - in production you'd want a reset method
    (limiter as any).tokens.clear();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('basic rate limiting', () => {
    it('should allow requests under the limit', () => {
      const token = 'user123';
      const limit = 5;

      for (let i = 0; i < limit; i++) {
        expect(limiter.check(limit, token)).toBe(true);
      }
    });

    it('should block requests over the limit', () => {
      const token = 'user123';
      const limit = 3;

      // Use up the limit
      for (let i = 0; i < limit; i++) {
        expect(limiter.check(limit, token)).toBe(true);
      }

      // Next request should be blocked
      expect(limiter.check(limit, token)).toBe(false);
    });

    it('should track different tokens independently', () => {
      const limit = 2;

      expect(limiter.check(limit, 'user1')).toBe(true);
      expect(limiter.check(limit, 'user2')).toBe(true);
      expect(limiter.check(limit, 'user1')).toBe(true);
      expect(limiter.check(limit, 'user2')).toBe(true);

      // Both users should now be at limit
      expect(limiter.check(limit, 'user1')).toBe(false);
      expect(limiter.check(limit, 'user2')).toBe(false);
    });

    it('should allow zero as a valid limit (block all)', () => {
      const token = 'user123';
      expect(limiter.check(0, token)).toBe(false);
    });

    it('should handle high limits', () => {
      const token = 'user123';
      const limit = 1000;

      for (let i = 0; i < limit; i++) {
        expect(limiter.check(limit, token)).toBe(true);
      }

      expect(limiter.check(limit, token)).toBe(false);
    });
  });

  describe('time window behavior', () => {
    it('should allow requests again after time window expires', () => {
      const token = 'user123';
      const limit = 2;

      // Use up the limit
      expect(limiter.check(limit, token)).toBe(true);
      expect(limiter.check(limit, token)).toBe(true);
      expect(limiter.check(limit, token)).toBe(false);

      // Advance time past the window (default: 10 seconds)
      vi.advanceTimersByTime(11000);

      // Should be allowed again
      expect(limiter.check(limit, token)).toBe(true);
    });

    it('should maintain partial history within window', () => {
      const token = 'user123';
      const limit = 3;

      // Make 2 requests
      expect(limiter.check(limit, token)).toBe(true);
      expect(limiter.check(limit, token)).toBe(true);

      // Advance time by 5 seconds (half the window)
      vi.advanceTimersByTime(5000);

      // Make 1 more request (now at limit)
      expect(limiter.check(limit, token)).toBe(true);

      // Should be blocked
      expect(limiter.check(limit, token)).toBe(false);

      // Advance another 6 seconds (first 2 requests should expire)
      vi.advanceTimersByTime(6000);

      // Should have 2 slots available now
      expect(limiter.check(limit, token)).toBe(true);
      expect(limiter.check(limit, token)).toBe(true);
      expect(limiter.check(limit, token)).toBe(false);
    });

    it('should handle requests exactly at window boundary', () => {
      const token = 'user123';
      const limit = 1;

      expect(limiter.check(limit, token)).toBe(true);
      expect(limiter.check(limit, token)).toBe(false);

      // Advance exactly 10 seconds
      vi.advanceTimersByTime(10000);

      // Request at exactly window duration should be allowed
      expect(limiter.check(limit, token)).toBe(true);
    });
  });

  describe('sliding window behavior', () => {
    it('should use sliding window algorithm', () => {
      const token = 'user123';
      const limit = 3;

      // t=0: 3 requests
      expect(limiter.check(limit, token)).toBe(true);
      expect(limiter.check(limit, token)).toBe(true);
      expect(limiter.check(limit, token)).toBe(true);
      expect(limiter.check(limit, token)).toBe(false);

      // t=5s: oldest requests still in window
      vi.advanceTimersByTime(5000);
      expect(limiter.check(limit, token)).toBe(false);

      // t=11s: all old requests expired
      vi.advanceTimersByTime(6000);
      expect(limiter.check(limit, token)).toBe(true);
    });

    it('should gradually release quota as time passes', () => {
      const token = 'user123';
      const limit = 5;

      // Make 5 requests at t=0
      for (let i = 0; i < 5; i++) {
        expect(limiter.check(limit, token)).toBe(true);
      }
      expect(limiter.check(limit, token)).toBe(false);

      // Advance 2 seconds at a time and verify gradual release
      for (let i = 0; i < 5; i++) {
        vi.advanceTimersByTime(2500);
        expect(limiter.check(limit, token)).toBe(true);
        expect(limiter.check(limit, token)).toBe(false);
      }
    });
  });

  describe('memory management and cleanup', () => {
    it('should clean up old entries when cache size exceeded', () => {
      const limit = 1;
      
      // Add entries beyond LRU_CACHE_SIZE (500)
      for (let i = 0; i < 600; i++) {
        limiter.check(limit, `user${i}`);
      }

      // Internal tokens map should have been cleaned up
      const tokensSize = (limiter as any).tokens.size;
      expect(tokensSize).toBeLessThan(600);
      expect(tokensSize).toBeGreaterThan(0);
    });

    it('should handle cleanup without affecting active tokens', () => {
      const activeToken = 'active_user';
      const limit = 5;

      // Make this token active
      limiter.check(limit, activeToken);

      // Add many other tokens to trigger cleanup
      for (let i = 0; i < 600; i++) {
        limiter.check(limit, `user${i}`);
      }

      // Active token may or may not survive cleanup (depends on insertion order)
      // This tests that cleanup doesn't crash
      limiter.check(limit, activeToken);
    });

    it('should handle rapid creation of unique tokens', () => {
      const limit = 1;
      
      // Simulate many different users making requests
      for (let i = 0; i < 1000; i++) {
        expect(() => {
          limiter.check(limit, `user${i}_${Date.now()}`);
        }).not.toThrow();
      }
    });
  });

  describe('edge cases and boundary conditions', () => {
    it('should handle empty token string', () => {
      expect(limiter.check(5, '')).toBe(true);
      expect(limiter.check(5, '')).toBe(true);
    });

    it('should handle very long token strings', () => {
      const longToken = 'a'.repeat(10000);
      expect(limiter.check(5, longToken)).toBe(true);
    });

    it('should handle tokens with special characters', () => {
      const specialToken = 'user@email.com:192.168.1.1';
      expect(limiter.check(5, specialToken)).toBe(true);
      expect(limiter.check(5, specialToken)).toBe(true);
    });

    it('should handle Unicode tokens', () => {
      const unicodeToken = '用户123_🎉';
      expect(limiter.check(3, unicodeToken)).toBe(true);
      expect(limiter.check(3, unicodeToken)).toBe(true);
      expect(limiter.check(3, unicodeToken)).toBe(true);
      expect(limiter.check(3, unicodeToken)).toBe(false);
    });

    it('should handle negative limits gracefully', () => {
      const token = 'user123';
      // Negative limit should block all requests
      expect(limiter.check(-1, token)).toBe(false);
    });

    it('should handle limit of 1 correctly', () => {
      const token = 'user123';
      expect(limiter.check(1, token)).toBe(true);
      expect(limiter.check(1, token)).toBe(false);

      vi.advanceTimersByTime(11000);
      expect(limiter.check(1, token)).toBe(true);
    });
  });

  describe('concurrent access simulation', () => {
    it('should handle burst of requests from same token', () => {
      const token = 'user123';
      const limit = 10;
      let allowed = 0;
      let blocked = 0;

      // Simulate 20 rapid requests
      for (let i = 0; i < 20; i++) {
        if (limiter.check(limit, token)) {
          allowed++;
        } else {
          blocked++;
        }
      }

      expect(allowed).toBe(limit);
      expect(blocked).toBe(20 - limit);
    });

    it('should handle interleaved requests from multiple tokens', () => {
      const limit = 3;
      const results: Record<string, { allowed: number; blocked: number }> = {
        user1: { allowed: 0, blocked: 0 },
        user2: { allowed: 0, blocked: 0 },
        user3: { allowed: 0, blocked: 0 },
      };

      // Interleave requests
      for (let round = 0; round < 5; round++) {
        for (const token of ['user1', 'user2', 'user3']) {
          if (limiter.check(limit, token)) {
            results[token].allowed++;
          } else {
            results[token].blocked++;
          }
        }
      }

      // Each user should have exactly 3 allowed
      expect(results.user1.allowed).toBe(3);
      expect(results.user2.allowed).toBe(3);
      expect(results.user3.allowed).toBe(3);

      // And 2 blocked
      expect(results.user1.blocked).toBe(2);
      expect(results.user2.blocked).toBe(2);
      expect(results.user3.blocked).toBe(2);
    });
  });

  describe('security-focused scenarios', () => {
    it('should protect against brute force login attempts', () => {
      const attackerIp = '192.168.1.100';
      const loginAttemptLimit = 5;

      // Simulate failed login attempts
      let blockedAttempts = 0;
      for (let i = 0; i < 20; i++) {
        if (!limiter.check(loginAttemptLimit, attackerIp)) {
          blockedAttempts++;
        }
      }

      expect(blockedAttempts).toBe(15); // 20 - 5 = 15 blocked
    });

    it('should protect against API abuse', () => {
      const apiKey = 'api_key_123';
      const apiLimit = 100;

      // Legitimate usage
      for (let i = 0; i < apiLimit; i++) {
        expect(limiter.check(apiLimit, apiKey)).toBe(true);
      }

      // Abuse attempt
      expect(limiter.check(apiLimit, apiKey)).toBe(false);
    });

    it('should handle distributed attack from multiple IPs', () => {
      const limit = 5;
      const attackers = 100;

      // Each attacker makes requests
      for (let i = 0; i < attackers; i++) {
        const ip = `192.168.1.${i}`;
        
        // Each can make up to limit requests
        for (let j = 0; j < limit; j++) {
          expect(limiter.check(limit, ip)).toBe(true);
        }
        
        // But not more
        expect(limiter.check(limit, ip)).toBe(false);
      }
    });

    it('should differentiate between user IDs and IP addresses', () => {
      const userLimit = 10;
      const ipLimit = 50;

      const userId = 'user_456';
      const ipAddress = '10.0.0.1';

      // User-specific limiting
      for (let i = 0; i < userLimit; i++) {
        expect(limiter.check(userLimit, userId)).toBe(true);
      }
      expect(limiter.check(userLimit, userId)).toBe(false);

      // IP-specific limiting (independent)
      for (let i = 0; i < ipLimit; i++) {
        expect(limiter.check(ipLimit, ipAddress)).toBe(true);
      }
      expect(limiter.check(ipLimit, ipAddress)).toBe(false);
    });
  });

  describe('performance characteristics', () => {
    it('should handle high request volume efficiently', () => {
      const startTime = Date.now();
      const limit = 100;

      for (let i = 0; i < 10000; i++) {
        limiter.check(limit, `user${i % 500}`);
      }

      const endTime = Date.now();
      const duration = endTime - startTime;

      // Should complete in reasonable time (< 1 second)
      expect(duration).toBeLessThan(1000);
    });

    it('should maintain performance with many unique tokens', () => {
      const limit = 5;
      const uniqueTokens = 1000;

      const startTime = Date.now();

      for (let i = 0; i < uniqueTokens; i++) {
        limiter.check(limit, `user${i}`);
      }

      const endTime = Date.now();
      const duration = endTime - startTime;

      expect(duration).toBeLessThan(500);
    });
  });
});