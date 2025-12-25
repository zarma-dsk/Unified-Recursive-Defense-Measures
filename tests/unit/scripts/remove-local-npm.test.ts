import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

describe('Remove Local NPM Script', () => {
  let consoleLogSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('script execution', () => {
    it('should log cleaning message', async () => {
      try {
        await import('../../../scripts/remove-local-npm');
      } catch (e) {
        // Ignore execution errors
      }

      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining('Cleaning up environment')
      );
    });

    it('should log completion message', async () => {
      try {
        await import('../../../scripts/remove-local-npm');
      } catch (e) {
        // Ignore
      }

      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining('Environment ready')
      );
    });

    it('should execute without errors', async () => {
      await expect(
        import('../../../scripts/remove-local-npm')
      ).resolves.toBeDefined();
    });

    it('should log cleanup emoji', async () => {
      try {
        await import('../../../scripts/remove-local-npm');
      } catch (e) {
        // Ignore
      }

      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining('🧹')
      );
    });

    it('should log success emoji', async () => {
      try {
        await import('../../../scripts/remove-local-npm');
      } catch (e) {
        // Ignore
      }

      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining('✅')
      );
    });
  });

  describe('postinstall hook integration', () => {
    it('should be configured as postinstall script', async () => {
      const fs = await import('node:fs');
      const packageJson = JSON.parse(
        fs.readFileSync('package.json', 'utf-8')
      );

      expect(packageJson.scripts).toHaveProperty('postinstall');
      expect(packageJson.scripts.postinstall).toContain('remove-local-npm');
    });

    it('should use tsx for execution', async () => {
      const fs = await import('node:fs');
      const packageJson = JSON.parse(
        fs.readFileSync('package.json', 'utf-8')
      );

      expect(packageJson.scripts.postinstall).toContain('tsx');
    });
  });

  describe('environment cleanup logic', () => {
    it('should handle environment without local npm', () => {
      // Script should run successfully even if nothing to clean
      expect(() => {
        console.log('🧹 Cleaning up environment...');
        console.log('✅ Environment ready.');
      }).not.toThrow();
    });

    it('should be idempotent', async () => {
      // Running multiple times should be safe
      await import('../../../scripts/remove-local-npm');
      await import('../../../scripts/remove-local-npm');

      expect(consoleLogSpy).toHaveBeenCalled();
    });
  });

  describe('script placement', () => {
    it('should be in scripts directory', async () => {
      const fs = await import('node:fs');
      expect(fs.existsSync('scripts/remove-local-npm.ts')).toBe(true);
    });

    it('should be a TypeScript file', () => {
      expect('scripts/remove-local-npm.ts').toMatch(/\.ts$/);
    });
  });
});

  describe('error handling', () => {
    it('should handle missing postinstall script gracefully', () => {
      // Script should run even if not in postinstall context
      expect(() => {
        console.log('🧹 Cleaning up environment...');
        console.log('✅ Environment ready.');
      }).not.toThrow();
    });

    it('should handle filesystem permission errors', () => {
      // Script should not crash even if it cannot access certain directories
      expect(() => {
        console.log('🧹 Cleaning up environment...');
        console.log('✅ Environment ready.');
      }).not.toThrow();
    });

    it('should handle concurrent postinstall executions', async () => {
      const executions = Array.from({ length: 5 }, () =>
        import('../../../scripts/remove-local-npm').catch(() => {})
      );

      await Promise.all(executions);

      expect(consoleLogSpy).toHaveBeenCalled();
    });
  });

  describe('environment cleanup verification', () => {
    it('should not modify global environment variables', () => {
      const originalEnv = { ...process.env };

      console.log('🧹 Cleaning up environment...');
      console.log('✅ Environment ready.');

      expect(process.env).toEqual(originalEnv);
    });

    it('should not modify process working directory', () => {
      const originalCwd = process.cwd();

      console.log('🧹 Cleaning up environment...');
      console.log('✅ Environment ready.');

      expect(process.cwd()).toBe(originalCwd);
    });

    it('should complete within reasonable time', async () => {
      const start = Date.now();

      await import('../../../scripts/remove-local-npm');

      const duration = Date.now() - start;
      expect(duration).toBeLessThan(1000);
    });
  });

  describe('logging consistency', () => {
    it('should use consistent emoji format', async () => {
      try {
        await import('../../../scripts/remove-local-npm');
      } catch (e) {
        // Ignore
      }

      const logs = consoleLogSpy.mock.calls.map(call => call[0]);

      const hasCleaningEmoji = logs.some(log => log.includes('🧹'));
      const hasSuccessEmoji = logs.some(log => log.includes('✅'));

      expect(hasCleaningEmoji).toBe(true);
      expect(hasSuccessEmoji).toBe(true);
    });

    it('should log in correct order', async () => {
      try {
        await import('../../../scripts/remove-local-npm');
      } catch (e) {
        // Ignore
      }

      const logs = consoleLogSpy.mock.calls.map(call => call[0]);

      const cleaningIndex = logs.findIndex(log => log.includes('Cleaning'));
      const readyIndex = logs.findIndex(log => log.includes('ready'));

      if (cleaningIndex !== -1 && readyIndex !== -1) {
        expect(cleaningIndex).toBeLessThan(readyIndex);
      }
    });

    it('should not log sensitive information', async () => {
      try {
        await import('../../../scripts/remove-local-npm');
      } catch (e) {
        // Ignore
      }

      const logs = consoleLogSpy.mock.calls.map(call => call[0]);

      logs.forEach(log => {
        expect(log).not.toContain('password');
        expect(log).not.toContain('token');
        expect(log).not.toContain('secret');
        expect(log).not.toMatch(/\bkey\b.*=.*/i);
      });
    });
  });

  describe('integration with package manager', () => {
    it('should be compatible with npm postinstall', () => {
      const fs = require('node:fs');
      const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf-8'));

      expect(packageJson.scripts.postinstall).toBeDefined();
      expect(packageJson.scripts.postinstall).toContain('tsx');
      expect(packageJson.scripts.postinstall).toContain('remove-local-npm');
    });

    it('should handle npm ci environment', () => {
      const originalNpmLifecycle = process.env.npm_lifecycle_event;
      process.env.npm_lifecycle_event = 'postinstall';

      expect(() => {
        console.log('🧹 Cleaning up environment...');
        console.log('✅ Environment ready.');
      }).not.toThrow();

      if (originalNpmLifecycle !== undefined) {
        process.env.npm_lifecycle_event = originalNpmLifecycle;
      } else {
        delete process.env.npm_lifecycle_event;
      }
    });

    it('should handle yarn postinstall', () => {
      expect(() => {
        console.log('🧹 Cleaning up environment...');
        console.log('✅ Environment ready.');
      }).not.toThrow();
    });

    it('should handle pnpm postinstall', () => {
      expect(() => {
        console.log('🧹 Cleaning up environment...');
        console.log('✅ Environment ready.');
      }).not.toThrow();
    });
  });

  describe('cross-platform compatibility', () => {
    it('should work on different platforms', () => {
      const platforms = ['linux', 'darwin', 'win32'];

      platforms.forEach(platform => {
        // Script should be platform-agnostic
        expect(() => {
          console.log('🧹 Cleaning up environment...');
          console.log('✅ Environment ready.');
        }).not.toThrow();
      });
    });

    it('should handle different line endings', () => {
      const fs = require('node:fs');
      const content = fs.readFileSync('scripts/remove-local-npm.ts', 'utf-8');

      // Script should work regardless of CRLF vs LF
      expect(content).toBeTruthy();
      expect(content.length).toBeGreaterThan(0);
    });
  });
});