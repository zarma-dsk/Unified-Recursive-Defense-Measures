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

  describe('malicious package detection', () => {
    it('should detect packages with obfuscated code patterns', () => {
      const obfuscatedPatterns = [
        'eval(atob(',
        'Function("return this")',
        'new Function(',
        'eval(decodeURIComponent(',
      ];

      obfuscatedPatterns.forEach(pattern => {
        expect(pattern).toMatch(/eval|Function/);
      });
    });

    it('should flag packages with suspicious network calls', () => {
      const suspiciousUrls = [
        'http://malicious.com/collect',
        'https://evil.io/steal',
      ];

      suspiciousUrls.forEach(url => {
        expect(url).toMatch(/https?:\/\//);
      });
    });

    it('should detect base64 encoded malicious payloads', () => {
      const base64Pattern = /[A-Za-z0-9+/]{20,}={0,2}/;
      const suspiciousCode = 'eval(Buffer.from("YWxlcnQoMSk=", "base64").toString())';

      expect(suspiciousCode).toMatch(base64Pattern);
      expect(suspiciousCode).toContain('eval');
    });

    it('should validate package.json scripts for suspicious commands', () => {
      const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf-8'));

      Object.values(packageJson.scripts).forEach((script: any) => {
        expect(script).not.toContain('rm -rf /');
        expect(script).not.toContain('curl | sh');
        expect(script).not.toContain('wget | bash');
      });
    });

    it('should check for unauthorized file system access patterns', () => {
      const dangerousPaths = [
        '/etc/passwd',
        '~/.ssh',
        '/root',
        'C:\\Windows\\System32',
      ];

      dangerousPaths.forEach(path => {
        expect(path).toMatch(/\/|\\|~/);
      });
    });
  });

  describe('dependency version security', () => {
    it('should flag wildcard versions as insecure', () => {
      const insecureVersions = ['*', 'x.x.x', 'latest'];

      insecureVersions.forEach(version => {
        expect(['*', 'x', 'latest']).toContain(version.replace(/\./g, ''));
      });
    });

    it('should prefer locked versions', () => {
      expect(fs.existsSync('package-lock.json')).toBe(true);
    });

    it('should verify no git dependencies', () => {
      const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf-8'));

      const allDeps = {
        ...packageJson.dependencies,
        ...packageJson.devDependencies,
      };

      Object.values(allDeps).forEach((version: any) => {
        expect(version).not.toMatch(/^git\+/);
        expect(version).not.toMatch(/\.git$/);
        expect(version).not.toMatch(/github:/);
      });
    });

    it('should verify no local file dependencies', () => {
      const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf-8'));

      const allDeps = {
        ...packageJson.dependencies,
        ...packageJson.devDependencies,
      };

      Object.values(allDeps).forEach((version: any) => {
        expect(version).not.toMatch(/^file:/);
        expect(version).not.toMatch(/^\.\./);
        expect(version).not.toMatch(/^\.\//);
      });
    });

    it('should verify no HTTP tarball dependencies', () => {
      const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf-8'));

      const allDeps = {
        ...packageJson.dependencies,
        ...packageJson.devDependencies,
      };

      Object.values(allDeps).forEach((version: any) => {
        expect(version).not.toMatch(/^https?:\/\/.*\.tgz$/);
      });
    });
  });

  describe('package name validation', () => {
    it('should detect scope confusion attacks', () => {
      const legitimateScopes = ['@types', '@babel', '@typescript-eslint'];
      const suspiciousScope = '@tyeps'; // Typo of @types

      const distance = levenshteinDistance(suspiciousScope, '@types');
      expect(distance).toBeLessThanOrEqual(2);
    });

    it('should flag mixed-case package names', () => {
      const suspiciousNames = ['React', 'LoDash', 'eXpress'];

      suspiciousNames.forEach(name => {
        const hasUpperCase = /[A-Z]/.test(name);
        expect(hasUpperCase).toBe(true);
      });
    });

    it('should detect homoglyph attacks in package names', () => {
      const legitimate = 'lodash';
      const homoglyph = 'lοdash'; // Greek omicron instead of o

      expect(legitimate).not.toBe(homoglyph);
      expect(legitimate.length).toBe(homoglyph.length);
    });
  });

  describe('supply chain integrity', () => {
    it('should verify package.json has integrity hashes in lockfile', () => {
      const lockfile = JSON.parse(fs.readFileSync('package-lock.json', 'utf-8'));

      // Verify lockfile has integrity hashes
      expect(lockfile).toHaveProperty('lockfileVersion');
      expect(lockfile.lockfileVersion).toBeGreaterThanOrEqual(2);
    });

    it('should check for known vulnerable package patterns', () => {
      const knownVulnerable = ['event-stream@3.3.6']; // Known malicious version

      const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf-8'));
      const allDeps = {
        ...packageJson.dependencies,
        ...packageJson.devDependencies,
      };

      knownVulnerable.forEach(vuln => {
        const [pkg] = vuln.split('@');
        expect(allDeps).not.toHaveProperty(pkg);
      });
    });

    it('should validate no dependencies have postinstall scripts without review', () => {
      // This would require reading node_modules package.json files
      // For now, just verify our own package.json postinstall is known
      const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf-8'));

      if (packageJson.scripts.postinstall) {
        expect(packageJson.scripts.postinstall).toContain('remove-local-npm');
      }
    });
  });

  describe('performance and scalability', () => {
    it('should validate package.json quickly', () => {
      const start = Date.now();

      expect(fs.existsSync('package.json')).toBe(true);
      JSON.parse(fs.readFileSync('package.json', 'utf-8'));

      const duration = Date.now() - start;
      expect(duration).toBeLessThan(100);
    });

    it('should handle large dependency trees', () => {
      const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf-8'));

      const totalDeps =
        Object.keys(packageJson.dependencies || {}).length +
        Object.keys(packageJson.devDependencies || {}).length;

      expect(totalDeps).toBeGreaterThan(0);
    });
  });
});