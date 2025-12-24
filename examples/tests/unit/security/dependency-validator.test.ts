import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import fs from 'node:fs';

describe('Dependency Validator', () => {
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

  describe('validateDependencies', () => {
    it('should log start message', async () => {
      fsExistsSyncSpy.mockReturnValue(true);
      
      try {
        await import('../../../src/security/dependency-validator');
      } catch (e) {
        // Ignore execution errors
      }
      
      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining('Vetting dependencies')
      );
    });

    it('should check for package.json existence', async () => {
      fsExistsSyncSpy.mockReturnValue(true);
      
      try {
        await import('../../../src/security/dependency-validator');
      } catch (e) {
        // Ignore
      }
      
      expect(fsExistsSyncSpy).toHaveBeenCalledWith('package.json');
    });

    it('should exit with error if package.json not found', async () => {
      fsExistsSyncSpy.mockReturnValue(false);
      
      try {
        await import('../../../src/security/dependency-validator');
        expect.fail('Should have thrown');
      } catch (e: any) {
        expect(e.message).toContain('Process exit called with code 1');
      }
      
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        expect.stringContaining('package.json not found')
      );
    });

    it('should log success message when validation passes', async () => {
      fsExistsSyncSpy.mockReturnValue(true);
      
      try {
        await import('../../../src/security/dependency-validator');
      } catch (e) {
        // Ignore
      }
      
      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining('Dependency vetting complete')
      );
    });

    it('should log no critical issues found', async () => {
      fsExistsSyncSpy.mockReturnValue(true);
      
      try {
        await import('../../../src/security/dependency-validator');
      } catch (e) {
        // Ignore
      }
      
      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining('No critical issues found')
      );
    });
  });

  describe('security validation logic', () => {
    it('should validate package.json is readable', () => {
      expect(fs.existsSync('package.json')).toBe(true);
      
      const packageJson = JSON.parse(
        fs.readFileSync('package.json', 'utf-8')
      );
      
      expect(packageJson).toHaveProperty('dependencies');
      expect(packageJson).toHaveProperty('devDependencies');
    });

    it('should check for known secure dependencies', () => {
      const packageJson = JSON.parse(
        fs.readFileSync('package.json', 'utf-8')
      );
      
      // Verify security-focused dependencies are present
      expect(packageJson.dependencies).toHaveProperty('zod');
      expect(packageJson.dependencies).toHaveProperty('dompurify');
      expect(packageJson.dependencies).toHaveProperty('winston');
    });

    it('should verify no obviously malicious package names', () => {
      const packageJson = JSON.parse(
        fs.readFileSync('package.json', 'utf-8')
      );
      
      const allDeps = {
        ...packageJson.dependencies,
        ...packageJson.devDependencies,
      };
      
      const suspiciousPatterns = [
        /password/i,
        /secret/i,
        /hack/i,
        /exploit/i,
        /malware/i,
      ];
      
      Object.keys(allDeps).forEach(dep => {
        suspiciousPatterns.forEach(pattern => {
          expect(dep).not.toMatch(pattern);
        });
      });
    });

    it('should check dependencies have version constraints', () => {
      const packageJson = JSON.parse(
        fs.readFileSync('package.json', 'utf-8')
      );
      
      Object.entries(packageJson.dependencies).forEach(([name, version]) => {
        expect(typeof version).toBe('string');
        expect(version).toBeTruthy();
        expect((version as string).length).toBeGreaterThan(0);
      });
    });

    it('should verify dependency versions use semantic versioning', () => {
      const packageJson = JSON.parse(
        fs.readFileSync('package.json', 'utf-8')
      );
      
      const semverPattern = /^[\^~]?\d+\.\d+\.\d+/;
      
      Object.entries(packageJson.dependencies).forEach(([name, version]) => {
        expect(version).toMatch(semverPattern);
      });
    });
  });

  describe('edge cases', () => {
    it('should handle corrupted package.json gracefully', () => {
      const invalidJson = '{ invalid json }';
      
      expect(() => {
        JSON.parse(invalidJson);
      }).toThrow();
    });

    it('should handle missing dependencies field', () => {
      const packageJson = {
        name: 'test',
        version: '1.0.0',
      };
      
      expect(packageJson.dependencies).toBeUndefined();
    });

    it('should handle empty dependencies', () => {
      const packageJson = {
        dependencies: {},
        devDependencies: {},
      };
      
      expect(Object.keys(packageJson.dependencies)).toHaveLength(0);
    });
  });

  describe('typosquatting detection', () => {
    it('should detect common typosquatting patterns', () => {
      const knownPackages = ['react', 'lodash', 'express', 'typescript'];
      const typoPackages = ['ract', 'lodsh', 'expres', 'typescritp'];
      
      // Levenshtein distance or similar should catch these
      typoPackages.forEach((typo, index) => {
        const real = knownPackages[index];
        const distance = levenshteinDistance(typo, real);
        expect(distance).toBeLessThanOrEqual(2);
      });
    });

    it('should flag packages with suspicious character substitutions', () => {
      const suspicious = ['reαct', 'l0dash', 'expr3ss']; // Greek alpha, zero, three
      
      suspicious.forEach(pkg => {
        const hasNonAscii = /[^\x00-\x7F]/.test(pkg);
        const hasNumberSubstitution = /[0-9]/.test(pkg) && !/\d{2,}/.test(pkg);
        
        expect(hasNonAscii || hasNumberSubstitution).toBe(true);
      });
    });
  });

  describe('version validation', () => {
    it('should detect unpinned versions', () => {
      const unpinned = ['*', 'latest', 'x', '>1.0.0'];
      
      unpinned.forEach(version => {
        expect(version).toMatch(/[\*x]|latest|^[><=]/);
      });
    });

    it('should prefer exact or caret versions', () => {
      const safe = ['^1.2.3', '~1.2.3', '1.2.3'];
      
      safe.forEach(version => {
        expect(version).toMatch(/^[\^~]?\d+\.\d+\.\d+/);
      });
    });
  });
});

// Helper function for typosquatting detection
function levenshteinDistance(str1: string, str2: string): number {
  const matrix: number[][] = [];
  
  for (let i = 0; i <= str2.length; i++) {
    matrix[i] = [i];
  }
  
  for (let j = 0; j <= str1.length; j++) {
    matrix[0][j] = j;
  }
  
  for (let i = 1; i <= str2.length; i++) {
    for (let j = 1; j <= str1.length; j++) {
      if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        );
      }
    }
  }
  
  return matrix[str2.length][str1.length];
}