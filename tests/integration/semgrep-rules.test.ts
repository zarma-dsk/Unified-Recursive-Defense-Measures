import { describe, it, expect } from 'vitest';
import fs from 'node:fs';

describe('Semgrep Configuration Validation', () => {
  const semgrepPath = '.semgrep.yml';
  const exampleSemgrepPath = 'examples/.semgrep.yml';

  describe('main .semgrep.yml', () => {
    it('should exist in the repository root', () => {
      expect(fs.existsSync(semgrepPath)).toBe(true);
    });

    it('should be valid YAML format', () => {
      const content = fs.readFileSync(semgrepPath, 'utf-8');
      
      // Basic YAML validation - should not have tab characters
      expect(content).not.toContain('\t');
      
      // Should have proper YAML structure
      expect(content).toContain('rules:');
      expect(content).toContain('id:');
      expect(content).toContain('pattern:');
    });

    it('should have rules section defined', () => {
      const content = fs.readFileSync(semgrepPath, 'utf-8');
      expect(content).toContain('rules:');
    });

    it('should have no-raw-sql rule', () => {
      const content = fs.readFileSync(semgrepPath, 'utf-8');
      expect(content).toContain('id: no-raw-sql');
      expect(content).toContain('SQL injection');
    });

    it('should have no-eval rule', () => {
      const content = fs.readFileSync(semgrepPath, 'utf-8');
      expect(content).toContain('id: no-eval');
      expect(content).toContain('eval()');
    });

    it('should have weak-crypto rule', () => {
      const content = fs.readFileSync(semgrepPath, 'utf-8');
      expect(content).toContain('id: weak-crypto');
      expect(content).toContain('MD5');
    });

    it('should have danger-dangerously-set-inner-html rule', () => {
      const content = fs.readFileSync(semgrepPath, 'utf-8');
      expect(content).toContain('id: danger-dangerously-set-inner-html');
      expect(content).toContain('dangerouslySetInnerHTML');
    });

    it('should have severity levels defined', () => {
      const content = fs.readFileSync(semgrepPath, 'utf-8');
      expect(content).toMatch(/severity:\s*(ERROR|WARNING|INFO)/);
    });

    it('should target TypeScript and JavaScript', () => {
      const content = fs.readFileSync(semgrepPath, 'utf-8');
      expect(content).toMatch(/languages:\s*\[.*typescript.*\]/i);
    });

    it('should have descriptive error messages', () => {
      const content = fs.readFileSync(semgrepPath, 'utf-8');
      
      // Count message fields
      const messageCount = (content.match(/message:/g) || []).length;
      expect(messageCount).toBeGreaterThan(0);
      
      // Messages should be descriptive (>20 chars after "message:")
      const messages = content.match(/message:\s*"[^"]{20,}"/g);
      expect(messages).toBeTruthy();
      expect(messages!.length).toBeGreaterThan(0);
    });

    it('should use ERROR severity for critical issues', () => {
      const content = fs.readFileSync(semgrepPath, 'utf-8');
      
      // no-eval should be ERROR
      const noEvalSection = content.substring(
        content.indexOf('id: no-eval'),
        content.indexOf('id: no-eval') + 200
      );
      expect(noEvalSection).toContain('severity: ERROR');
      
      // no-raw-sql should be ERROR
      const noSqlSection = content.substring(
        content.indexOf('id: no-raw-sql'),
        content.indexOf('id: no-raw-sql') + 300
      );
      expect(noSqlSection).toContain('severity: ERROR');
    });

    it('should use WARNING severity for best practice violations', () => {
      const content = fs.readFileSync(semgrepPath, 'utf-8');
      
      // weak-crypto should be WARNING
      const weakCryptoSection = content.substring(
        content.indexOf('id: weak-crypto'),
        content.indexOf('id: weak-crypto') + 200
      );
      expect(weakCryptoSection).toContain('severity: WARNING');
    });

    it('should have pattern definitions for each rule', () => {
      const content = fs.readFileSync(semgrepPath, 'utf-8');
      
      // Count id and pattern occurrences - should match
      const idCount = (content.match(/id:/g) || []).length;
      const patternCount = (content.match(/pattern/g) || []).length;
      
      expect(patternCount).toBeGreaterThanOrEqual(idCount);
    });

    it('should not have duplicate rule IDs', () => {
      const content = fs.readFileSync(semgrepPath, 'utf-8');
      
      const idMatches = content.match(/id:\s*[\w-]+/g) || [];
      const ids = idMatches.map(match => match.replace(/id:\s*/, ''));
      const uniqueIds = new Set(ids);
      
      expect(ids.length).toBe(uniqueIds.size);
    });

    it('should have at least 4 security rules', () => {
      const content = fs.readFileSync(semgrepPath, 'utf-8');
      const idCount = (content.match(/id:/g) || []).length;
      expect(idCount).toBeGreaterThanOrEqual(4);
    });
  });

  describe('examples/.semgrep.yml', () => {
    it('should exist in examples directory', () => {
      expect(fs.existsSync(exampleSemgrepPath)).toBe(true);
    });

    it('should be valid YAML format', () => {
      const content = fs.readFileSync(exampleSemgrepPath, 'utf-8');
      expect(content).not.toContain('\t');
      expect(content).toContain('rules:');
    });

    it('should have the same structure as main config', () => {
      const mainContent = fs.readFileSync(semgrepPath, 'utf-8');
      const exampleContent = fs.readFileSync(exampleSemgrepPath, 'utf-8');
      
      // Both should have rules section
      expect(exampleContent).toContain('rules:');
      expect(exampleContent).toContain('id:');
      expect(exampleContent).toContain('message:');
    });

    it('should contain security-focused rules', () => {
      const content = fs.readFileSync(exampleSemgrepPath, 'utf-8');
      
      // Should contain at least one of these security rules
      const hasSecurityRule = 
        content.includes('no-raw-sql') ||
        content.includes('no-eval') ||
        content.includes('weak-crypto');
      
      expect(hasSecurityRule).toBe(true);
    });

    it('should have consistent formatting with main config', () => {
      const mainContent = fs.readFileSync(semgrepPath, 'utf-8');
      const exampleContent = fs.readFileSync(exampleSemgrepPath, 'utf-8');
      
      // Both should use 2-space indentation
      const mainIndent = mainContent.match(/^  \S/m);
      const exampleIndent = exampleContent.match(/^  \S/m);
      
      expect(mainIndent).toBeTruthy();
      expect(exampleIndent).toBeTruthy();
    });
  });

  describe('security coverage', () => {
    it('should cover SQL injection risks', () => {
      const content = fs.readFileSync(semgrepPath, 'utf-8');
      expect(content.toLowerCase()).toContain('sql');
      expect(content.toLowerCase()).toContain('injection');
    });

    it('should cover code injection risks', () => {
      const content = fs.readFileSync(semgrepPath, 'utf-8');
      expect(content).toContain('eval');
      expect(content.toLowerCase()).toContain('injection');
    });

    it('should cover cryptographic weaknesses', () => {
      const content = fs.readFileSync(semgrepPath, 'utf-8');
      expect(content.toLowerCase()).toContain('md5');
      expect(content.toLowerCase()).toContain('crypto');
    });

    it('should cover XSS risks', () => {
      const content = fs.readFileSync(semgrepPath, 'utf-8');
      expect(content.toLowerCase()).toContain('xss');
      expect(content).toContain('dangerouslySetInnerHTML');
    });

    it('should provide remediation guidance', () => {
      const content = fs.readFileSync(semgrepPath, 'utf-8');
      
      // Messages should suggest alternatives
      expect(content.toLowerCase()).toMatch(/use.*instead/);
      expect(content.toLowerCase()).toMatch(/avoid|should not|ensure/);
    });
  });

  describe('rule quality', () => {
    it('should have clear and actionable messages', () => {
      const content = fs.readFileSync(semgrepPath, 'utf-8');
      
      // Extract all messages
      const messageMatches = content.match(/message:\s*"([^"]+)"/g);
      expect(messageMatches).toBeTruthy();
      
      messageMatches!.forEach(messageMatch => {
        const message = messageMatch.replace(/message:\s*"/, '').replace(/"$/, '');
        
        // Should describe the problem
        expect(message.length).toBeGreaterThan(20);
        
        // Should provide guidance
        const hasGuidance = 
          message.toLowerCase().includes('use') ||
          message.toLowerCase().includes('instead') ||
          message.toLowerCase().includes('avoid') ||
          message.toLowerCase().includes('ensure');
        
        expect(hasGuidance).toBe(true);
      });
    });

    it('should include language specifications', () => {
      const content = fs.readFileSync(semgrepPath, 'utf-8');
      
      // Should specify target languages
      expect(content).toMatch(/languages:\s*\[/);
      expect(content).toContain('typescript');
      expect(content).toContain('javascript');
    });

    it('should use appropriate pattern matching', () => {
      const content = fs.readFileSync(semgrepPath, 'utf-8');
      
      // Should use pattern or patterns field
      const hasPatterns = 
        content.includes('pattern:') ||
        content.includes('patterns:');
      
      expect(hasPatterns).toBe(true);
    });
  });
});