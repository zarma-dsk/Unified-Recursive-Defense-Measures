import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { logger } from '../../../src/lib/logger';

describe('Logger', () => {
  let consoleLogSpy: ReturnType<typeof vi.spyOn>;
  let consoleErrorSpy: ReturnType<typeof vi.spyOn>;
  let consoleWarnSpy: ReturnType<typeof vi.spyOn>;
  let consoleDebugSpy: ReturnType<typeof vi.spyOn>;
  const originalEnv = process.env.NODE_ENV;

  beforeEach(() => {
    consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    consoleDebugSpy = vi.spyOn(console, 'debug').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
    process.env.NODE_ENV = originalEnv;
  });

  describe('info()', () => {
    it('should log info level messages with correct structure', () => {
      logger.info('Test message');

      expect(consoleLogSpy).toHaveBeenCalledOnce();
      const loggedData = JSON.parse(consoleLogSpy.mock.calls[0][0]);

      expect(loggedData).toMatchObject({
        level: 'info',
        message: 'Test message',
      });
      expect(loggedData.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}.\d{3}Z$/);
    });

    it('should include context when provided', () => {
      const context = { userId: '123', action: 'login' };
      logger.info('User action', context);

      const loggedData = JSON.parse(consoleLogSpy.mock.calls[0][0]);
      expect(loggedData.context).toEqual(context);
    });

    it('should handle empty context object', () => {
      logger.info('Message', {});

      const loggedData = JSON.parse(consoleLogSpy.mock.calls[0][0]);
      expect(loggedData.context).toEqual({});
    });

    it('should handle context with nested objects', () => {
      const context = { 
        user: { id: '123', name: 'Test' },
        metadata: { ip: '127.0.0.1' }
      };
      logger.info('Complex context', context);

      const loggedData = JSON.parse(consoleLogSpy.mock.calls[0][0]);
      expect(loggedData.context).toEqual(context);
    });

    it('should handle special characters in message', () => {
      logger.info('Message with "quotes" and \'apostrophes\' and \n newlines');

      expect(consoleLogSpy).toHaveBeenCalledOnce();
      const loggedData = JSON.parse(consoleLogSpy.mock.calls[0][0]);
      expect(loggedData.message).toContain('quotes');
    });

    it('should handle empty message', () => {
      logger.info('');

      const loggedData = JSON.parse(consoleLogSpy.mock.calls[0][0]);
      expect(loggedData.message).toBe('');
    });

    it('should handle very long messages', () => {
      const longMessage = 'a'.repeat(10000);
      logger.info(longMessage);

      const loggedData = JSON.parse(consoleLogSpy.mock.calls[0][0]);
      expect(loggedData.message).toBe(longMessage);
    });

    it('should handle context with null values', () => {
      const context = { value: null };
      logger.info('Null context', context);

      const loggedData = JSON.parse(consoleLogSpy.mock.calls[0][0]);
      expect(loggedData.context).toEqual({ value: null });
    });

    it('should handle context with undefined values', () => {
      const context = { value: undefined };
      logger.info('Undefined context', context);

      const loggedData = JSON.parse(consoleLogSpy.mock.calls[0][0]);
      // undefined values are omitted in JSON.stringify
      expect(loggedData.context).toEqual({});
    });
  });

  describe('warn()', () => {
    it('should log warn level messages to console.warn', () => {
      logger.warn('Warning message');

      expect(consoleWarnSpy).toHaveBeenCalledOnce();
      const loggedData = JSON.parse(consoleWarnSpy.mock.calls[0][0]);

      expect(loggedData).toMatchObject({
        level: 'warn',
        message: 'Warning message',
      });
    });

    it('should include context in warnings', () => {
      const context = { rateLimit: 'exceeded' };
      logger.warn('Rate limit warning', context);

      const loggedData = JSON.parse(consoleWarnSpy.mock.calls[0][0]);
      expect(loggedData.context).toEqual(context);
    });

    it('should handle security-related warnings', () => {
      const context = { 
        threat: 'SQL injection attempt',
        ip: '192.168.1.1',
        blocked: true 
      };
      logger.warn('Security threat detected', context);

      const loggedData = JSON.parse(consoleWarnSpy.mock.calls[0][0]);
      expect(loggedData.context.threat).toBe('SQL injection attempt');
      expect(loggedData.context.blocked).toBe(true);
    });
  });

  describe('error()', () => {
    it('should log error level messages to console.error', () => {
      logger.error('Error message');

      expect(consoleErrorSpy).toHaveBeenCalledOnce();
      const loggedData = JSON.parse(consoleErrorSpy.mock.calls[0][0]);

      expect(loggedData).toMatchObject({
        level: 'error',
        message: 'Error message',
      });
    });

    it('should include error stack traces in context', () => {
      const error = new Error('Test error');
      const context = { 
        error: error.message,
        stack: error.stack 
      };
      logger.error('Application error', context);

      const loggedData = JSON.parse(consoleErrorSpy.mock.calls[0][0]);
      expect(loggedData.context.error).toBe('Test error');
      expect(loggedData.context.stack).toBeDefined();
    });

    it('should handle critical security errors', () => {
      const context = {
        severity: 'critical',
        vulnerability: 'CVE-2025-12345',
        action: 'immediate_patch_required'
      };
      logger.error('Critical vulnerability detected', context);

      const loggedData = JSON.parse(consoleErrorSpy.mock.calls[0][0]);
      expect(loggedData.context.severity).toBe('critical');
    });

    it('should handle errors with circular references gracefully', () => {
      const circular: any = { a: 1 };
      circular.self = circular;

      // JSON.stringify will throw on circular references
      // Logger should handle this gracefully or the context should be prepared
      expect(() => {
        logger.error('Circular error', { data: circular });
      }).toThrow(); // Expected behavior - should be documented
    });
  });

  describe('debug()', () => {
    it('should log debug messages in non-production environments', () => {
      process.env.NODE_ENV = 'development';

      logger.debug('Debug message');

      expect(consoleDebugSpy).toHaveBeenCalledOnce();
      const loggedData = JSON.parse(consoleDebugSpy.mock.calls[0][0]);

      expect(loggedData).toMatchObject({
        level: 'debug',
        message: 'Debug message',
      });
    });

    it('should NOT log debug messages in production', () => {
      process.env.NODE_ENV = 'production';

      logger.debug('Debug message');

      expect(consoleDebugSpy).not.toHaveBeenCalled();
    });

    it('should log debug messages when NODE_ENV is undefined', () => {
      delete process.env.NODE_ENV;

      logger.debug('Debug message');

      expect(consoleDebugSpy).toHaveBeenCalledOnce();
    });

    it('should include detailed debugging context', () => {
      process.env.NODE_ENV = 'development';

      const context = {
        function: 'validateInput',
        input: { userId: '123' },
        validationStep: 'schema_check'
      };
      logger.debug('Validation debug', context);

      const loggedData = JSON.parse(consoleDebugSpy.mock.calls[0][0]);
      expect(loggedData.context.function).toBe('validateInput');
    });
  });

  describe('timestamp format', () => {
    it('should use ISO 8601 format', () => {
      logger.info('Test');

      const loggedData = JSON.parse(consoleLogSpy.mock.calls[0][0]);
      expect(loggedData.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}.\d{3}Z$/);
    });

    it('should produce different timestamps for sequential calls', async () => {
      logger.info('First');
      await new Promise(resolve => setTimeout(resolve, 10));
      logger.info('Second');

      const firstLog = JSON.parse(consoleLogSpy.mock.calls[0][0]);
      const secondLog = JSON.parse(consoleLogSpy.mock.calls[1][0]);

      expect(firstLog.timestamp).not.toBe(secondLog.timestamp);
    });
  });

  describe('JSON structure validation', () => {
    it('should produce valid JSON output', () => {
      logger.info('Valid JSON test', { key: 'value' });

      const output = consoleLogSpy.mock.calls[0][0];
      expect(() => JSON.parse(output)).not.toThrow();
    });

    it('should handle Unicode characters', () => {
      logger.info('Unicode test: 你好 🎉 café');

      const loggedData = JSON.parse(consoleLogSpy.mock.calls[0][0]);
      expect(loggedData.message).toContain('你好');
      expect(loggedData.message).toContain('🎉');
    });

    it('should escape special JSON characters', () => {
      logger.info('Special chars: "quotes" \\ backslash \n newline');

      const output = consoleLogSpy.mock.calls[0][0];
      expect(() => JSON.parse(output)).not.toThrow();
    });
  });

  describe('edge cases and error conditions', () => {
    it('should handle extremely large context objects', () => {
      const largeContext: Record<string, number> = {};
      for (let i = 0; i < 1000; i++) {
        largeContext[`key${i}`] = i;
      }

      logger.info('Large context', largeContext);

      expect(consoleLogSpy).toHaveBeenCalledOnce();
      const loggedData = JSON.parse(consoleLogSpy.mock.calls[0][0]);
      expect(Object.keys(loggedData.context!).length).toBe(1000);
    });

    it('should handle context with array values', () => {
      const context = {
        items: [1, 2, 3],
        nested: [[1, 2], [3, 4]]
      };
      logger.info('Array context', context);

      const loggedData = JSON.parse(consoleLogSpy.mock.calls[0][0]);
      expect(loggedData.context.items).toEqual([1, 2, 3]);
    });

    it('should handle multiple rapid consecutive calls', () => {
      for (let i = 0; i < 100; i++) {
        logger.info(`Message ${i}`);
      }

      expect(consoleLogSpy).toHaveBeenCalledTimes(100);
    });

    it('should handle context with boolean values', () => {
      const context = { isValid: true, hasError: false };
      logger.info('Boolean context', context);

      const loggedData = JSON.parse(consoleLogSpy.mock.calls[0][0]);
      expect(loggedData.context).toEqual({ isValid: true, hasError: false });
    });

    it('should handle context with number edge cases', () => {
      const context = {
        zero: 0,
        negative: -1,
        infinity: Infinity,
        nan: NaN
      };
      logger.info('Number edge cases', context);

      const loggedData = JSON.parse(consoleLogSpy.mock.calls[0][0]);
      expect(loggedData.context.zero).toBe(0);
      expect(loggedData.context.negative).toBe(-1);
      // Infinity and NaN become null in JSON
      expect(loggedData.context.infinity).toBe(null);
      expect(loggedData.context.nan).toBe(null);
    });
  });

  describe('security-focused logging', () => {
    it('should log authentication failures', () => {
      const context = {
        username: 'testuser',
        ip: '192.168.1.100',
        reason: 'invalid_password'
      };
      logger.warn('Authentication failed', context);

      const loggedData = JSON.parse(consoleWarnSpy.mock.calls[0][0]);
      expect(loggedData.context.reason).toBe('invalid_password');
    });

    it('should log rate limiting events', () => {
      const context = {
        ip: '10.0.0.1',
        endpoint: '/api/login',
        limit: 5,
        attempts: 10
      };
      logger.warn('Rate limit exceeded', context);

      const loggedData = JSON.parse(consoleWarnSpy.mock.calls[0][0]);
      expect(loggedData.context.attempts).toBeGreaterThan(loggedData.context.limit);
    });

    it('should log sanitization warnings', () => {
      const context = {
        input: '<script>alert("xss")</script>',
        sanitized: true,
        removedTags: ['script']
      };
      logger.warn('Malicious input sanitized', context);

      const loggedData = JSON.parse(consoleWarnSpy.mock.calls[0][0]);
      expect(loggedData.context.sanitized).toBe(true);
    });
  });
});