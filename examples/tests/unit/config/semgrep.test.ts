import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import { parse as parseYaml } from 'yaml';

describe('Semgrep Configuration', () => {
  const rootSemgrepPath = '.semgrep.yml';
  const exampleSemgrepPath = 'examples/.semgrep.yml';

  describe('root semgrep config', () => {
    it('should exist', () => {
      expect(fs.existsSync(rootSemgrepPath)).toBe(true);
    });

    it('should be valid YAML', () => {
      const content = fs.readFileSync(rootSemgrepPath, 'utf-8');
      expect(() => parseYaml(content)).not.toThrow();
    });

    it('should have rules property', () => {
      const content = fs.readFileSync(rootSemgrepPath, 'utf-8');
      const config = parseYaml(content);
      expect(config).toHaveProperty('rules');
    });

    it('should contain security rules', () => {
      const content = fs.readFileSync(rootSemgrepPath, 'utf-8');
      expect(content).toContain('rules:');
    });
  });

  describe('example semgrep config', () => {
    it('should exist', () => {
      expect(fs.existsSync(exampleSemgrepPath)).toBe(true);
    });

    it('should be valid YAML', () => {
      const content = fs.readFileSync(exampleSemgrepPath, 'utf-8');
      expect(() => parseYaml(content)).not.toThrow();
    });

    it('should define security rules', () => {
      const content = fs.readFileSync(exampleSemgrepPath, 'utf-8');
      const config = parseYaml(content);
      
      expect(config).toHaveProperty('rules');
      expect(Array.isArray(config.rules)).toBe(true);
      expect(config.rules.length).toBeGreaterThan(0);
    });

    it('should have no-raw-sql rule', () => {
      const content = fs.readFileSync(exampleSemgrepPath, 'utf-8');
      const config = parseYaml(content);
      
      const noRawSqlRule = config.rules.find((r: any) => r.id === 'no-raw-sql');
      expect(noRawSqlRule).toBeDefined();
      expect(noRawSqlRule.severity).toBe('ERROR');
    });

    it('should have no-eval rule', () => {
      const content = fs.readFileSync(exampleSemgrepPath, 'utf-8');
      const config = parseYaml(content);
      
      const noEvalRule = config.rules.find((r: any) => r.id === 'no-eval');
      expect(noEvalRule).toBeDefined();
      expect(noEvalRule.severity).toBe('ERROR');
    });

    it('should have weak-crypto rule', () => {
      const content = fs.readFileSync(exampleSemgrepPath, 'utf-8');
      const config = parseYaml(content);
      
      const weakCryptoRule = config.rules.find((r: any) => r.id === 'weak-crypto');
      expect(weakCryptoRule).toBeDefined();
      expect(weakCryptoRule.severity).toBe('WARNING');
    });

    it('should have dangerouslySetInnerHTML rule', () => {
      const content = fs.readFileSync(exampleSemgrepPath, 'utf-8');
      const config = parseYaml(content);
      
      const dangerRule = config.rules.find(
        (r: any) => r.id === 'danger-dangerously-set-inner-html'
      );
      expect(dangerRule).toBeDefined();
      expect(dangerRule.severity).toBe('WARNING');
    });
  });

  describe('rule structure validation', () => {
    it('should have properly structured rules', () => {
      const content = fs.readFileSync(exampleSemgrepPath, 'utf-8');
      const config = parseYaml(content);
      
      config.rules.forEach((rule: any) => {
        expect(rule).toHaveProperty('id');
        expect(rule).toHaveProperty('message');
        expect(rule).toHaveProperty('languages');
        expect(rule).toHaveProperty('severity');
        expect(typeof rule.id).toBe('string');
        expect(typeof rule.message).toBe('string');
        expect(Array.isArray(rule.languages)).toBe(true);
      });
    });

    it('should use ERROR or WARNING severity levels', () => {
      const content = fs.readFileSync(exampleSemgrepPath, 'utf-8');
      const config = parseYaml(content);
      
      const validSeverities = ['ERROR', 'WARNING', 'INFO'];
      
      config.rules.forEach((rule: any) => {
        expect(validSeverities).toContain(rule.severity);
      });
    });

    it('should target TypeScript and JavaScript', () => {
      const content = fs.readFileSync(exampleSemgrepPath, 'utf-8');
      const config = parseYaml(content);
      
      const validLanguages = ['typescript', 'javascript', 'tsx', 'jsx'];
      
      config.rules.forEach((rule: any) => {
        const hasValidLanguage = rule.languages.some(
          (lang: string) => validLanguages.includes(lang)
        );
        expect(hasValidLanguage).toBe(true);
      });
    });
  });

  describe('security rule coverage', () => {
    it('should detect SQL injection patterns', () => {
      const content = fs.readFileSync(exampleSemgrepPath, 'utf-8');
      expect(content).toContain('no-raw-sql');
      expect(content).toContain('SQL injection');
    });

    it('should detect eval usage', () => {
      const content = fs.readFileSync(exampleSemgrepPath, 'utf-8');
      expect(content).toContain('no-eval');
      expect(content).toContain('code injection');
    });

    it('should detect weak cryptography', () => {
      const content = fs.readFileSync(exampleSemgrepPath, 'utf-8');
      expect(content).toContain('weak-crypto');
      expect(content).toContain('MD5');
    });

    it('should detect XSS risks', () => {
      const content = fs.readFileSync(exampleSemgrepPath, 'utf-8');
      expect(content).toContain('dangerouslySetInnerHTML');
      expect(content).toContain('XSS');
    });
  });

  describe('rule messages', () => {
    it('should provide actionable guidance', () => {
      const content = fs.readFileSync(exampleSemgrepPath, 'utf-8');
      const config = parseYaml(content);
      
      config.rules.forEach((rule: any) => {
        expect(rule.message.length).toBeGreaterThan(20);
        // Should contain recommendation
        expect(
          rule.message.toLowerCase().includes('use') ||
          rule.message.toLowerCase().includes('avoid') ||
          rule.message.toLowerCase().includes('ensure')
        ).toBe(true);
      });
    });

    it('should explain security risks', () => {
      const content = fs.readFileSync(exampleSemgrepPath, 'utf-8');
      const config = parseYaml(content);
      
      const securityKeywords = [
        'injection',
        'risk',
        'dangerous',
        'vulnerable',
        'attack',
        'security',
        'broken',
        'XSS'
      ];
      
      config.rules.forEach((rule: any) => {
        const hasSecurityKeyword = securityKeywords.some(
          keyword => rule.message.toLowerCase().includes(keyword.toLowerCase())
        );
        expect(hasSecurityKeyword).toBe(true);
      });
    });
  });

  describe('pattern matching', () => {
    it('should use pattern or pattern-either', () => {
      const content = fs.readFileSync(exampleSemgrepPath, 'utf-8');
      const config = parseYaml(content);
      
      config.rules.forEach((rule: any) => {
        const hasPattern = rule.pattern || rule.patterns || rule['pattern-either'];
        expect(hasPattern).toBeDefined();
      });
    });

    it('should detect template literal SQL', () => {
      const content = fs.readFileSync(exampleSemgrepPath, 'utf-8');
      expect(content).toMatch(/\$\{.*\}/); // Template literal pattern
    });

    it('should detect function call patterns', () => {
      const content = fs.readFileSync(exampleSemgrepPath, 'utf-8');
      expect(content).toContain('(...)'); // Function call pattern
    });
  });

  describe('integration with npm scripts', () => {
    it('should be referenced in package.json', () => {
      const packageJson = JSON.parse(
        fs.readFileSync('package.json', 'utf-8')
      );
      
      expect(packageJson.scripts).toHaveProperty('scan:security');
      expect(packageJson.scripts['scan:security']).toContain('semgrep');
      expect(packageJson.scripts['scan:security']).toContain('.semgrep.yml');
    });
  });

  describe('YAML syntax validation', () => {
    it('should use consistent indentation', () => {
      const content = fs.readFileSync(exampleSemgrepPath, 'utf-8');
      const lines = content.split('\n');
      
      // Check that indentation is consistent (multiples of 2)
      lines.forEach((line, index) => {
        const leadingSpaces = line.match(/^ */)?.[0].length || 0;
        if (leadingSpaces > 0) {
          expect(leadingSpaces % 2).toBe(0);
        }
      });
    });

    it('should not have trailing whitespace', () => {
      const content = fs.readFileSync(exampleSemgrepPath, 'utf-8');
      const lines = content.split('\n');
      
      lines.forEach((line, index) => {
        if (line.length > 0) {
          expect(line).not.toMatch(/ $/);
        }
      });
    });

    it('should use lowercase for keywords', () => {
      const content = fs.readFileSync(exampleSemgrepPath, 'utf-8');
      expect(content).toContain('rules:');
      expect(content).toContain('pattern');
      expect(content).toContain('message');
    });
  });
});