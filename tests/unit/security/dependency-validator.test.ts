import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import fs from 'node:fs';

// Mock the fs module
vi.mock('node:fs');

describe('dependency-validator', () => {
  let consoleLogSpy: ReturnType<typeof vi.spyOn>;
  let consoleErrorSpy: ReturnType<typeof vi.spyOn>;
  let processExitSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    processExitSpy = vi.spyOn(process, 'exit').mockImplementation((code) => {
      throw new Error(`Process.exit called with code ${code}`);
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
    vi.resetModules();
  });

  describe('package.json validation', () => {
    it('should pass when package.json exists', async () => {
      vi.mocked(fs.existsSync).mockReturnValue(true);

      // Import and run the validator
      await import('../../../src/security/dependency-validator');

      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('Vetting dependencies'));
      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('✅'));
      expect(processExitSpy).not.toHaveBeenCalled();
    });

    it('should fail when package.json does not exist', async () => {
      vi.mocked(fs.existsSync).mockReturnValue(false);

      try {
        await import('../../../src/security/dependency-validator');
      } catch (error: any) {
        expect(error.message).toContain('Process.exit called with code 1');
      }

      expect(consoleErrorSpy).toHaveBeenCalledWith(expect.stringContaining('package.json not found'));
      expect(processExitSpy).toHaveBeenCalledWith(1);
    });
  });

  describe('console output', () => {
    it('should log start message', async () => {
      vi.mocked(fs.existsSync).mockReturnValue(true);

      await import('../../../src/security/dependency-validator');

      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('🔍'));
      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('Vetting dependencies'));
    });

    it('should log success message', async () => {
      vi.mocked(fs.existsSync).mockReturnValue(true);

      await import('../../../src/security/dependency-validator');

      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('✅'));
      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('complete'));
    });
  });
});