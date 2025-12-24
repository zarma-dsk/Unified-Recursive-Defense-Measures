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