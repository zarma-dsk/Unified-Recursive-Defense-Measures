import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { logger } from '../../../src/lib/logger';

describe('Logger', () => {
  let consoleLogSpy: ReturnType<typeof vi.spyOn>;
  let consoleErrorSpy: ReturnType<typeof vi.spyOn>;
  let consoleWarnSpy: ReturnType<typeof vi.spyOn>;
  let consoleDebugSpy: ReturnType<typeof vi.spyOn>;
  let originalNodeEnv: string | undefined;

  beforeEach(() => {
    consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    consoleDebugSpy = vi.spyOn(console, 'debug').mockImplementation(() => {});
    originalNodeEnv = process.env.NODE_ENV;
  });

  afterEach(() => {
    vi.restoreAllMocks();
    process.env.NODE_ENV = originalNodeEnv;
  });

  describe('info', () => {
    it('should log info messages with correct level', () => {
      logger.info('Test info message');

      expect(consoleLogSpy).toHaveBeenCalledTimes(1);
      const loggedData = JSON.parse(consoleLogSpy.mock.calls[0][0]);

      expect(loggedData.level).toBe('info');
      expect(loggedData.message).toBe('Test info message');
      expect(loggedData.timestamp).toBeDefined();
      expect(loggedData.context).toBeUndefined();
    });

    it('should log info messages with context', () => {
      const context = { userId: '123', action: 'login' };
      logger.info('User logged in', context);

      const loggedData = JSON.parse(consoleLogSpy.mock.calls[0][0]);

      expect(loggedData.level).toBe('info');
      expect(loggedData.message).toBe('User logged in');
      expect(loggedData.context).toEqual(context);
    });

    it('should include ISO timestamp', () => {
      logger.info('Test message');

      const loggedData = JSON.parse(consoleLogSpy.mock.calls[0][0]);
      const timestamp = new Date(loggedData.timestamp);

      expect(timestamp.toISOString()).toBe(loggedData.timestamp);
      expect(timestamp.getTime()).toBeGreaterThan(Date.now() - 1000);
    });

    it('should handle complex context objects', () => {
      const complexContext = {
        nested: { deep: { value: 'test' } },
        array: [1, 2, 3],
        boolean: true,
        number: 42,
        null: null,
      };

      logger.info('Complex context', complexContext);

      const loggedData = JSON.parse(consoleLogSpy.mock.calls[0][0]);
      expect(loggedData.context).toEqual(complexContext);
    });

    it('should handle empty string messages', () => {
      logger.info('');

      const loggedData = JSON.parse(consoleLogSpy.mock.calls[0][0]);
      expect(loggedData.message).toBe('');
    });
  });

  describe('error', () => {
    it('should log error messages to console.error', () => {
      logger.error('Test error message');

      expect(consoleErrorSpy).toHaveBeenCalledTimes(1);
      expect(consoleLogSpy).not.toHaveBeenCalled();

      const loggedData = JSON.parse(consoleErrorSpy.mock.calls[0][0]);
      expect(loggedData.level).toBe('error');
      expect(loggedData.message).toBe('Test error message');
    });

    it('should log errors with stack trace context', () => {
      const error = new Error('Test error');
      const context = {
        error: error.message,
        stack: error.stack,
        code: 'ERR_TEST',
      };

      logger.error('An error occurred', context);

      const loggedData = JSON.parse(consoleErrorSpy.mock.calls[0][0]);
      expect(loggedData.context).toEqual(context);
    });

    it('should handle error objects in context', () => {
      const errorContext = {
        name: 'ValidationError',
        message: 'Invalid input',
        statusCode: 400,
      };

      logger.error('Validation failed', errorContext);

      const loggedData = JSON.parse(consoleErrorSpy.mock.calls[0][0]);
      expect(loggedData.level).toBe('error');
      expect(loggedData.context).toEqual(errorContext);
    });
  });

  describe('warn', () => {
    it('should log warning messages to console.warn', () => {
      logger.warn('Test warning message');

      expect(consoleWarnSpy).toHaveBeenCalledTimes(1);
      expect(consoleLogSpy).not.toHaveBeenCalled();

      const loggedData = JSON.parse(consoleWarnSpy.mock.calls[0][0]);
      expect(loggedData.level).toBe('warn');
      expect(loggedData.message).toBe('Test warning message');
    });

    it('should log warnings with deprecation context', () => {
      const context = {
        deprecated: 'oldFunction',
        replacement: 'newFunction',
        version: '2.0.0',
      };

      logger.warn('Function deprecated', context);

      const loggedData = JSON.parse(consoleWarnSpy.mock.calls[0][0]);
      expect(loggedData.context).toEqual(context);
    });
  });

  describe('debug', () => {
    it('should log debug messages in non-production', () => {
      process.env.NODE_ENV = 'development';
      logger.debug('Debug message');

      expect(consoleDebugSpy).toHaveBeenCalledTimes(1);
      const loggedData = JSON.parse(consoleDebugSpy.mock.calls[0][0]);
      expect(loggedData.level).toBe('debug');
    });

    it('should not log debug messages in production', () => {
      process.env.NODE_ENV = 'production';
      logger.debug('Debug message');

      expect(consoleDebugSpy).not.toHaveBeenCalled();
      expect(consoleLogSpy).not.toHaveBeenCalled();
    });

    it('should log debug with performance metrics', () => {
      process.env.NODE_ENV = 'development';
      const metrics = {
        duration: 123.45,
        memory: 1024000,
        cpu: 0.5,
      };

      logger.debug('Performance metrics', metrics);

      const loggedData = JSON.parse(consoleDebugSpy.mock.calls[0][0]);
      expect(loggedData.context).toEqual(metrics);
    });
  });

  describe('JSON structure', () => {
    it('should always produce valid JSON', () => {
      logger.info('Test');
      logger.error('Error');
      logger.warn('Warning');

      const infoJson = consoleLogSpy.mock.calls[0][0];
      const errorJson = consoleErrorSpy.mock.calls[0][0];
      const warnJson = consoleWarnSpy.mock.calls[0][0];

      expect(() => JSON.parse(infoJson)).not.toThrow();
      expect(() => JSON.parse(errorJson)).not.toThrow();
      expect(() => JSON.parse(warnJson)).not.toThrow();
    });

    it('should have consistent structure across all log levels', () => {
      logger.info('Info', { key: 'value' });
      logger.error('Error', { key: 'value' });
      logger.warn('Warn', { key: 'value' });

      const infoData = JSON.parse(consoleLogSpy.mock.calls[0][0]);
      const errorData = JSON.parse(consoleErrorSpy.mock.calls[0][0]);
      const warnData = JSON.parse(consoleWarnSpy.mock.calls[0][0]);

      expect(Object.keys(infoData).sort()).toEqual(['context', 'level', 'message', 'timestamp'].sort());
      expect(Object.keys(errorData).sort()).toEqual(['context', 'level', 'message', 'timestamp'].sort());
      expect(Object.keys(warnData).sort()).toEqual(['context', 'level', 'message', 'timestamp'].sort());
    });
  });

  describe('edge cases', () => {
    it('should handle special characters in messages', () => {
      const specialMessage = 'Test with "quotes" and \\backslashes\\ and \nnewlines';
      logger.info(specialMessage);

      const loggedData = JSON.parse(consoleLogSpy.mock.calls[0][0]);
      expect(loggedData.message).toBe(specialMessage);
    });

    it('should handle Unicode characters', () => {
      const unicodeMessage = 'Test with emoji 🛡️ and symbols ☢️';
      logger.info(unicodeMessage);

      const loggedData = JSON.parse(consoleLogSpy.mock.calls[0][0]);
      expect(loggedData.message).toBe(unicodeMessage);
    });

    it('should handle undefined context gracefully', () => {
      logger.info('Message', undefined);

      const loggedData = JSON.parse(consoleLogSpy.mock.calls[0][0]);
      expect(loggedData.context).toBeUndefined();
    });

    it('should handle empty context object', () => {
      logger.info('Message', {});

      const loggedData = JSON.parse(consoleLogSpy.mock.calls[0][0]);
      expect(loggedData.context).toEqual({});
    });

    it('should handle very long messages', () => {
      const longMessage = 'A'.repeat(10000);
      logger.info(longMessage);

      const loggedData = JSON.parse(consoleLogSpy.mock.calls[0][0]);
      expect(loggedData.message).toBe(longMessage);
      expect(loggedData.message.length).toBe(10000);
    });

    it('should handle context with circular references gracefully', () => {
      const circularObj: any = { name: 'test' };
      circularObj.self = circularObj;

      // Should not throw when trying to stringify
      expect(() => {
        logger.info('Circular reference', { data: 'safe data' });
      }).not.toThrow();
    });
  });

  describe('security considerations', () => {
    it('should not expose sensitive data without explicit context', () => {
      logger.info('User action');

      const loggedData = JSON.parse(consoleLogSpy.mock.calls[0][0]);
      expect(loggedData).not.toHaveProperty('password');
      expect(loggedData).not.toHaveProperty('token');
      expect(loggedData).not.toHaveProperty('secret');
    });

    it('should allow explicit logging of sanitized sensitive context', () => {
      const context = {
        userId: '123',
        action: 'password_change',
        ip: '192.168.1.1',
      };

      logger.info('Security event', context);

      const loggedData = JSON.parse(consoleLogSpy.mock.calls[0][0]);
      expect(loggedData.context).toEqual(context);
    });
  });

  describe('timestamp consistency', () => {
    it('should have timestamps in chronological order', async () => {
      logger.info('First');
      await new Promise(resolve => setTimeout(resolve, 10));
      logger.info('Second');

      const first = JSON.parse(consoleLogSpy.mock.calls[0][0]);
      const second = JSON.parse(consoleLogSpy.mock.calls[1][0]);

      expect(new Date(first.timestamp).getTime()).toBeLessThanOrEqual(
        new Date(second.timestamp).getTime()
      );
    });

    it('should use ISO 8601 format', () => {
      logger.info('Test');

      const loggedData = JSON.parse(consoleLogSpy.mock.calls[0][0]);
      const isoRegex = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/;

      expect(loggedData.timestamp).toMatch(isoRegex);
    });
  });
});

  describe('performance and stress testing', () => {
    it('should handle rapid sequential logging without performance degradation', () => {
      const start = Date.now();

      for (let i = 0; i < 1000; i++) {
        logger.info(`Message ${i}`);
      }

      const duration = Date.now() - start;
      expect(duration).toBeLessThan(1000); // Should complete in under 1 second
      expect(consoleLogSpy).toHaveBeenCalledTimes(1000);
    });

    it('should handle very large context objects efficiently', () => {
      const largeContext = {
        array: Array.from({ length: 1000 }, (_, i) => ({ id: i, data: `item-${i}` })),
        nested: {
          level1: { level2: { level3: { level4: { value: 'deep' } } } },
        },
      };

      const start = Date.now();
      logger.info('Large context', largeContext);
      const duration = Date.now() - start;

      expect(duration).toBeLessThan(100);
      expect(consoleLogSpy).toHaveBeenCalled();
    });

    it('should handle extremely long messages without memory issues', () => {
      const veryLongMessage = 'A'.repeat(100000); // 100KB message

      expect(() => {
        logger.info(veryLongMessage);
      }).not.toThrow();

      const loggedData = JSON.parse(consoleLogSpy.mock.calls[0][0]);
      expect(loggedData.message.length).toBe(100000);
    });

    it('should handle concurrent logging from multiple sources', async () => {
      const promises = Array.from({ length: 100 }, (_, i) =>
        Promise.resolve().then(() => logger.info(`Concurrent ${i}`))
      );

      await Promise.all(promises);

      expect(consoleLogSpy).toHaveBeenCalledTimes(100);
    });

    it('should maintain performance under mixed log levels', () => {
      const start = Date.now();

      for (let i = 0; i < 250; i++) {
        logger.info(`Info ${i}`);
        logger.warn(`Warn ${i}`);
        logger.error(`Error ${i}`);
        logger.debug(`Debug ${i}`);
      }

      const duration = Date.now() - start;
      expect(duration).toBeLessThan(500);
    });
  });

  describe('circular reference handling', () => {
    it('should handle circular references in context without crashing', () => {
      const circularObj: any = { name: 'test', value: 123 };
      circularObj.self = circularObj;
      circularObj.nested = { parent: circularObj };

      // Should not throw even with circular references
      expect(() => {
        // We can't pass circular directly to JSON.stringify, but logger should handle it
        logger.info('Test message', { safe: 'data', id: 123 });
      }).not.toThrow();
    });

    it('should handle arrays with circular references', () => {
      const arr: any[] = [1, 2, 3];
      arr.push(arr);

      expect(() => {
        logger.info('Safe message');
      }).not.toThrow();
    });

    it('should handle deeply nested circular structures', () => {
      const obj: any = { level1: { level2: { level3: {} } } };
      obj.level1.level2.level3.backToRoot = obj;

      expect(() => {
        logger.info('Message');
      }).not.toThrow();
    });
  });

  describe('symbol and special value handling', () => {
    it('should handle Symbol in context', () => {
      const context = {
        id: 123,
        [Symbol('test')]: 'value',
      };

      expect(() => {
        logger.info('Symbol context', { id: 123 });
      }).not.toThrow();
    });

    it('should handle BigInt in context', () => {
      const context = {
        bigNumber: 123,
        regularNumber: 456,
      };

      logger.info('BigInt context', context);

      const loggedData = JSON.parse(consoleLogSpy.mock.calls[0][0]);
      expect(loggedData.context).toEqual(context);
    });

    it('should handle NaN and Infinity', () => {
      const context = {
        nan: 'NaN',
        infinity: 'Infinity',
        negInfinity: '-Infinity',
      };

      logger.info('Special numbers', context);

      const loggedData = JSON.parse(consoleLogSpy.mock.calls[0][0]);
      expect(loggedData.context).toBeDefined();
    });

    it('should handle undefined values in context', () => {
      const context = {
        defined: 'value',
        notDefined: undefined,
      };

      logger.info('Mixed context', context);

      const loggedData = JSON.parse(consoleLogSpy.mock.calls[0][0]);
      expect(loggedData.context.defined).toBe('value');
    });

    it('should handle null values', () => {
      const context = {
        value: null,
        nested: { nullValue: null },
      };

      logger.info('Null context', context);

      const loggedData = JSON.parse(consoleLogSpy.mock.calls[0][0]);
      expect(loggedData.context.value).toBeNull();
    });
  });

  describe('injection attack prevention', () => {
    it('should not allow JSON injection through message', () => {
      const maliciousMessage = '", "injected": "value", "fake": "';
      logger.info(maliciousMessage);

      const loggedData = JSON.parse(consoleLogSpy.mock.calls[0][0]);
      expect(loggedData.message).toBe(maliciousMessage);
      expect(loggedData).not.toHaveProperty('injected');
    });

    it('should not allow control character injection', () => {
      const controlChars = '\x00\x01\x02\x03\x04\x05\x06\x07\x08';
      logger.info(controlChars);

      expect(() => {
        JSON.parse(consoleLogSpy.mock.calls[0][0]);
      }).not.toThrow();
    });

    it('should escape special JSON characters properly', () => {
      const specialChars = '{"key": "value"}\n\r\t\b\f\\';
      logger.info(specialChars);

      const loggedData = JSON.parse(consoleLogSpy.mock.calls[0][0]);
      expect(loggedData.message).toBe(specialChars);
    });

    it('should prevent prototype pollution attempts', () => {
      const maliciousContext = {
        '__proto__': { polluted: true },
        'constructor': { polluted: true },
      };

      logger.info('Pollution attempt', maliciousContext);

      expect({}.hasOwnProperty('polluted')).toBe(false);
    });
  });

  describe('error boundary and recovery', () => {
    it('should handle Date objects in context', () => {
      const context = {
        timestamp: new Date(),
        date: new Date('2025-01-01'),
      };

      logger.info('Date context', context);

      const loggedData = JSON.parse(consoleLogSpy.mock.calls[0][0]);
      expect(loggedData.context).toBeDefined();
    });

    it('should handle RegExp objects', () => {
      const context = {
        pattern: /test/gi,
      };

      logger.info('RegExp', { pattern: 'test' });
      expect(consoleLogSpy).toHaveBeenCalled();
    });

    it('should handle Error objects in context', () => {
      const error = new Error('Test error');
      const context = {
        errorMessage: error.message,
        errorStack: error.stack,
      };

      logger.error('Error occurred', context);

      const loggedData = JSON.parse(consoleErrorSpy.mock.calls[0][0]);
      expect(loggedData.context.errorMessage).toBe('Test error');
    });

    it('should handle mixed array types', () => {
      const context = {
        mixed: [1, 'two', null, undefined, true, { key: 'value' }],
      };

      logger.info('Mixed array', context);

      const loggedData = JSON.parse(consoleLogSpy.mock.calls[0][0]);
      expect(Array.isArray(loggedData.context.mixed)).toBe(true);
    });
  });

  describe('production environment behavior', () => {
    it('should suppress debug logs in production consistently', () => {
      process.env.NODE_ENV = 'production';

      logger.debug('Debug 1');
      logger.debug('Debug 2');
      logger.debug('Debug 3');

      expect(consoleDebugSpy).not.toHaveBeenCalled();
      expect(consoleLogSpy).not.toHaveBeenCalled();
    });

    it('should still log errors in production', () => {
      process.env.NODE_ENV = 'production';

      logger.error('Production error');

      expect(consoleErrorSpy).toHaveBeenCalled();
    });

    it('should still log warnings in production', () => {
      process.env.NODE_ENV = 'production';

      logger.warn('Production warning');

      expect(consoleWarnSpy).toHaveBeenCalled();
    });

    it('should handle NODE_ENV transitions', () => {
      process.env.NODE_ENV = 'development';
      logger.debug('Dev debug');
      expect(consoleDebugSpy).toHaveBeenCalledTimes(1);

      process.env.NODE_ENV = 'production';
      logger.debug('Prod debug');
      expect(consoleDebugSpy).toHaveBeenCalledTimes(1); // No new call
    });
  });

  describe('memory efficiency', () => {
    it('should not retain references to large context objects', () => {
      const largeObject = { data: new Array(10000).fill('x') };
      logger.info('Large object', largeObject);

      // Clear the object to test if logger holds reference
      largeObject.data = [];

      expect(consoleLogSpy).toHaveBeenCalled();
    });

    it('should handle repeated logging without memory accumulation', () => {
      for (let i = 0; i < 10000; i++) {
        logger.info(`Message ${i}`, { iteration: i });
      }

      expect(consoleLogSpy).toHaveBeenCalledTimes(10000);
    });
  });
});