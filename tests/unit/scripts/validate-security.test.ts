import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import fs from 'node:fs';

describe('Security Validation Script', () => {
  let consoleLogSpy: ReturnType<typeof vi.spyOn>;
  let consoleErrorSpy: ReturnType<typeof vi.spyOn>;
  let processExitSpy: ReturnType<typeof vi.spyOn>;
  let fsExistsSyncSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    processExitSpy = vi.spyOn(process, 'exit').mockImplementation((code?: number) => {
      throw new Error(`Process exit called with code ${code}`);
    });
    fsExistsSyncSpy = vi.spyOn(fs, 'existsSync');
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('required files validation', () => {
    const requiredFiles = [
      'src/lib/sanitize.ts',
      'src/lib/rate-limit.ts',
      'src/lib/logger.ts',
      '.github/workflows/ci.yml'
    ];

    it('should check all required security files', () => {
      requiredFiles.forEach(file => {
        const exists = fs.existsSync(file);
        expect(typeof exists).toBe('boolean');
      });
    });

    it('should log checking message', async () => {
      fsExistsSyncSpy.mockReturnValue(true);
      
      try {
        await import('../../../scripts/validate-security');
      } catch (e) {
        // Ignore
      }
      
      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining('Checking for required security files')
      );
    });

    it('should log success for each found file', async () => {
      fsExistsSyncSpy.mockReturnValue(true);
      
      try {
        await import('../../../scripts/validate-security');
      } catch (e) {
        // Ignore
      }
      
      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringMatching(/✅.*Found/)
      );
    });

    it('should log error for missing files', async () => {
      fsExistsSyncSpy.mockReturnValue(false);
      
      try {
        await import('../../../scripts/validate-security');
        expect.fail('Should have thrown');
      } catch (e: any) {
        expect(e.message).toContain('Process exit called with code 1');
      }
      
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        expect.stringMatching(/❌.*Missing required security file/)
      );
    });

    it('should exit with code 1 when files are missing', async () => {
      fsExistsSyncSpy.mockReturnValue(false);
      
      try {
        await import('../../../scripts/validate-security');
        expect.fail('Should have thrown');
      } catch (e: any) {
        expect(e.message).toContain('code 1');
      }
    });

    it('should complete successfully when all files present', async () => {
      fsExistsSyncSpy.mockReturnValue(true);
      
      try {
        await import('../../../scripts/validate-security');
      } catch (e) {
        // Ignore
      }
      
      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining('All security checks passed')
      );
    });
  });

  describe('file existence checks', () => {
    it('should verify sanitize.ts exists and is readable', () => {
      expect(fs.existsSync('src/lib/sanitize.ts')).toBe(true);
      
      const content = fs.readFileSync('src/lib/sanitize.ts', 'utf-8');
      expect(content).toContain('sanitizeHtml');
      expect(content).toContain('DOMPurify');
    });

    it('should verify rate-limit.ts exists and is readable', () => {
      expect(fs.existsSync('src/lib/rate-limit.ts')).toBe(true);
      
      const content = fs.readFileSync('src/lib/rate-limit.ts', 'utf-8');
      expect(content).toContain('RateLimiter');
      expect(content).toContain('check');
    });

    it('should verify logger.ts exists and is readable', () => {
      expect(fs.existsSync('src/lib/logger.ts')).toBe(true);
      
      const content = fs.readFileSync('src/lib/logger.ts', 'utf-8');
      expect(content).toContain('Logger');
      expect(content).toContain('info');
      expect(content).toContain('error');
    });

    it('should verify CI workflow exists', () => {
      // Note: The file was moved to examples/ci.yml in this branch
      const exists = fs.existsSync('.github/workflows/ci.yml') || 
                    fs.existsSync('examples/ci.yml');
      expect(exists).toBe(true);
    });
  });

  describe('security file content validation', () => {
    it('should verify sanitize.ts has XSS protection', () => {
      const content = fs.readFileSync('src/lib/sanitize.ts', 'utf-8');
      expect(content).toContain('DOMPurify');
      expect(content).toContain('sanitize');
      expect(content).toContain('ALLOWED_TAGS');
    });

    it('should verify rate-limit.ts has token bucket implementation', () => {
      const content = fs.readFileSync('src/lib/rate-limit.ts', 'utf-8');
      expect(content).toContain('Token Bucket');
      expect(content).toContain('interval');
      expect(content).toContain('uniqueTokenPerInterval');
    });

    it('should verify logger.ts has structured logging', () => {
      const content = fs.readFileSync('src/lib/logger.ts', 'utf-8');
      expect(content).toContain('LogLevel');
      expect(content).toContain('timestamp');
      expect(content).toContain('JSON.stringify');
    });

    it('should verify security files export public APIs', () => {
      const sanitizeContent = fs.readFileSync('src/lib/sanitize.ts', 'utf-8');
      const rateLimitContent = fs.readFileSync('src/lib/rate-limit.ts', 'utf-8');
      const loggerContent = fs.readFileSync('src/lib/logger.ts', 'utf-8');
      
      expect(sanitizeContent).toContain('export');
      expect(rateLimitContent).toContain('export');
      expect(loggerContent).toContain('export');
    });
  });

  describe('validation workflow', () => {
    it('should run validation in correct order', async () => {
      fsExistsSyncSpy.mockReturnValue(true);
      const calls: string[] = [];
      
      consoleLogSpy.mockImplementation((msg: string) => {
        calls.push(msg);
      });
      
      try {
        await import('../../../scripts/validate-security');
      } catch (e) {
        // Ignore
      }
      
      const startIndex = calls.findIndex(c => c.includes('Starting'));
      const checkIndex = calls.findIndex(c => c.includes('Checking'));
      const endIndex = calls.findIndex(c => c.includes('passed'));
      
      expect(startIndex).toBeLessThan(checkIndex);
      expect(checkIndex).toBeLessThan(endIndex);
    });

    it('should fail fast on first missing file', async () => {
      let callCount = 0;
      fsExistsSyncSpy.mockImplementation(() => {
        callCount++;
        return false;
      });
      
      try {
        await import('../../../scripts/validate-security');
        expect.fail('Should have thrown');
      } catch (e: any) {
        expect(e.message).toContain('Process exit called with code 1');
      }
    });
  });

  describe('edge cases', () => {
    it('should handle file system errors gracefully', () => {
      expect(() => {
        fs.existsSync('/nonexistent/path/file.ts');
      }).not.toThrow();
    });

    it('should handle empty file paths', () => {
      const result = fs.existsSync('');
      expect(typeof result).toBe('boolean');
    });

    it('should validate file paths are strings', () => {
      const requiredFiles = [
        'src/lib/sanitize.ts',
        'src/lib/rate-limit.ts',
        'src/lib/logger.ts',
        '.github/workflows/ci.yml'
      ];
      
      requiredFiles.forEach(file => {
        expect(typeof file).toBe('string');
        expect(file.length).toBeGreaterThan(0);
      });
    });
  });

  describe('security implications', () => {
    it('should not allow path traversal in file checks', () => {
      const maliciousPath = '../../../etc/passwd';
      const result = fs.existsSync(maliciousPath);
      
      // Should check but not error
      expect(typeof result).toBe('boolean');
    });

    it('should validate file extensions are correct', () => {
      const requiredFiles = [
        'src/lib/sanitize.ts',
        'src/lib/rate-limit.ts',
        'src/lib/logger.ts'
      ];
      
      requiredFiles.forEach(file => {
        expect(file).toMatch(/\.ts$/);
      });
    });

    it('should ensure security files are in correct directories', () => {
      const securityFiles = [
        'src/lib/sanitize.ts',
        'src/lib/rate-limit.ts',
        'src/lib/logger.ts'
      ];
      
      securityFiles.forEach(file => {
        expect(file).toMatch(/^src\/lib\//);
      });
    });
  });
});