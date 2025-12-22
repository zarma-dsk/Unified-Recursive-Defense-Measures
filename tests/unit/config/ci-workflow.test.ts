import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import { parse as parseYaml } from 'yaml';

describe('CI Workflow Configuration', () => {
  const ciPath = 'examples/ci.yml';

  describe('file existence', () => {
    it('should exist in examples directory', () => {
      expect(fs.existsSync(ciPath)).toBe(true);
    });

    it('should be a YAML file', () => {
      expect(ciPath).toMatch(/\.yml$/);
    });
  });

  describe('YAML validity', () => {
    it('should be valid YAML', () => {
      const content = fs.readFileSync(ciPath, 'utf-8');
      expect(() => parseYaml(content)).not.toThrow();
    });

    it('should have workflow name', () => {
      const content = fs.readFileSync(ciPath, 'utf-8');
      const workflow = parseYaml(content);
      
      expect(workflow).toHaveProperty('name');
      expect(typeof workflow.name).toBe('string');
    });

    it('should define trigger events', () => {
      const content = fs.readFileSync(ciPath, 'utf-8');
      const workflow = parseYaml(content);
      
      expect(workflow).toHaveProperty('on');
    });

    it('should define jobs', () => {
      const content = fs.readFileSync(ciPath, 'utf-8');
      const workflow = parseYaml(content);
      
      expect(workflow).toHaveProperty('jobs');
      expect(typeof workflow.jobs).toBe('object');
    });
  });

  describe('workflow configuration', () => {
    it('should be named Antigravity CI', () => {
      const content = fs.readFileSync(ciPath, 'utf-8');
      const workflow = parseYaml(content);
      
      expect(workflow.name).toBe('Antigravity CI');
    });

    it('should trigger on push to main branches', () => {
      const content = fs.readFileSync(ciPath, 'utf-8');
      const workflow = parseYaml(content);
      
      expect(workflow.on).toHaveProperty('push');
      expect(workflow.on.push).toHaveProperty('branches');
      expect(workflow.on.push.branches).toContain('main');
    });

    it('should trigger on pull requests', () => {
      const content = fs.readFileSync(ciPath, 'utf-8');
      const workflow = parseYaml(content);
      
      expect(workflow.on).toHaveProperty('pull_request');
      expect(workflow.on.pull_request).toHaveProperty('branches');
    });
  });

  describe('jobs configuration', () => {
    it('should have validate job', () => {
      const content = fs.readFileSync(ciPath, 'utf-8');
      const workflow = parseYaml(content);
      
      expect(workflow.jobs).toHaveProperty('validate');
    });

    it('should run on ubuntu-latest', () => {
      const content = fs.readFileSync(ciPath, 'utf-8');
      const workflow = parseYaml(content);
      
      expect(workflow.jobs.validate['runs-on']).toBe('ubuntu-latest');
    });

    it('should have descriptive job name', () => {
      const content = fs.readFileSync(ciPath, 'utf-8');
      const workflow = parseYaml(content);
      
      expect(workflow.jobs.validate).toHaveProperty('name');
      expect(workflow.jobs.validate.name).toBe('Security & Quality');
    });

    it('should define steps', () => {
      const content = fs.readFileSync(ciPath, 'utf-8');
      const workflow = parseYaml(content);
      
      expect(workflow.jobs.validate).toHaveProperty('steps');
      expect(Array.isArray(workflow.jobs.validate.steps)).toBe(true);
      expect(workflow.jobs.validate.steps.length).toBeGreaterThan(0);
    });
  });

  describe('workflow steps', () => {
    it('should checkout code', () => {
      const content = fs.readFileSync(ciPath, 'utf-8');
      const workflow = parseYaml(content);
      
      const checkoutStep = workflow.jobs.validate.steps.find(
        (step: any) => step.uses && step.uses.includes('checkout')
      );
      
      expect(checkoutStep).toBeDefined();
    });

    it('should setup Node.js', () => {
      const content = fs.readFileSync(ciPath, 'utf-8');
      const workflow = parseYaml(content);
      
      const nodeStep = workflow.jobs.validate.steps.find(
        (step: any) => step.uses && step.uses.includes('setup-node')
      );
      
      expect(nodeStep).toBeDefined();
      expect(nodeStep.with['node-version']).toBe(20);
    });

    it('should cache npm dependencies', () => {
      const content = fs.readFileSync(ciPath, 'utf-8');
      const workflow = parseYaml(content);
      
      const nodeStep = workflow.jobs.validate.steps.find(
        (step: any) => step.uses && step.uses.includes('setup-node')
      );
      
      expect(nodeStep.with).toHaveProperty('cache');
      expect(nodeStep.with.cache).toBe('npm');
    });

    it('should install dependencies', () => {
      const content = fs.readFileSync(ciPath, 'utf-8');
      const workflow = parseYaml(content);
      
      const installStep = workflow.jobs.validate.steps.find(
        (step: any) => step.run && step.run.includes('npm ci')
      );
      
      expect(installStep).toBeDefined();
    });

    it('should run linting', () => {
      const content = fs.readFileSync(ciPath, 'utf-8');
      const workflow = parseYaml(content);
      
      const lintStep = workflow.jobs.validate.steps.find(
        (step: any) => step.run && step.run.includes('npm run lint')
      );
      
      expect(lintStep).toBeDefined();
      expect(lintStep.name).toBe('Linting');
    });

    it('should run type checking', () => {
      const content = fs.readFileSync(ciPath, 'utf-8');
      const workflow = parseYaml(content);
      
      const typeCheckStep = workflow.jobs.validate.steps.find(
        (step: any) => step.run && step.run.includes('npm run typecheck')
      );
      
      expect(typeCheckStep).toBeDefined();
      expect(typeCheckStep.name).toBe('Type Checking');
    });

    it('should run security validation', () => {
      const content = fs.readFileSync(ciPath, 'utf-8');
      const workflow = parseYaml(content);
      
      const securityStep = workflow.jobs.validate.steps.find(
        (step: any) => step.run && step.run.includes('validate:security')
      );
      
      expect(securityStep).toBeDefined();
      expect(securityStep.name).toBe('Security Validation');
    });

    it('should run supply chain vetting', () => {
      const content = fs.readFileSync(ciPath, 'utf-8');
      const workflow = parseYaml(content);
      
      const vetStep = workflow.jobs.validate.steps.find(
        (step: any) => step.run && step.run.includes('vet:dependency')
      );
      
      expect(vetStep).toBeDefined();
      expect(vetStep.name).toBe('Supply Chain Vet');
    });

    it('should run unit tests', () => {
      const content = fs.readFileSync(ciPath, 'utf-8');
      const workflow = parseYaml(content);
      
      const testStep = workflow.jobs.validate.steps.find(
        (step: any) => step.run && step.run.includes('test:unit')
      );
      
      expect(testStep).toBeDefined();
      expect(testStep.name).toBe('Unit Tests');
    });
  });

  describe('step ordering', () => {
    it('should checkout before setup', () => {
      const content = fs.readFileSync(ciPath, 'utf-8');
      const workflow = parseYaml(content);
      const steps = workflow.jobs.validate.steps;
      
      const checkoutIndex = steps.findIndex(
        (step: any) => step.uses && step.uses.includes('checkout')
      );
      const setupIndex = steps.findIndex(
        (step: any) => step.uses && step.uses.includes('setup-node')
      );
      
      expect(checkoutIndex).toBeLessThan(setupIndex);
    });

    it('should setup before install', () => {
      const content = fs.readFileSync(ciPath, 'utf-8');
      const workflow = parseYaml(content);
      const steps = workflow.jobs.validate.steps;
      
      const setupIndex = steps.findIndex(
        (step: any) => step.uses && step.uses.includes('setup-node')
      );
      const installIndex = steps.findIndex(
        (step: any) => step.run && step.run.includes('npm ci')
      );
      
      expect(setupIndex).toBeLessThan(installIndex);
    });

    it('should install before running scripts', () => {
      const content = fs.readFileSync(ciPath, 'utf-8');
      const workflow = parseYaml(content);
      const steps = workflow.jobs.validate.steps;
      
      const installIndex = steps.findIndex(
        (step: any) => step.run && step.run.includes('npm ci')
      );
      const lintIndex = steps.findIndex(
        (step: any) => step.run && step.run.includes('npm run lint')
      );
      
      expect(installIndex).toBeLessThan(lintIndex);
    });
  });

  describe('security checks', () => {
    it('should include all security validation steps', () => {
      const content = fs.readFileSync(ciPath, 'utf-8');
      const workflow = parseYaml(content);
      
      const securitySteps = workflow.jobs.validate.steps.filter(
        (step: any) => 
          step.name && (
            step.name.includes('Security') ||
            step.name.includes('Supply Chain') ||
            step.name.includes('Vet')
          )
      );
      
      expect(securitySteps.length).toBeGreaterThan(0);
    });

    it('should run security validation before tests', () => {
      const content = fs.readFileSync(ciPath, 'utf-8');
      const workflow = parseYaml(content);
      const steps = workflow.jobs.validate.steps;
      
      const securityIndex = steps.findIndex(
        (step: any) => step.run && step.run.includes('validate:security')
      );
      const testIndex = steps.findIndex(
        (step: any) => step.run && step.run.includes('test:unit')
      );
      
      expect(securityIndex).toBeLessThan(testIndex);
    });
  });

  describe('action versions', () => {
    it('should use v4 for checkout action', () => {
      const content = fs.readFileSync(ciPath, 'utf-8');
      const workflow = parseYaml(content);
      
      const checkoutStep = workflow.jobs.validate.steps.find(
        (step: any) => step.uses && step.uses.includes('checkout')
      );
      
      expect(checkoutStep.uses).toContain('@v4');
    });

    it('should use v4 for setup-node action', () => {
      const content = fs.readFileSync(ciPath, 'utf-8');
      const workflow = parseYaml(content);
      
      const nodeStep = workflow.jobs.validate.steps.find(
        (step: any) => step.uses && step.uses.includes('setup-node')
      );
      
      expect(nodeStep.uses).toContain('@v4');
    });
  });

  describe('branch protection', () => {
    it('should protect main branch', () => {
      const content = fs.readFileSync(ciPath, 'utf-8');
      const workflow = parseYaml(content);
      
      const branches = [
        ...workflow.on.push.branches,
        ...workflow.on.pull_request.branches
      ];
      
      expect(branches).toContain('main');
    });

    it('should protect master branch', () => {
      const content = fs.readFileSync(ciPath, 'utf-8');
      const workflow = parseYaml(content);
      
      const branches = [
        ...workflow.on.push.branches,
        ...workflow.on.pull_request.branches
      ];
      
      expect(branches).toContain('master');
    });

    it('should protect deployment branches', () => {
      const content = fs.readFileSync(ciPath, 'utf-8');
      const workflow = parseYaml(content);
      
      const branches = workflow.on.push.branches;
      
      expect(branches).toContain('mvp');
      expect(branches).toContain('deploy');
    });
  });
});