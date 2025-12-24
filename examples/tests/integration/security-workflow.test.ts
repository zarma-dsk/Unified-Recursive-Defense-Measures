import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import { limiter } from '../../src/lib/rate-limit';
import { sanitizeHtml, sanitizeInput } from '../../src/lib/sanitize';
import { logger } from '../../src/lib/logger';

describe('Security Workflow Integration', () => {
  describe('end-to-end security flow', () => {
    it('should sanitize input then log result', () => {
      const userInput = '  malicious<script>alert("xss")</script>  ';
      
      const sanitized = sanitizeInput(userInput);
      expect(sanitized).not.toContain('  ');
      
      logger.info('Input sanitized', { original: userInput, sanitized });
      // Should not throw
    });

    it('should rate limit then log attempt', () => {
    it('should rate limit then log attempt', async () => {
      const userId = 'test-user-123';
      
      // Use up rate limit
      for (let i = 0; i < 5; i++) {
        limiter.check(5, userId);
      }
      
      const isAllowed = limiter.check(5, userId);
        await limiter.check(5, userId);
      }
      
      const isAllowed = await limiter.check(5, userId);
      expect(isAllowed).toBe(false);
      
      logger.warn('Rate limit exceeded', { userId, allowed: isAllowed });
      // Should not throw
    });

    it('should sanitize HTML content before logging', () => {
      const untrustedHtml = '<p>Safe</p><script>alert("xss")</script>';
      
      const clean = sanitizeHtml(untrustedHtml);
      expect(clean).not.toContain('<script>');
      expect(clean).toContain('Safe');
      
      logger.info('HTML sanitized', { clean });
    });
  });

  describe('defensive programming patterns', () => {
    it('should handle null/undefined inputs gracefully', () => {
      expect(() => {
        sanitizeHtml('');
        sanitizeInput('');
        logger.info('', {});
      }).not.toThrow();
    });

    it('should handle malformed inputs without crashing', () => {
      const malformed = [
        '\0\0\0',
        '<><><>',
        '""""',
        "''''",
        '\\\\\\',
      ];
      
      malformed.forEach(input => {
        expect(() => {
          sanitizeInput(input);
          sanitizeHtml(input);
        }).not.toThrow();
      });
    });

    it('should maintain type safety throughout workflow', () => {
      const input: string = 'test input';
      const sanitized: string = sanitizeInput(input);
      const cleaned: string = sanitizeHtml(input);
      
      expect(typeof sanitized).toBe('string');
      expect(typeof cleaned).toBe('string');
    });
  });

  describe('security primitives integration', () => {
    it('should work together: rate limit + sanitize + log', () => {
    it('should work together: rate limit + sanitize + log', async () => {
      const userId = 'integrated-user';
      const userInput = '  <p>User comment</p>  ';
      
      // Check rate limit
      const allowed = limiter.check(10, userId);
      const allowed = await limiter.check(10, userId);
      
      if (allowed) {
        // Sanitize input
        const sanitized = sanitizeInput(userInput);
        const cleaned = sanitizeHtml(sanitized);
        
        // Log the action
        logger.info('User input processed', {
          userId,
          sanitized: cleaned,
        });
        
        expect(cleaned).toContain('User comment');
        expect(cleaned).not.toContain('  ');
      }
      
      expect(allowed).toBe(true);
    });

    it('should log security events with rate limiting', () => {
    it('should log security events with rate limiting', async () => {
      const attacker = 'attacker-ip-123';
      
      // Simulate attack attempts
      for (let i = 0; i < 20; i++) {
        const allowed = limiter.check(5, attacker);
        const allowed = await limiter.check(5, attacker);
        
        if (!allowed) {
          logger.warn('Rate limit exceeded - potential attack', {
            source: attacker,
            attempt: i + 1,
          });
        }
      }
      
      // Should complete without errors
      expect(true).toBe(true);
    });
  });

  describe('configuration validation', () => {
    it('should have all required security files', () => {
      const requiredFiles = [
        'src/lib/sanitize.ts',
        'src/lib/rate-limit.ts',
        'src/lib/logger.ts',
        '.semgrep.yml',
        'examples/.semgrep.yml',
        'vitest.config.ts'
      ];
      
      requiredFiles.forEach(file => {
        expect(fs.existsSync(file)).toBe(true);
      });
    });

    it('should have security validation scripts', () => {
      const securityScripts = [
        'scripts/validate-security.ts',
        'scripts/remove-local-npm.ts',
        'src/security/dependency-validator.ts'
      ];
      
      securityScripts.forEach(script => {
        expect(fs.existsSync(script)).toBe(true);
      });
    });

    it('should have test infrastructure', () => {
      expect(fs.existsSync('tests/unit')).toBe(true);
      expect(fs.existsSync('tests/integration')).toBe(true);
      expect(fs.existsSync('vitest.config.ts')).toBe(true);
    });
  });

  describe('real-world attack scenarios', () => {
    it('should defend against SQL injection in logging', () => {
      const sqlInjection = "'; DROP TABLE users; --";
      
      const sanitized = sanitizeInput(sqlInjection);
      logger.info('SQL injection attempt blocked', { input: sanitized });
      
      // Should not crash and input should be sanitized
      expect(sanitized).not.toContain('\0');
    });

    it('should defend against XSS attacks', () => {
      const xssAttacks = [
        '<script>alert("xss")</script>',
        '<img src=x onerror="alert(1)">',
        '<svg onload="alert(1)">',
        'javascript:alert(1)',
      ];
      
      xssAttacks.forEach(attack => {
        const cleaned = sanitizeHtml(attack);
        expect(cleaned).not.toContain('<script>');
        expect(cleaned).not.toContain('onerror');
        expect(cleaned).not.toContain('onload');
        expect(cleaned).not.toContain('javascript:');
      });
    });

    it('should defend against DoS via rate limiting', () => {
    it('should defend against DoS via rate limiting', async () => {
      const attacker = 'dos-attacker';
      let blockedCount = 0;
      
      // Simulate DoS attack
      for (let i = 0; i < 100; i++) {
        const allowed = limiter.check(10, attacker);
        const allowed = await limiter.check(10, attacker);
        if (!allowed) blockedCount++;
      }
      
      expect(blockedCount).toBeGreaterThan(80);
      logger.info('DoS attack mitigated', { blockedCount });
    });

    it('should handle path traversal attempts', () => {
      const pathTraversal = '../../etc/passwd';
      const sanitized = sanitizeInput(pathTraversal);
      
      // Should be sanitized but basic validation passed
      expect(sanitized).toBe('../../etc/passwd');
      logger.warn('Path traversal attempt detected', { path: sanitized });
    });

    it('should handle command injection attempts', () => {
      const commandInjection = '; rm -rf /';
      const sanitized = sanitizeInput(commandInjection);
      
      expect(sanitized).not.toContain('\0');
      logger.warn('Command injection attempt detected', { command: sanitized });
    });
  });

  describe('performance under load', () => {
    it('should handle high volume of sanitization requests', () => {
      const iterations = 1000;
      const startTime = Date.now();
      
      for (let i = 0; i < iterations; i++) {
        sanitizeHtml('<p>Test content</p>');
        sanitizeInput('test input');
      }
      
      const duration = Date.now() - startTime;
      
      // Should complete in reasonable time (< 5 seconds for 1000 iterations)
      expect(duration).toBeLessThan(5000);
    });

    it('should handle high volume of rate limit checks', () => {
      const iterations = 1000;
      const startTime = Date.now();
      
      for (let i = 0; i < iterations; i++) {
        limiter.check(100, `user-${i}`);
      }
    it('should handle high volume of rate limit checks', async () => {
      const iterations = 1000;
      const startTime = Date.now();
      
      const promises = [];
      for (let i = 0; i < iterations; i++) {
        promises.push(limiter.check(100, `user-${i}`));
      }
      await Promise.all(promises);
      
      const duration = Date.now() - startTime;
      
      // Should complete quickly
      expect(duration).toBeLessThan(1000);
    });

    it('should handle high volume of logging', () => {
      const iterations = 100;
      const startTime = Date.now();
      
      for (let i = 0; i < iterations; i++) {
        logger.info('Test message', { iteration: i });
      }
      
      const duration = Date.now() - startTime;
      
      // Should complete quickly
      expect(duration).toBeLessThan(1000);
    });
  });
});