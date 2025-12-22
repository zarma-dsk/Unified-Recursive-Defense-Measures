import { describe, it, expect } from 'vitest';
import fs from 'node:fs';

describe('Package.json Scripts Validation', () => {
  let packageJson: any;

  beforeEach(() => {
    const content = fs.readFileSync('package.json', 'utf-8');
    packageJson = JSON.parse(content);
  });

  describe('required scripts', () => {
    it('should have dev script', () => {
      expect(packageJson.scripts).toHaveProperty('dev');
    });

    it('should have build script', () => {
      expect(packageJson.scripts).toHaveProperty('build');
    });

    it('should have lint script', () => {
      expect(packageJson.scripts).toHaveProperty('lint');
    });

    it('should have typecheck script', () => {
      expect(packageJson.scripts).toHaveProperty('typecheck');
    });

    it('should have test script', () => {
      expect(packageJson.scripts).toHaveProperty('test');
    });

    it('should have test:unit script', () => {
      expect(packageJson.scripts).toHaveProperty('test:unit');
    });

    it('should have test:adversarial script', () => {
      expect(packageJson.scripts).toHaveProperty('test:adversarial');
    });
  });

  describe('security scripts', () => {
    it('should have scan:security script', () => {
      expect(packageJson.scripts).toHaveProperty('scan:security');
      expect(packageJson.scripts['scan:security']).toContain('semgrep');
    });

    it('should have validate:security script', () => {
      expect(packageJson.scripts).toHaveProperty('validate:security');
    });

    it('should have vet:dependency script', () => {
      expect(packageJson.scripts).toHaveProperty('vet:dependency');
    });

    it('should use correct semgrep config path', () => {
      expect(packageJson.scripts['scan:security']).toContain('.semgrep.yml');
    });
  });

  describe('test configuration', () => {
    it('should run unit tests from tests/unit directory', () => {
      expect(packageJson.scripts['test:unit']).toContain('tests/unit');
    });

    it('should run adversarial tests from tests/adversarial directory', () => {
      expect(packageJson.scripts['test:adversarial']).toContain('tests/adversarial');
    });

    it('should use vitest for testing', () => {
      expect(packageJson.scripts.test).toContain('vitest');
    });
  });

  describe('dependencies', () => {
    it('should have sanitization library (dompurify)', () => {
      expect(packageJson.dependencies).toHaveProperty('dompurify');
    });

    it('should have jsdom for server-side DOM', () => {
      expect(packageJson.dependencies).toHaveProperty('jsdom');
    });

    it('should have validation library (zod)', () => {
      expect(packageJson.dependencies).toHaveProperty('zod');
    });

    it('should have logging library (winston)', () => {
      expect(packageJson.dependencies).toHaveProperty('winston');
    });

    it('should have vitest as dev dependency', () => {
      expect(packageJson.devDependencies).toHaveProperty('vitest');
    });

    it('should have typescript as dev dependency', () => {
      expect(packageJson.devDependencies).toHaveProperty('typescript');
    });

    it('should have eslint as dev dependency', () => {
      expect(packageJson.devDependencies).toHaveProperty('eslint');
    });
  });

  describe('Node.js version requirements', () => {
    it('should specify Node.js engine requirement', () => {
      expect(packageJson).toHaveProperty('engines');
      expect(packageJson.engines).toHaveProperty('node');
    });

    it('should require Node.js 20 or higher', () => {
      const nodeVersion = packageJson.engines.node;
      expect(nodeVersion).toMatch(/>=20/);
    });
  });

  describe('package metadata', () => {
    it('should be marked as private', () => {
      expect(packageJson.private).toBe(true);
    });

    it('should have a name', () => {
      expect(packageJson).toHaveProperty('name');
      expect(packageJson.name).toBeTruthy();
    });

    it('should use ES modules', () => {
      expect(packageJson.type).toBe('module');
    });
  });
});