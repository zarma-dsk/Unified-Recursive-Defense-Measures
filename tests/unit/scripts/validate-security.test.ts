import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';

// Mock the fs module
vi.mock('node:fs');
vi.mock('node:path');

describe('validate-security script', () => {
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

  describe('required files check', () => {
    const requiredFiles = [
      'src/lib/sanitize.ts',
      'src/lib/rate-limit.ts',
      'src/lib/logger.ts',
      '.github/workflows/ci.yml'
    ];

    it('should pass when all required files exist', async () => {
      vi.mocked(fs.existsSync).mockReturnValue(true);

      await import('../../../scripts/validate-security');

      requiredFiles.forEach(file => {
        expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining(`✅ Found: ${file}`));
      });

      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('All security checks passed'));
      expect(processExitSpy).not.toHaveBeenCalled();
    });

    it('should fail when sanitize.ts is missing', async () => {
      vi.mocked(fs.existsSync).mockImplementation((filepath) => {
        return filepath !== 'src/lib/sanitize.ts';
      });

      try {
        await import('../../../scripts/validate-security');
      } catch (error: any) {
        expect(error.message).toContain('Process.exit called with code 1');
      }

      expect(consoleErrorSpy).toHaveBeenCalledWith(expect.stringContaining('Missing required security file: src/lib/sanitize.ts'));
      expect(processExitSpy).toHaveBeenCalledWith(1);
    });

    it('should fail when rate-limit.ts is missing', async () => {
      vi.mocked(fs.existsSync).mockImplementation((filepath) => {
        return filepath !== 'src/lib/rate-limit.ts';
      });

      try {
        await import('../../../scripts/validate-security');
      } catch (error: any) {
        expect(error.message).toContain('Process.exit called with code 1');
      }

      expect(consoleErrorSpy).toHaveBeenCalledWith(expect.stringContaining('Missing required security file: src/lib/rate-limit.ts'));
    });

    it('should fail when logger.ts is missing', async () => {
      vi.mocked(fs.existsSync).mockImplementation((filepath) => {
        return filepath !== 'src/lib/logger.ts';
      });

      try {
        await import('../../../scripts/validate-security');
      } catch (error: any) {
        expect(error.message).toContain('Process.exit called with code 1');
      }

      expect(consoleErrorSpy).toHaveBeenCalledWith(expect.stringContaining('Missing required security file: src/lib/logger.ts'));
    });

    it('should fail when ci.yml is missing', async () => {
      vi.mocked(fs.existsSync).mockImplementation((filepath) => {
        return filepath !== '.github/workflows/ci.yml';
      });

      try {
        await import('../../../scripts/validate-security');
      } catch (error: any) {
        expect(error.message).toContain('Process.exit called with code 1');
      }

      expect(consoleErrorSpy).toHaveBeenCalledWith(expect.stringContaining('Missing required security file: .github/workflows/ci.yml'));
    });

    it('should fail when multiple files are missing', async () => {
      vi.mocked(fs.existsSync).mockImplementation((filepath) => {
        return !['src/lib/sanitize.ts', 'src/lib/logger.ts'].includes(filepath as string);
      });

      try {
        await import('../../../scripts/validate-security');
      } catch (error: any) {
        expect(error.message).toContain('Process.exit called with code 1');
      }

      expect(consoleErrorSpy).toHaveBeenCalledWith(expect.stringContaining('sanitize.ts'));
      expect(consoleErrorSpy).toHaveBeenCalledWith(expect.stringContaining('logger.ts'));
    });
  });

  describe('console output', () => {
    it('should display start message', async () => {
      vi.mocked(fs.existsSync).mockReturnValue(true);

      await import('../../../scripts/validate-security');

      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('🛡️'));
      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('Starting Antigravity Security Validation'));
    });

    it('should display checking message', async () => {
      vi.mocked(fs.existsSync).mockReturnValue(true);

      await import('../../../scripts/validate-security');

      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('🔍'));
      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('Checking for required security files'));
    });

    it('should display success message when all checks pass', async () => {
      vi.mocked(fs.existsSync).mockReturnValue(true);

      await import('../../../scripts/validate-security');

      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('✅ All security checks passed'));
    });

    it('should display failure message when checks fail', async () => {
      vi.mocked(fs.existsSync).mockReturnValue(false);

      try {
        await import('../../../scripts/validate-security');
      } catch (error) {
        // Expected
      }

      expect(consoleErrorSpy).toHaveBeenCalledWith(expect.stringContaining('Security validation failed'));
      expect(consoleErrorSpy).toHaveBeenCalledWith(expect.stringContaining('Missing critical files'));
    });
  });
});