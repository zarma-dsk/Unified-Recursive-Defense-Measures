import { describe, it, expect } from 'vitest';
import fs from 'node:fs';

describe('Package.json Configuration', () => {
  let packageJson: any;

  beforeEach(() => {
    const content = fs.readFileSync('package.json', 'utf-8');
    packageJson = JSON.parse(content);
  });

  describe('metadata', () => {
    it('should have correct name', () => {
      expect(packageJson.name).toBe('antigravity-starter');
    });

    it('should be marked as private', () => {
      expect(packageJson.private).toBe(true);
    });

    it('should use ES modules', () => {
      expect(packageJson.type).toBe('module');
    });

    it('should have version', () => {
      expect(packageJson.version).toBeDefined();
      expect(typeof packageJson.version).toBe('string');
    });

    it('should specify Node.js version requirement', () => {
      expect(packageJson.engines).toHaveProperty('node');
      expect(packageJson.engines.node).toContain('>=20.0.0');
    });
  });

  describe('scripts', () => {
    it('should have dev script', () => {
      expect(packageJson.scripts).toHaveProperty('dev');
      expect(packageJson.scripts.dev).toContain('next dev');
    });

    it('should have build script', () => {
      expect(packageJson.scripts).toHaveProperty('build');
      expect(packageJson.scripts.build).toContain('next build');
    });

    it('should have lint script', () => {
      expect(packageJson.scripts).toHaveProperty('lint');
      expect(packageJson.scripts.lint).toContain('eslint');
    });

    it('should have typecheck script', () => {
      expect(packageJson.scripts).toHaveProperty('typecheck');
      expect(packageJson.scripts.typecheck).toContain('tsc --noEmit');
    });

    it('should have test script', () => {
      expect(packageJson.scripts).toHaveProperty('test');
      expect(packageJson.scripts.test).toContain('vitest');
    });

    it('should have test:unit script', () => {
      expect(packageJson.scripts).toHaveProperty('test:unit');
      expect(packageJson.scripts['test:unit']).toContain('vitest run tests/unit');
    });

    it('should have test:adversarial script', () => {
      expect(packageJson.scripts).toHaveProperty('test:adversarial');
      expect(packageJson.scripts['test:adversarial']).toContain('vitest run tests/adversarial');
    });

    it('should have vet:dependency script', () => {
      expect(packageJson.scripts).toHaveProperty('vet:dependency');
      expect(packageJson.scripts['vet:dependency']).toContain('dependency-validator');
    });

    it('should have scan:security script', () => {
      expect(packageJson.scripts).toHaveProperty('scan:security');
      expect(packageJson.scripts['scan:security']).toContain('semgrep');
    });

    it('should have validate:security script', () => {
      expect(packageJson.scripts).toHaveProperty('validate:security');
      expect(packageJson.scripts['validate:security']).toContain('validate-security');
    });

    it('should have postinstall script', () => {
      expect(packageJson.scripts).toHaveProperty('postinstall');
      expect(packageJson.scripts.postinstall).toContain('remove-local-npm');
    });

    it('should have format script', () => {
      expect(packageJson.scripts).toHaveProperty('format');
      expect(packageJson.scripts.format).toContain('prettier');
    });
  });

  describe('dependencies', () => {
    it('should include security dependencies', () => {
      expect(packageJson.dependencies).toHaveProperty('zod');
      expect(packageJson.dependencies).toHaveProperty('dompurify');
      expect(packageJson.dependencies).toHaveProperty('winston');
    });

    it('should include validation libraries', () => {
      expect(packageJson.dependencies).toHaveProperty('zod');
      expect(packageJson.dependencies).toHaveProperty('valibot');
    });

    it('should include DOM purification', () => {
      expect(packageJson.dependencies).toHaveProperty('dompurify');
      expect(packageJson.dependencies).toHaveProperty('@types/dompurify');
      expect(packageJson.dependencies).toHaveProperty('jsdom');
      expect(packageJson.dependencies).toHaveProperty('@types/jsdom');
    });

    it('should have logger dependency', () => {
      expect(packageJson.dependencies).toHaveProperty('winston');
    });

    it('should not include dangerous dependencies', () => {
      const dangerousPackages = ['eval', 'vm2', 'node-serialize'];
      dangerousPackages.forEach(pkg => {
        expect(packageJson.dependencies).not.toHaveProperty(pkg);
        expect(packageJson.devDependencies).not.toHaveProperty(pkg);
      });
    });
  });

  describe('devDependencies', () => {
    it('should include TypeScript', () => {
      expect(packageJson.devDependencies).toHaveProperty('typescript');
    });

    it('should include type definitions', () => {
      expect(packageJson.devDependencies).toHaveProperty('@types/node');
      expect(packageJson.devDependencies).toHaveProperty('@types/react');
      expect(packageJson.devDependencies).toHaveProperty('@types/react-dom');
    });

    it('should include testing framework', () => {
      expect(packageJson.devDependencies).toHaveProperty('vitest');
    });

    it('should include linting tools', () => {
      expect(packageJson.devDependencies).toHaveProperty('eslint');
      expect(packageJson.devDependencies).toHaveProperty('prettier');
    });

    it('should include Tailwind CSS', () => {
      expect(packageJson.devDependencies).toHaveProperty('tailwindcss');
    });
  });

  describe('version constraints', () => {
    it('should use semantic versioning for dependencies', () => {
      const semverPattern = /^[\^~]?\d+\.\d+\.\d+/;
      
      Object.values(packageJson.dependencies).forEach((version: any) => {
        expect(version).toMatch(semverPattern);
      });
    });

    it('should use semantic versioning for devDependencies', () => {
      const semverPattern = /^[\^~]?\d+\.\d+\.\d+/;
      
      Object.values(packageJson.devDependencies).forEach((version: any) => {
        expect(version).toMatch(semverPattern);
      });
    });

    it('should not use wildcards', () => {
      const allDeps = {
        ...packageJson.dependencies,
        ...packageJson.devDependencies
      };
      
      Object.values(allDeps).forEach((version: any) => {
        expect(version).not.toBe('*');
        expect(version).not.toBe('latest');
      });
    });
  });

  describe('security configuration', () => {
    it('should have security validation in scripts', () => {
      const securityScripts = ['vet:dependency', 'scan:security', 'validate:security'];
      
      securityScripts.forEach(script => {
        expect(packageJson.scripts).toHaveProperty(script);
      });
    });

    it('should run postinstall cleanup', () => {
      expect(packageJson.scripts.postinstall).toBeDefined();
    });

    it('should use tsx for TypeScript execution', () => {
      const tsScripts = Object.entries(packageJson.scripts)
        .filter(([key, value]) => (value as string).includes('.ts'));
      
      tsScripts.forEach(([key, value]) => {
        expect(value).toContain('tsx');
      });
    });
  });

  describe('testing configuration', () => {
    it('should have separate unit and adversarial test scripts', () => {
      expect(packageJson.scripts['test:unit']).toBeDefined();
      expect(packageJson.scripts['test:adversarial']).toBeDefined();
    });

    it('should use vitest for testing', () => {
      expect(packageJson.scripts.test).toContain('vitest');
      expect(packageJson.devDependencies).toHaveProperty('vitest');
    });
  });

  describe('linting configuration', () => {
    it('should have lint and lint:fix scripts', () => {
      expect(packageJson.scripts.lint).toBeDefined();
      expect(packageJson.scripts['lint:fix']).toBeDefined();
    });

    it('should have format script', () => {
      expect(packageJson.scripts.format).toBeDefined();
      expect(packageJson.scripts.format).toContain('prettier');
    });
  });

  describe('build configuration', () => {
    it('should have Next.js-related scripts', () => {
      expect(packageJson.scripts.dev).toContain('next');
      expect(packageJson.scripts.build).toContain('next');
      expect(packageJson.scripts.start).toContain('next');
    });

    it('should have debug script', () => {
      expect(packageJson.scripts).toHaveProperty('debug');
    });
  });

  describe('JSON structure', () => {
    it('should be valid JSON', () => {
      const content = fs.readFileSync('package.json', 'utf-8');
      expect(() => JSON.parse(content)).not.toThrow();
    });

    it('should have consistent structure', () => {
      const requiredFields = ['name', 'version', 'scripts', 'dependencies', 'devDependencies'];
      
      requiredFields.forEach(field => {
        expect(packageJson).toHaveProperty(field);
      });
    });
  });
});