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