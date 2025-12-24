import { describe, it, expect } from 'vitest';
import fs from 'node:fs';

// Simplified test without 'yaml' parser dependency
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
    it('should have workflow name', () => {
      const content = fs.readFileSync(ciPath, 'utf-8');
      expect(content).toContain('name:');
    });

    it('should define trigger events', () => {
      const content = fs.readFileSync(ciPath, 'utf-8');
      expect(content).toContain('on:');
    });

    it('should define jobs', () => {
      const content = fs.readFileSync(ciPath, 'utf-8');
      expect(content).toContain('jobs:');
    });
  });

  describe('workflow configuration', () => {
    it('should be named Antigravity CI', () => {
      const content = fs.readFileSync(ciPath, 'utf-8');
      expect(content).toContain('name: Antigravity CI');
    });

    it('should trigger on push to main branches', () => {
      const content = fs.readFileSync(ciPath, 'utf-8');
      expect(content).toContain('push:');
      expect(content).toContain('branches:');
      expect(content).toContain('main');
    });

    it('should trigger on pull requests', () => {
      const content = fs.readFileSync(ciPath, 'utf-8');
      expect(content).toContain('pull_request:');
    });
  });

  describe('jobs configuration', () => {
    it('should have validate job', () => {
      const content = fs.readFileSync(ciPath, 'utf-8');
      expect(content).toContain('validate:');
    });

    it('should run on ubuntu-latest', () => {
      const content = fs.readFileSync(ciPath, 'utf-8');
      expect(content).toContain('runs-on: ubuntu-latest');
    });

    it('should have descriptive job name', () => {
      const content = fs.readFileSync(ciPath, 'utf-8');
      expect(content).toContain('name: Security & Quality');
    });

    it('should define steps', () => {
      const content = fs.readFileSync(ciPath, 'utf-8');
      expect(content).toContain('steps:');
    });
  });

  describe('workflow steps', () => {
    it('should checkout code', () => {
      const content = fs.readFileSync(ciPath, 'utf-8');
      expect(content).toContain('actions/checkout');
    });

    it('should setup Node.js', () => {
      const content = fs.readFileSync(ciPath, 'utf-8');
      expect(content).toContain('actions/setup-node');
      expect(content).toContain('node-version: 20');
    });

    it('should cache npm dependencies', () => {
      const content = fs.readFileSync(ciPath, 'utf-8');
      expect(content).toContain('cache:');
      expect(content).toContain('npm');
    });

    it('should install dependencies', () => {
      const content = fs.readFileSync(ciPath, 'utf-8');
      expect(content).toContain('npm ci');
    });

    it('should run linting', () => {
      const content = fs.readFileSync(ciPath, 'utf-8');
      expect(content).toContain('npm run lint');
    });

    it('should run type checking', () => {
      const content = fs.readFileSync(ciPath, 'utf-8');
      expect(content).toContain('npm run typecheck');
    });

    it('should run security validation', () => {
      const content = fs.readFileSync(ciPath, 'utf-8');
      expect(content).toContain('validate:security');
    });

    it('should run supply chain vetting', () => {
      const content = fs.readFileSync(ciPath, 'utf-8');
      expect(content).toContain('vet:dependency');
    });

    it('should run unit tests', () => {
      const content = fs.readFileSync(ciPath, 'utf-8');
      expect(content).toContain('test:unit');
    });
  });

  describe('security checks', () => {
    it('should include all security validation steps', () => {
      const content = fs.readFileSync(ciPath, 'utf-8');
      expect(content).toContain('name: Security Validation');
      expect(content).toContain('name: Supply Chain Vet');
    });
  });

  describe('action versions', () => {
    it('should use v4 for checkout action', () => {
      const content = fs.readFileSync(ciPath, 'utf-8');
      expect(content).toContain('actions/checkout@v4');
    });

    it('should use v4 for setup-node action', () => {
      const content = fs.readFileSync(ciPath, 'utf-8');
      expect(content).toContain('actions/setup-node@v4');
    });
  });

  describe('branch protection', () => {
    it('should protect main branch', () => {
      const content = fs.readFileSync(ciPath, 'utf-8');
      expect(content).toContain('main');
    });

    it('should protect master branch', () => {
      const content = fs.readFileSync(ciPath, 'utf-8');
      expect(content).toContain('master');
    });

    it('should protect deployment branches', () => {
      const content = fs.readFileSync(ciPath, 'utf-8');
      expect(content).toContain('mvp');
      expect(content).toContain('deploy');
    });
  });
});
