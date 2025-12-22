import { describe, it, expect } from 'vitest';
import fs from 'node:fs';

describe('CI Configuration Validation', () => {
  const ciPath = 'examples/ci.yml';
  let content: string;

  beforeEach(() => {
    content = fs.readFileSync(ciPath, 'utf-8');
  });

  describe('CI file existence and format', () => {
    it('should exist in examples directory', () => {
      expect(fs.existsSync(ciPath)).toBe(true);
    });

    it('should be valid YAML format', () => {
      // Basic YAML validation
      expect(content).not.toContain('\t'); // No tabs
      expect(content).toMatch(/^name:/m); // Has name field
      expect(content).toMatch(/^on:/m); // Has on field
      expect(content).toMatch(/^jobs:/m); // Has jobs field
    });

    it('should have a workflow name', () => {
      expect(content).toMatch(/^name:\s*Antigravity/m);
    });

    it('should have descriptive workflow name', () => {
      const nameMatch = content.match(/^name:\s*(.+)$/m);
      expect(nameMatch).toBeTruthy();
      expect(nameMatch![1].trim().length).toBeGreaterThan(5);
    });
  });

  describe('trigger configuration', () => {
    it('should have on triggers defined', () => {
      expect(content).toMatch(/^on:/m);
    });

    it('should trigger on push', () => {
      expect(content).toMatch(/^\s+push:/m);
    });

    it('should trigger on pull_request', () => {
      expect(content).toMatch(/^\s+pull_request:/m);
    });

    it('should specify branches for push trigger', () => {
      const pushSection = content.substring(
        content.indexOf('push:'),
        content.indexOf('pull_request:')
      );
      expect(pushSection).toContain('branches:');
    });

    it('should specify branches for pull_request trigger', () => {
      const prSection = content.substring(
        content.indexOf('pull_request:'),
        content.indexOf('jobs:')
      );
      expect(prSection).toContain('branches:');
    });

    it('should include main branch in triggers', () => {
      expect(content).toMatch(/branches:.*main/s);
    });

    it('should include standard deployment branches', () => {
      const hasMaster = content.includes('master');
      const hasMain = content.includes('main');
      const hasDeploy = content.includes('deploy');
      
      expect(hasMain || hasMaster).toBe(true);
      expect(hasDeploy).toBe(true);
    });
  });

  describe('jobs configuration', () => {
    it('should have jobs section defined', () => {
      expect(content).toMatch(/^jobs:/m);
    });

    it('should have validation job', () => {
      expect(content).toMatch(/^\s+validate:/m);
    });

    it('should have job name', () => {
      const validateSection = content.substring(
        content.indexOf('validate:'),
        content.indexOf('validate:') + 200
      );
      expect(validateSection).toMatch(/name:/);
    });

    it('should run on ubuntu-latest', () => {
      expect(content).toContain('runs-on: ubuntu-latest');
    });

    it('should have steps defined', () => {
      expect(content).toMatch(/^\s+steps:/m);
    });

    it('should have multiple steps', () => {
      const stepsCount = (content.match(/- (uses|name):/g) || []).length;
      expect(stepsCount).toBeGreaterThan(5);
    });
  });

  describe('required CI steps', () => {
    it('should checkout code', () => {
      expect(content).toMatch(/uses:\s*actions\/checkout/);
    });

    it('should use checkout v4', () => {
      expect(content).toContain('actions/checkout@v4');
    });

    it('should setup Node.js', () => {
      expect(content).toMatch(/uses:\s*actions\/setup-node/);
    });

    it('should use Node.js setup v4', () => {
      expect(content).toContain('actions/setup-node@v4');
    });

    it('should use Node.js version 20', () => {
      const nodeSection = content.substring(
        content.indexOf('setup-node'),
        content.indexOf('setup-node') + 200
      );
      expect(nodeSection).toMatch(/node-version:\s*20/);
    });

    it('should enable npm caching', () => {
      const nodeSection = content.substring(
        content.indexOf('setup-node'),
        content.indexOf('setup-node') + 200
      );
      expect(nodeSection).toMatch(/cache:\s*['"]?npm['"]?/);
    });

    it('should install dependencies', () => {
      expect(content).toMatch(/run:\s*npm ci/);
    });

    it('should use npm ci for reproducible builds', () => {
      expect(content).toContain('npm ci');
      expect(content).not.toMatch(/run:\s*npm install(?!\s|$)/);
    });

    it('should run linting', () => {
      expect(content).toMatch(/run:\s*npm run lint/);
    });

    it('should have linting step name', () => {
      const lintStepIndex = content.indexOf('npm run lint');
      const lintSection = content.substring(lintStepIndex - 100, lintStepIndex);
      expect(lintSection).toMatch(/name:.*Lint/i);
    });

    it('should run type checking', () => {
      expect(content).toMatch(/run:\s*npm run typecheck/);
    });

    it('should have type checking step name', () => {
      const typeCheckIndex = content.indexOf('npm run typecheck');
      const typeSection = content.substring(typeCheckIndex - 100, typeCheckIndex);
      expect(typeSection).toMatch(/name:.*Type/i);
    });

    it('should run security validation', () => {
      expect(content).toMatch(/run:\s*npm run validate:security/);
    });

    it('should have security validation step name', () => {
      const securityIndex = content.indexOf('npm run validate:security');
      const securitySection = content.substring(securityIndex - 100, securityIndex);
      expect(securitySection).toMatch(/name:.*Security/i);
    });

    it('should run dependency vetting', () => {
      expect(content).toMatch(/run:\s*npm run vet:dependency/);
    });

    it('should have supply chain vetting step name', () => {
      const vetIndex = content.indexOf('npm run vet:dependency');
      const vetSection = content.substring(vetIndex - 100, vetIndex);
      expect(vetSection).toMatch(/name:.*Supply.*Chain|Vet/i);
    });

    it('should run unit tests', () => {
      expect(content).toMatch(/run:\s*npm run test:unit/);
    });

    it('should have unit tests step name', () => {
      const testIndex = content.indexOf('npm run test:unit');
      const testSection = content.substring(testIndex - 100, testIndex);
      expect(testSection).toMatch(/name:.*Unit.*Test|Test/i);
    });
  });

  describe('step ordering', () => {
    it('should checkout before installing dependencies', () => {
      const checkoutIndex = content.indexOf('actions/checkout');
      const installIndex = content.indexOf('npm ci');
      expect(checkoutIndex).toBeLessThan(installIndex);
    });

    it('should setup Node before installing dependencies', () => {
      const nodeIndex = content.indexOf('setup-node');
      const installIndex = content.indexOf('npm ci');
      expect(nodeIndex).toBeLessThan(installIndex);
    });

    it('should install dependencies before running checks', () => {
      const installIndex = content.indexOf('npm ci');
      const lintIndex = content.indexOf('npm run lint');
      const typeCheckIndex = content.indexOf('npm run typecheck');
      
      expect(installIndex).toBeLessThan(lintIndex);
      expect(installIndex).toBeLessThan(typeCheckIndex);
    });

    it('should run linting before other checks', () => {
      const lintIndex = content.indexOf('npm run lint');
      const typeCheckIndex = content.indexOf('npm run typecheck');
      expect(lintIndex).toBeLessThan(typeCheckIndex);
    });

    it('should run security checks before tests', () => {
      const securityIndex = content.indexOf('npm run validate:security');
      const testIndex = content.indexOf('npm run test:unit');
      expect(securityIndex).toBeLessThan(testIndex);
    });

    it('should run type checking before security validation', () => {
      const typeCheckIndex = content.indexOf('npm run typecheck');
      const securityIndex = content.indexOf('npm run validate:security');
      expect(typeCheckIndex).toBeLessThan(securityIndex);
    });
  });

  describe('security best practices', () => {
    it('should use pinned action versions', () => {
      const actionMatches = content.match(/uses:\s*[^@\n]+@/g);
      expect(actionMatches).toBeTruthy();
      expect(actionMatches!.length).toBeGreaterThan(0);
      
      actionMatches!.forEach(action => {
        expect(action).toMatch(/@v\d+$/);
      });
    });

    it('should use latest stable action versions', () => {
      expect(content).toContain('@v4');
    });

    it('should use npm caching for faster builds', () => {
      expect(content).toMatch(/cache:\s*['"]?npm['"]?/);
    });

    it('should include all Antigravity security checks', () => {
      const securityChecks = [
        'npm run lint',
        'npm run typecheck',
        'npm run validate:security',
        'npm run vet:dependency',
        'npm run test:unit',
      ];

      securityChecks.forEach(check => {
        expect(content).toContain(check);
      });
    });

    it('should not use deprecated npm install', () => {
      // Should use npm ci, not npm install
      const installMatches = content.match(/npm install(?!\s|$)/g);
      expect(installMatches).toBeFalsy();
    });

    it('should have consistent indentation', () => {
      // Check that indentation is consistent (2 spaces)
      const lines = content.split('\n');
      lines.forEach(line => {
        if (line.trim().length > 0) {
          const leadingSpaces = line.match(/^(\s*)/)?.[1].length || 0;
          expect(leadingSpaces % 2).toBe(0); // Should be multiple of 2
        }
      });
    });
  });

  describe('step naming conventions', () => {
    it('should have descriptive names for all manual steps', () => {
      const nameMatches = content.match(/name:\s*(.+)$/gm);
      expect(nameMatches).toBeTruthy();
      
      nameMatches!.forEach(nameMatch => {
        const name = nameMatch.replace(/name:\s*/, '').trim();
        expect(name.length).toBeGreaterThan(5);
      });
    });

    it('should use title case for step names', () => {
      const nameMatches = content.match(/name:\s*([A-Z][^$\n]+)/g);
      expect(nameMatches).toBeTruthy();
      expect(nameMatches!.length).toBeGreaterThan(0);
    });

    it('should use consistent naming pattern', () => {
      // Step names should be clear and consistent
      const names = content.match(/name:\s*(.+)$/gm);
      expect(names).toBeTruthy();
      
      names!.forEach(name => {
        const nameText = name.replace(/name:\s*/, '');
        // Should not have trailing periods
        expect(nameText).not.toMatch(/\.$/);
        // Should be concise
        expect(nameText.split(' ').length).toBeLessThan(6);
      });
    });
  });

  describe('Antigravity-specific requirements', () => {
    it('should reference Antigravity in workflow name', () => {
      expect(content).toMatch(/name:.*Antigravity/);
    });

    it('should include MVP branch for Antigravity workflow', () => {
      expect(content).toContain('mvp');
    });

    it('should have Security & Quality job name', () => {
      const validateSection = content.substring(
        content.indexOf('validate:'),
        content.indexOf('validate:') + 300
      );
      expect(validateSection).toMatch(/name:.*Security.*Quality|Quality.*Security/);
    });

    it('should run all required Antigravity gates', () => {
      const requiredGates = [
        'lint',
        'typecheck',
        'validate:security',
        'vet:dependency',
        'test:unit',
      ];

      requiredGates.forEach(gate => {
        expect(content).toContain(gate);
      });
    });
  });
});