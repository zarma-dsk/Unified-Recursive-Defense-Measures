import { describe, it, expect } from 'vitest';
import { sanitizeHtml, sanitizeInput } from '../../../src/lib/sanitize';

describe('sanitizeHtml', () => {
  describe('XSS prevention', () => {
    it('should remove script tags', () => {
      const dirty = '<script>alert("XSS")</script>';
      const clean = sanitizeHtml(dirty);
      expect(clean).not.toContain('<script>');
      expect(clean).not.toContain('alert');
    });

    it('should remove inline JavaScript event handlers', () => {
      const dirty = '<div onclick="alert(\'XSS\')">Click me</div>';
      const clean = sanitizeHtml(dirty);
      expect(clean).not.toContain('onclick');
      expect(clean).not.toContain('alert');
    });

    it('should remove javascript: URLs', () => {
      const dirty = '<a href="javascript:alert(\'XSS\')">Click</a>';
      const clean = sanitizeHtml(dirty);
      expect(clean).not.toContain('javascript:');
    });

    it('should remove data: URLs', () => {
      const dirty = '<a href="data:text/html,<script>alert(\'XSS\')</script>">Click</a>';
      const clean = sanitizeHtml(dirty);
      expect(clean).not.toContain('data:');
    });

    it('should remove dangerous style attributes', () => {
      const dirty = '<div style="position:fixed; top:0; left:0; width:100%; height:100%; background:red;">Overlay</div>';
      const clean = sanitizeHtml(dirty);
      expect(clean).not.toContain('style=');
    });

    it('should remove iframe tags', () => {
      const dirty = '<iframe src="https://evil.com"></iframe>';
      const clean = sanitizeHtml(dirty);
      expect(clean).not.toContain('<iframe');
    });

    it('should remove embed tags', () => {
      const dirty = '<embed src="malicious.swf">';
      const clean = sanitizeHtml(dirty);
      expect(clean).not.toContain('<embed');
    });

    it('should remove object tags', () => {
      const dirty = '<object data="malicious.swf"></object>';
      const clean = sanitizeHtml(dirty);
      expect(clean).not.toContain('<object');
    });

    it('should handle multiple XSS vectors in one string', () => {
      const dirty = `
        <script>alert('xss1')</script>
        <img src=x onerror="alert('xss2')">
        <a href="javascript:alert('xss3')">click</a>
      `;
      const clean = sanitizeHtml(dirty);
      expect(clean).not.toContain('script');
      expect(clean).not.toContain('onerror');
      expect(clean).not.toContain('javascript:');
      expect(clean).not.toContain('alert');
    });
  });

  describe('allowed tags', () => {
    it('should allow basic text formatting tags', () => {
      const input = '<b>bold</b> <i>italic</i> <em>emphasis</em> <strong>strong</strong>';
      const clean = sanitizeHtml(input);
      expect(clean).toContain('<b>bold</b>');
      expect(clean).toContain('<i>italic</i>');
      expect(clean).toContain('<em>emphasis</em>');
      expect(clean).toContain('<strong>strong</strong>');
    });

    it('should allow paragraph tags', () => {
      const input = '<p>This is a paragraph</p>';
      const clean = sanitizeHtml(input);
      expect(clean).toContain('<p>This is a paragraph</p>');
    });

    it('should allow line breaks', () => {
      const input = 'Line 1<br>Line 2';
      const clean = sanitizeHtml(input);
      expect(clean).toContain('<br>');
    });

    it('should allow list tags', () => {
      const input = '<ul><li>Item 1</li><li>Item 2</li></ul>';
      const clean = sanitizeHtml(input);
      expect(clean).toContain('<ul>');
      expect(clean).toContain('<li>');
      expect(clean).toContain('Item 1');
    });

    it('should allow ordered lists', () => {
      const input = '<ol><li>First</li><li>Second</li></ol>';
      const clean = sanitizeHtml(input);
      expect(clean).toContain('<ol>');
      expect(clean).toContain('<li>');
    });

    it('should allow code tags', () => {
      const input = '<code>const x = 5;</code>';
      const clean = sanitizeHtml(input);
      expect(clean).toContain('<code>');
      expect(clean).toContain('const x = 5;');
    });

    it('should allow pre tags', () => {
      const input = '<pre>Preformatted text</pre>';
      const clean = sanitizeHtml(input);
      expect(clean).toContain('<pre>');
    });

    it('should allow anchor tags with safe attributes', () => {
      const input = '<a href="https://example.com" target="_blank" rel="noopener">Link</a>';
      const clean = sanitizeHtml(input);
      expect(clean).toContain('href="https://example.com"');
      expect(clean).toContain('target="_blank"');
      expect(clean).toContain('rel="noopener"');
    });
  });

  describe('attribute sanitization', () => {
    it('should remove non-whitelisted attributes from allowed tags', () => {
      const input = '<p class="danger" data-value="test">Text</p>';
      const clean = sanitizeHtml(input);
      expect(clean).not.toContain('class=');
      expect(clean).not.toContain('data-value=');
      expect(clean).toContain('Text');
    });

    it('should allow href attribute on anchor tags', () => {
      const input = '<a href="https://safe.com">Link</a>';
      const clean = sanitizeHtml(input);
      expect(clean).toContain('href="https://safe.com"');
    });

    it('should allow target and rel attributes on anchors', () => {
      const input = '<a href="#" target="_blank" rel="noopener noreferrer">Link</a>';
      const clean = sanitizeHtml(input);
      expect(clean).toContain('target="_blank"');
      expect(clean).toContain('rel="noopener noreferrer"');
    });

    it('should remove dangerous attributes even from allowed tags', () => {
      const input = '<a href="https://safe.com" onclick="alert(\'xss\')">Link</a>';
      const clean = sanitizeHtml(input);
      expect(clean).toContain('href=');
      expect(clean).not.toContain('onclick');
    });
  });

  describe('edge cases', () => {
    it('should handle empty string', () => {
      const clean = sanitizeHtml('');
      expect(clean).toBe('');
    });

    it('should handle undefined by returning empty string', () => {
      const clean = sanitizeHtml(undefined as any);
      expect(clean).toBe('');
    });

    it('should handle null by returning empty string', () => {
      const clean = sanitizeHtml(null as any);
      expect(clean).toBe('');
    });

    it('should handle plain text without HTML', () => {
      const input = 'Just plain text';
      const clean = sanitizeHtml(input);
      expect(clean).toBe('Just plain text');
    });

    it('should handle text with HTML entities', () => {
      const input = '&lt;script&gt;alert()&lt;/script&gt;';
      const clean = sanitizeHtml(input);
      expect(clean).toContain('&lt;');
      expect(clean).toContain('&gt;');
    });

    it('should handle malformed HTML', () => {
      const input = '<p>Unclosed paragraph<div>Nested wrong</p></div>';
      const clean = sanitizeHtml(input);
      // Should not crash
      expect(clean).toBeDefined();
    });

    it('should handle very long strings', () => {
      const longString = '<p>' + 'a'.repeat(100000) + '</p>';
      const clean = sanitizeHtml(longString);
      expect(clean).toContain('<p>');
      expect(clean.length).toBeGreaterThan(100000);
    });

    it('should handle Unicode characters', () => {
      const input = '<p>Hello 世界 🌍 café</p>';
      const clean = sanitizeHtml(input);
      expect(clean).toContain('世界');
      expect(clean).toContain('🌍');
      expect(clean).toContain('café');
    });

    it('should handle nested allowed tags', () => {
      const input = '<p><strong><em>Nested</em></strong></p>';
      const clean = sanitizeHtml(input);
      expect(clean).toContain('<p>');
      expect(clean).toContain('<strong>');
      expect(clean).toContain('<em>');
    });

    it('should handle deeply nested structures', () => {
      let input = 'text';
      for (let i = 0; i < 100; i++) {
        input = `<p>${input}</p>`;
      }
      const clean = sanitizeHtml(input);
      expect(clean).toBeDefined();
      expect(clean).toContain('text');
    });
  });

  describe('common attack patterns', () => {
    it('should block SVG-based XSS', () => {
      const dirty = '<svg><script>alert("XSS")</script></svg>';
      const clean = sanitizeHtml(dirty);
      expect(clean).not.toContain('<svg');
      expect(clean).not.toContain('script');
    });

    it('should block form tags', () => {
      const dirty = '<form action="https://evil.com"><input type="submit"></form>';
      const clean = sanitizeHtml(dirty);
      expect(clean).not.toContain('<form');
      expect(clean).not.toContain('<input');
    });

    it('should block meta refresh redirects', () => {
      const dirty = '<meta http-equiv="refresh" content="0;url=https://evil.com">';
      const clean = sanitizeHtml(dirty);
      expect(clean).not.toContain('<meta');
    });

    it('should block base tag hijacking', () => {
      const dirty = '<base href="https://evil.com/">';
      const clean = sanitizeHtml(dirty);
      expect(clean).not.toContain('<base');
    });

    it('should handle obfuscated XSS attempts', () => {
      const patterns = [
        '<IMG SRC=j&#X41vascript:alert("XSS")>',
        '<IMG SRC=&#106;&#97;&#118;&#97;&#115;&#99;&#114;&#105;&#112;&#116;&#58;alert("XSS")>',
        '<IMG SRC="jav\tascript:alert(\'XSS\');">',
        '<IMG SRC="jav&#x09;ascript:alert(\'XSS\');">',
      ];

      patterns.forEach(pattern => {
        const clean = sanitizeHtml(pattern);
        expect(clean).not.toContain('javascript:');
        expect(clean).not.toContain('alert');
      });
    });
  });

  describe('whitespace and formatting', () => {
    it('should preserve whitespace in allowed tags', () => {
      const input = '<p>Line 1\n\nLine 2</p>';
      const clean = sanitizeHtml(input);
      expect(clean).toContain('Line 1');
      expect(clean).toContain('Line 2');
    });

    it('should preserve multiple spaces', () => {
      const input = '<p>word1    word2</p>';
      const clean = sanitizeHtml(input);
      expect(clean).toContain('word1');
      expect(clean).toContain('word2');
    });
  });
});

describe('sanitizeInput', () => {
  describe('basic sanitization', () => {
    it('should trim leading whitespace', () => {
      const input = '   hello';
      const clean = sanitizeInput(input);
      expect(clean).toBe('hello');
    });

    it('should trim trailing whitespace', () => {
      const input = 'hello   ';
      const clean = sanitizeInput(input);
      expect(clean).toBe('hello');
    });

    it('should trim both leading and trailing whitespace', () => {
      const input = '  hello world  ';
      const clean = sanitizeInput(input);
      expect(clean).toBe('hello world');
    });

    it('should remove null bytes', () => {
      const input = 'hello\0world';
      const clean = sanitizeInput(input);
      expect(clean).toBe('helloworld');
      expect(clean).not.toContain('\0');
    });

    it('should remove multiple null bytes', () => {
      const input = 'te\0st\0ing\0';
      const clean = sanitizeInput(input);
      expect(clean).toBe('testing');
    });
  });

  describe('edge cases', () => {
    it('should handle empty string', () => {
      const clean = sanitizeInput('');
      expect(clean).toBe('');
    });

    it('should handle string with only whitespace', () => {
      const clean = sanitizeInput('   \t\n  ');
      expect(clean).toBe('');
    });

    it('should handle non-string input by returning as-is', () => {
      expect(sanitizeInput(123 as any)).toBe(123);
      expect(sanitizeInput(null as any)).toBe(null);
      expect(sanitizeInput(undefined as any)).toBe(undefined);
      expect(sanitizeInput({ key: 'value' } as any)).toEqual({ key: 'value' });
    });

    it('should preserve internal whitespace', () => {
      const input = '  hello   world  ';
      const clean = sanitizeInput(input);
      expect(clean).toBe('hello   world');
    });

    it('should handle tabs and newlines', () => {
      const input = '  hello\t\nworld  ';
      const clean = sanitizeInput(input);
      expect(clean).toBe('hello\t\nworld');
    });
  });

  describe('security-focused cases', () => {
    it('should handle SQL injection attempts', () => {
      const input = "  ' OR '1'='1  ";
      const clean = sanitizeInput(input);
      expect(clean).toBe("' OR '1'='1");
      // Note: This doesn't prevent SQL injection, just normalizes input
      // SQL injection prevention should happen at query level
    });

    it('should handle path traversal attempts', () => {
      const input = '  ../../etc/passwd  ';
      const clean = sanitizeInput(input);
      expect(clean).toBe('../../etc/passwd');
      // Note: Path sanitization should be done separately
    });

    it('should handle command injection attempts', () => {
      const input = '  ; rm -rf /  ';
      const clean = sanitizeInput(input);
      expect(clean).toBe('; rm -rf /');
      // Note: Command execution should be avoided or properly escaped
    });

    it('should preserve special characters that might be part of valid input', () => {
      const input = '  user@example.com  ';
      const clean = sanitizeInput(input);
      expect(clean).toBe('user@example.com');
    });

    it('should handle Unicode null bytes', () => {
      const input = 'test\u0000ing';
      const clean = sanitizeInput(input);
      expect(clean).toBe('testing');
    });
  });

  describe('real-world input patterns', () => {
    it('should handle email addresses', () => {
      const input = '  john.doe+test@example.com  ';
      const clean = sanitizeInput(input);
      expect(clean).toBe('john.doe+test@example.com');
    });

    it('should handle usernames', () => {
      const input = '  user_name-123  ';
      const clean = sanitizeInput(input);
      expect(clean).toBe('user_name-123');
    });

    it('should handle search queries', () => {
      const input = '  how to prevent XSS  ';
      const clean = sanitizeInput(input);
      expect(clean).toBe('how to prevent XSS');
    });

    it('should handle URLs', () => {
      const input = '  https://example.com/path?query=value  ';
      const clean = sanitizeInput(input);
      expect(clean).toBe('https://example.com/path?query=value');
    });

    it('should handle file names', () => {
      const input = '  document-v2.1_final.pdf  ';
      const clean = sanitizeInput(input);
      expect(clean).toBe('document-v2.1_final.pdf');
    });
  });

  describe('Unicode handling', () => {
    it('should preserve Unicode characters', () => {
      const input = '  你好世界  ';
      const clean = sanitizeInput(input);
      expect(clean).toBe('你好世界');
    });

    it('should preserve emojis', () => {
      const input = '  Hello 👋 World 🌍  ';
      const clean = sanitizeInput(input);
      expect(clean).toBe('Hello 👋 World 🌍');
    });

    it('should handle mixed Unicode scripts', () => {
      const input = '  English 中文 العربية עברית  ';
      const clean = sanitizeInput(input);
      expect(clean).toBe('English 中文 العربية עברית');
    });
  });
});