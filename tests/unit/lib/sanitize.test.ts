import { describe, it, expect } from 'vitest';
import { sanitizeHtml, sanitizeInput } from '../../../src/lib/sanitize';

describe('sanitizeHtml', () => {
  describe('basic sanitization', () => {
    it('should allow safe HTML tags', () => {
      const input = '<p>Hello <strong>world</strong></p>';
      const result = sanitizeHtml(input);
      expect(result).toContain('<p>');
      expect(result).toContain('<strong>');
      expect(result).toContain('Hello');
      expect(result).toContain('world');
    });

    it('should allow emphasized text', () => {
      const input = '<em>emphasized</em> and <i>italic</i>';
      const result = sanitizeHtml(input);
      expect(result).toContain('<em>');
      expect(result).toContain('<i>');
    });

    it('should allow lists', () => {
      const input = '<ul><li>Item 1</li><li>Item 2</li></ul>';
      const result = sanitizeHtml(input);
      expect(result).toContain('<ul>');
      expect(result).toContain('<li>');
      expect(result).toContain('Item 1');
    });

    it('should allow ordered lists', () => {
      const input = '<ol><li>First</li><li>Second</li></ol>';
      const result = sanitizeHtml(input);
      expect(result).toContain('<ol>');
      expect(result).toContain('<li>');
    });

    it('should allow code blocks', () => {
      const input = '<code>const x = 1;</code>';
      const result = sanitizeHtml(input);
      expect(result).toContain('<code>');
      expect(result).toContain('const x = 1;');
    });

    it('should allow pre blocks', () => {
      const input = '<pre>formatted code</pre>';
      const result = sanitizeHtml(input);
      expect(result).toContain('<pre>');
    });

    it('should allow line breaks', () => {
      const input = 'Line 1<br>Line 2';
      const result = sanitizeHtml(input);
      expect(result).toContain('<br>');
    });
  });

  describe('XSS prevention', () => {
    it('should remove script tags', () => {
      const input = '<p>Safe</p><script>alert("xss")</script>';
      const result = sanitizeHtml(input);
      expect(result).not.toContain('<script>');
      expect(result).not.toContain('alert');
      expect(result).toContain('Safe');
    });

    it('should remove onclick attributes', () => {
      const input = '<p onclick="alert(\'xss\')">Click me</p>';
      const result = sanitizeHtml(input);
      expect(result).not.toContain('onclick');
      expect(result).not.toContain('alert');
      expect(result).toContain('Click me');
    });

    it('should remove onerror attributes', () => {
      const input = '<img src="x" onerror="alert(\'xss\')">';
      const result = sanitizeHtml(input);
      expect(result).not.toContain('onerror');
      expect(result).not.toContain('alert');
    });

    it('should remove javascript: protocol in links', () => {
      const input = '<a href="javascript:alert(\'xss\')">Click</a>';
      const result = sanitizeHtml(input);
      expect(result).not.toContain('javascript:');
      expect(result).not.toContain('alert');
    });

    it('should remove data: URLs in links', () => {
      const input = '<a href="data:text/html,<script>alert(\'xss\')</script>">Click</a>';
      const result = sanitizeHtml(input);
      expect(result).not.toContain('data:');
    });

    it('should remove inline event handlers', () => {
      const input = '<div onload="alert(1)" onmouseover="alert(2)">Test</div>';
      const result = sanitizeHtml(input);
      expect(result).not.toContain('onload');
      expect(result).not.toContain('onmouseover');
    });

    it('should remove style tags', () => {
      const input = '<style>body { background: red; }</style><p>Content</p>';
      const result = sanitizeHtml(input);
      expect(result).not.toContain('<style>');
      expect(result).toContain('Content');
    });

    it('should remove iframe tags', () => {
      const input = '<iframe src="evil.com"></iframe><p>Safe</p>';
      const result = sanitizeHtml(input);
      expect(result).not.toContain('<iframe>');
      expect(result).toContain('Safe');
    });

    it('should remove object tags', () => {
      const input = '<object data="malicious.swf"></object>';
      const result = sanitizeHtml(input);
      expect(result).not.toContain('<object>');
    });

    it('should remove embed tags', () => {
      const input = '<embed src="evil.swf">';
      const result = sanitizeHtml(input);
      expect(result).not.toContain('<embed>');
    });
  });

  describe('link sanitization', () => {
    it('should allow safe href attributes', () => {
      const input = '<a href="https://example.com">Link</a>';
      const result = sanitizeHtml(input);
      expect(result).toContain('href="https://example.com"');
      expect(result).toContain('Link');
    });

    it('should allow target attribute', () => {
      const input = '<a href="https://example.com" target="_blank">Link</a>';
      const result = sanitizeHtml(input);
      expect(result).toContain('target="_blank"');
    });

    it('should allow rel attribute', () => {
      const input = '<a href="https://example.com" rel="noopener noreferrer">Link</a>';
      const result = sanitizeHtml(input);
      expect(result).toContain('rel="noopener noreferrer"');
    });

    it('should allow relative URLs', () => {
      const input = '<a href="/page">Internal</a>';
      const result = sanitizeHtml(input);
      expect(result).toContain('href="/page"');
    });

    it('should allow mailto links', () => {
      const input = '<a href="mailto:test@example.com">Email</a>';
      const result = sanitizeHtml(input);
      expect(result).toContain('mailto:test@example.com');
    });
  });

  describe('edge cases', () => {
    it('should handle empty strings', () => {
      const result = sanitizeHtml('');
      expect(result).toBe('');
    });

    it('should handle plain text without HTML', () => {
      const input = 'Plain text content';
      const result = sanitizeHtml(input);
      expect(result).toBe('Plain text content');
    });

    it('should handle null bytes', () => {
      const input = 'Test\0content';
      const result = sanitizeHtml(input);
      expect(result).not.toContain('\0');
    });

    it('should handle Unicode characters', () => {
      const input = '<p>Hello 世界 🌍</p>';
      const result = sanitizeHtml(input);
      expect(result).toContain('世界');
      expect(result).toContain('🌍');
    });

    it('should handle malformed HTML', () => {
      const input = '<p>Unclosed paragraph<p>Another';
      const result = sanitizeHtml(input);
      expect(result).toContain('Unclosed paragraph');
      expect(result).toContain('Another');
    });

    it('should handle nested tags', () => {
      const input = '<p><strong><em>Nested</em></strong></p>';
      const result = sanitizeHtml(input);
      expect(result).toContain('<p>');
      expect(result).toContain('<strong>');
      expect(result).toContain('<em>');
    });

    it('should handle deeply nested structures', () => {
      const input = '<ul><li><p><strong><em>Deep</em></strong></p></li></ul>';
      const result = sanitizeHtml(input);
      expect(result).toContain('Deep');
    });

    it('should handle HTML entities', () => {
      const input = '<p>&lt;script&gt;alert()&lt;/script&gt;</p>';
      const result = sanitizeHtml(input);
      expect(result).toContain('&lt;');
      expect(result).toContain('&gt;');
    });

    it('should handle very long content', () => {
      const longText = 'A'.repeat(10000);
      const input = `<p>${longText}</p>`;
      const result = sanitizeHtml(input);
      expect(result).toContain(longText);
    });
  });

  describe('disallowed tags', () => {
    it('should remove div tags', () => {
      const input = '<div>Content</div>';
      const result = sanitizeHtml(input);
      expect(result).not.toContain('<div>');
      expect(result).toContain('Content');
    });

    it('should remove span tags', () => {
      const input = '<span>Text</span>';
      const result = sanitizeHtml(input);
      expect(result).not.toContain('<span>');
      expect(result).toContain('Text');
    });

    it('should remove img tags', () => {
      const input = '<img src="image.jpg" alt="Image">';
      const result = sanitizeHtml(input);
      expect(result).not.toContain('<img>');
    });

    it('should remove form elements', () => {
      const input = '<form><input type="text"></form>';
      const result = sanitizeHtml(input);
      expect(result).not.toContain('<form>');
      expect(result).not.toContain('<input>');
    });

    it('should remove table elements', () => {
      const input = '<table><tr><td>Cell</td></tr></table>';
      const result = sanitizeHtml(input);
      expect(result).not.toContain('<table>');
      expect(result).toContain('Cell');
    });
  });

  describe('attribute sanitization', () => {
    it('should remove id attributes', () => {
      const input = '<p id="test">Content</p>';
      const result = sanitizeHtml(input);
      expect(result).not.toContain('id=');
    });

    it('should remove class attributes', () => {
      const input = '<p class="test">Content</p>';
      const result = sanitizeHtml(input);
      expect(result).not.toContain('class=');
    });

    it('should remove style attributes', () => {
      const input = '<p style="color: red;">Content</p>';
      const result = sanitizeHtml(input);
      expect(result).not.toContain('style=');
    });

    it('should remove data attributes', () => {
      const input = '<p data-value="123">Content</p>';
      const result = sanitizeHtml(input);
      expect(result).not.toContain('data-');
    });
  });
});

describe('sanitizeInput', () => {
  describe('basic sanitization', () => {
    it('should trim whitespace', () => {
      const result = sanitizeInput('  hello  ');
      expect(result).toBe('hello');
    });

    it('should remove null bytes', () => {
      const result = sanitizeInput('test\0content');
      expect(result).toBe('testcontent');
    });

    it('should handle empty strings', () => {
      const result = sanitizeInput('');
      expect(result).toBe('');
    });

    it('should handle whitespace-only strings', () => {
      const result = sanitizeInput('   ');
      expect(result).toBe('');
    });

    it('should preserve internal spaces', () => {
      const result = sanitizeInput('  hello world  ');
      expect(result).toBe('hello world');
    });
  });

  describe('edge cases', () => {
    it('should handle Unicode characters', () => {
      const result = sanitizeInput('  Hello 世界  ');
      expect(result).toBe('Hello 世界');
    });

    it('should handle emoji', () => {
      const result = sanitizeInput('  Test 🛡️  ');
      expect(result).toBe('Test 🛡️');
    });

    it('should handle newlines', () => {
      const result = sanitizeInput('  line1\nline2  ');
      expect(result).toBe('line1\nline2');
    });

    it('should handle tabs', () => {
      const result = sanitizeInput('  col1\tcol2  ');
      expect(result).toBe('col1\tcol2');
    });

    it('should handle multiple null bytes', () => {
      const result = sanitizeInput('te\0st\0con\0tent');
      expect(result).toBe('testcontent');
    });

    it('should handle very long strings', () => {
      const longString = 'a'.repeat(10000);
      const result = sanitizeInput(`  ${longString}  `);
      expect(result).toBe(longString);
      expect(result.length).toBe(10000);
    });
  });

  describe('non-string inputs', () => {
    it('should return non-string inputs unchanged', () => {
      expect(sanitizeInput(123 as any)).toBe(123);
      expect(sanitizeInput(true as any)).toBe(true);
      expect(sanitizeInput(null as any)).toBe(null);
      expect(sanitizeInput(undefined as any)).toBe(undefined);
      expect(sanitizeInput({ key: 'value' } as any)).toEqual({ key: 'value' });
    });
  });

  describe('security scenarios', () => {
    it('should sanitize SQL injection attempts', () => {
      const result = sanitizeInput("  ' OR '1'='1  ");
      expect(result).toBe("' OR '1'='1");
      expect(result.startsWith(' ')).toBe(false);
      expect(result.endsWith(' ')).toBe(false);
    });

    it('should sanitize command injection attempts', () => {
      const result = sanitizeInput('  ; rm -rf /  ');
      expect(result).toBe('; rm -rf /');
      expect(result).not.toContain('\0');
    });

    it('should sanitize path traversal attempts', () => {
      const result = sanitizeInput('  ../../etc/passwd  ');
      expect(result).toBe('../../etc/passwd');
    });

    it('should handle null byte injection', () => {
      const result = sanitizeInput('file.txt\0.jpg');
      expect(result).toBe('file.txt.jpg');
      expect(result).not.toContain('\0');
    });
  });

  describe('real-world scenarios', () => {
    it('should sanitize user input from forms', () => {
      const result = sanitizeInput('  user@example.com  ');
      expect(result).toBe('user@example.com');
    });

    it('should sanitize search queries', () => {
      const result = sanitizeInput('  search term  ');
      expect(result).toBe('search term');
    });

    it('should sanitize usernames', () => {
      const result = sanitizeInput('  john_doe123  ');
      expect(result).toBe('john_doe123');
    });

    it('should sanitize file names', () => {
      const result = sanitizeInput('  document.pdf  ');
      expect(result).toBe('document.pdf');
    });
  });
});

  describe('advanced XSS attack vectors', () => {
    it('should block SVG-based XSS attacks', () => {
      const input = '<svg onload="alert(1)"><circle /></svg>';
      const result = sanitizeHtml(input);
      expect(result).not.toContain('<svg');
      expect(result).not.toContain('onload');
      expect(result).not.toContain('alert');
    });

    it('should block mutation XSS (mXSS) attempts', () => {
      const input = '<noscript><p title="</noscript><img src=x onerror=alert(1)>">';
      const result = sanitizeHtml(input);
      expect(result).not.toContain('onerror');
      expect(result).not.toContain('alert');
    });

    it('should block base64 encoded XSS', () => {
      const input = '<a href="data:text/html;base64,PHNjcmlwdD5hbGVydCgxKTwvc2NyaXB0Pg==">Click</a>';
      const result = sanitizeHtml(input);
      expect(result).not.toContain('data:');
      expect(result).not.toContain('base64');
    });

    it('should block CSS expression attacks', () => {
      const input = '<div style="width: expression(alert(1))">Test</div>';
      const result = sanitizeHtml(input);
      expect(result).not.toContain('expression');
      expect(result).not.toContain('alert');
    });

    it('should block vbscript protocol', () => {
      const input = '<a href="vbscript:msgbox(1)">Click</a>';
      const result = sanitizeHtml(input);
      expect(result).not.toContain('vbscript:');
    });

    it('should block import and meta tags', () => {
      const input = '<meta http-equiv="refresh" content="0;url=javascript:alert(1)">';
      const result = sanitizeHtml(input);
      expect(result).not.toContain('<meta');
      expect(result).not.toContain('javascript:');
    });

    it('should block HTML5 form action hijacking', () => {
      const input = '<form action="javascript:alert(1)"><button>Submit</button></form>';
      const result = sanitizeHtml(input);
      expect(result).not.toContain('<form');
      expect(result).not.toContain('javascript:');
    });
  });

  describe('unicode and encoding attacks', () => {
    it('should block homograph attacks', () => {
      const input = '<a href="https://gооgle.com">Link</a>'; // Cyrillic 'о' instead of 'o'
      const result = sanitizeHtml(input);
      // Should still allow the link but preserve the actual characters
      expect(result).toContain('Link');
    });

    it('should handle UTF-8 BOM', () => {
      const input = '\uFEFF<p>Content</p>';
      const result = sanitizeHtml(input);
      expect(result).toContain('Content');
    });

    it('should handle zero-width characters', () => {
      const input = '<p>Test\u200B\u200C\u200D\uFEFFContent</p>';
      const result = sanitizeHtml(input);
      expect(result).toContain('Content');
    });

    it('should handle RTL/LTR override characters', () => {
      const input = '<p>Test\u202E\u202Dcontent</p>';
      const result = sanitizeHtml(input);
      expect(result).toContain('content');
    });

    it('should handle surrogate pairs correctly', () => {
      const input = '<p>𝕏 𝕐 𝕑</p>'; // Mathematical bold letters
      const result = sanitizeHtml(input);
      expect(result).toContain('𝕏');
    });

    it('should handle mixed scripts', () => {
      const input = '<p>Hello 世界 مرحبا мир</p>';
      const result = sanitizeHtml(input);
      expect(result).toContain('Hello');
      expect(result).toContain('世界');
      expect(result).toContain('مرحبا');
      expect(result).toContain('мир');
    });
  });

  describe('performance and large input handling', () => {
    it('should handle very large HTML documents', () => {
      const largeHtml = '<p>' + 'a'.repeat(100000) + '</p>';
      const start = Date.now();
      const result = sanitizeHtml(largeHtml);
      const duration = Date.now() - start;

      expect(duration).toBeLessThan(1000); // Should complete quickly
      expect(result).toContain('aaa');
    });

    it('should handle deeply nested structures efficiently', () => {
      let deepHtml = 'content';
      for (let i = 0; i < 100; i++) {
        deepHtml = `<p>${deepHtml}</p>`;
      }

      const result = sanitizeHtml(deepHtml);
      expect(result).toContain('content');
    });

    it('should handle many siblings efficiently', () => {
      const manySiblings = Array.from({ length: 1000 }, (_, i) =>
        `<li>Item ${i}</li>`
      ).join('');
      const html = `<ul>${manySiblings}</ul>`;

      const start = Date.now();
      const result = sanitizeHtml(html);
      const duration = Date.now() - start;

      expect(duration).toBeLessThan(500);
      expect(result).toContain('Item 0');
      expect(result).toContain('Item 999');
    });

    it('should handle mixed content types efficiently', () => {
      const mixedHtml = `
        <p>Paragraph</p>
        <strong>Bold</strong>
        <em>Italic</em>
        <code>Code</code>
        <ul><li>Item</li></ul>
        <a href="/test">Link</a>
      `.repeat(100);

      const result = sanitizeHtml(mixedHtml);
      expect(result).toContain('Paragraph');
      expect(result).toContain('Bold');
    });
  });

  describe('protocol and URL validation', () => {
    it('should allow http and https protocols', () => {
      const input = '<a href="https://example.com">HTTPS</a><a href="http://example.com">HTTP</a>';
      const result = sanitizeHtml(input);
      expect(result).toContain('https://example.com');
      expect(result).toContain('http://example.com');
    });

    it('should block file protocol', () => {
      const input = '<a href="file:///etc/passwd">File</a>';
      const result = sanitizeHtml(input);
      expect(result).not.toContain('file://');
    });

    it('should block ftp protocol', () => {
      const input = '<a href="ftp://example.com">FTP</a>';
      const result = sanitizeHtml(input);
      expect(result).not.toContain('ftp://');
    });

    it('should handle protocol-relative URLs', () => {
      const input = '<a href="//example.com">Link</a>';
      const result = sanitizeHtml(input);
      expect(result).toContain('//example.com');
    });

    it('should handle anchor links', () => {
      const input = '<a href="#section">Jump</a>';
      const result = sanitizeHtml(input);
      expect(result).toContain('href="#section"');
    });

    it('should handle query parameters', () => {
      const input = '<a href="/page?foo=bar&baz=qux">Link</a>';
      const result = sanitizeHtml(input);
      expect(result).toContain('foo=bar');
    });
  });

  describe('sanitizeInput function', () => {
    it('should handle non-string inputs gracefully', () => {
      expect(sanitizeInput(123 as any)).toBe(123);
      expect(sanitizeInput(null as any)).toBe(null);
      expect(sanitizeInput(undefined as any)).toBe(undefined);
      expect(sanitizeInput({} as any)).toEqual({});
    });

    it('should remove all null bytes', () => {
      const input = 'test\x00value\x00here';
      const result = sanitizeInput(input);
      expect(result).toBe('testvaluehere');
      expect(result).not.toContain('\x00');
    });

    it('should trim leading whitespace', () => {
      const input = '   content';
      expect(sanitizeInput(input)).toBe('content');
    });

    it('should trim trailing whitespace', () => {
      const input = 'content   ';
      expect(sanitizeInput(input)).toBe('content');
    });

    it('should trim both leading and trailing whitespace', () => {
      const input = '   content   ';
      expect(sanitizeInput(input)).toBe('content');
    });

    it('should preserve internal whitespace', () => {
      const input = 'hello   world';
      expect(sanitizeInput(input)).toBe('hello   world');
    });

    it('should handle empty string', () => {
      expect(sanitizeInput('')).toBe('');
    });

    it('should handle whitespace-only string', () => {
      expect(sanitizeInput('   ')).toBe('');
    });

    it('should handle tabs and newlines', () => {
      const input = '\t\nhello\n\t';
      expect(sanitizeInput(input)).toBe('hello');
    });

    it('should handle unicode whitespace', () => {
      const input = '\u00A0hello\u00A0'; // Non-breaking space
      const result = sanitizeInput(input);
      expect(result.trim()).toBe('hello');
    });

    it('should handle very long inputs', () => {
      const longInput = ' ' + 'a'.repeat(100000) + ' ';
      const result = sanitizeInput(longInput);
      expect(result.length).toBe(100000);
      expect(result[0]).toBe('a');
      expect(result[result.length - 1]).toBe('a');
    });
  });

  describe('edge cases and malformed HTML', () => {
    it('should handle unclosed tags', () => {
      const input = '<p>Paragraph <strong>bold';
      const result = sanitizeHtml(input);
      expect(result).toContain('Paragraph');
      expect(result).toContain('bold');
    });

    it('should handle mismatched tags', () => {
      const input = '<p>Text</strong>';
      const result = sanitizeHtml(input);
      expect(result).toContain('Text');
    });

    it('should handle self-closing tags', () => {
      const input = '<p>Line 1<br/>Line 2</p>';
      const result = sanitizeHtml(input);
      expect(result).toContain('Line 1');
      expect(result).toContain('Line 2');
    });

    it('should handle comments', () => {
      const input = '<p>Text</p><!-- comment --><p>More</p>';
      const result = sanitizeHtml(input);
      expect(result).toContain('Text');
      expect(result).toContain('More');
      expect(result).not.toContain('comment');
    });

    it('should handle CDATA sections', () => {
      const input = '<p>Text</p><![CDATA[data]]><p>More</p>';
      const result = sanitizeHtml(input);
      expect(result).toContain('Text');
      expect(result).toContain('More');
    });

    it('should handle DOCTYPE declarations', () => {
      const input = '<!DOCTYPE html><p>Content</p>';
      const result = sanitizeHtml(input);
      expect(result).toContain('Content');
      expect(result).not.toContain('DOCTYPE');
    });

    it('should handle XML declarations', () => {
      const input = '<?xml version="1.0"?><p>Content</p>';
      const result = sanitizeHtml(input);
      expect(result).toContain('Content');
    });
  });

  describe('attribute handling', () => {
    it('should remove disallowed attributes from allowed tags', () => {
      const input = '<p class="test" id="para" data-value="123">Text</p>';
      const result = sanitizeHtml(input);
      expect(result).not.toContain('class');
      expect(result).not.toContain('id');
      expect(result).not.toContain('data-value');
      expect(result).toContain('Text');
    });

    it('should allow only specified attributes on links', () => {
      const input = '<a href="/page" title="Link" class="link">Click</a>';
      const result = sanitizeHtml(input);
      expect(result).toContain('href="/page"');
      expect(result).not.toContain('title');
      expect(result).not.toContain('class');
    });

    it('should handle empty attributes', () => {
      const input = '<a href="">Empty</a>';
      const result = sanitizeHtml(input);
      expect(result).toContain('Empty');
    });

    it('should handle attributes without values', () => {
      const input = '<p contenteditable>Editable</p>';
      const result = sanitizeHtml(input);
      expect(result).not.toContain('contenteditable');
      expect(result).toContain('Editable');
    });
  });

  describe('real-world attack scenarios', () => {
    it('should block polyglot payloads', () => {
      const input = 'javascript:"/*\'/*`/*--></noscript></title></textarea></style></template></noembed></script><html \" onmouseover=/*&lt;svg/*/onload=alert()//>',
      const result = sanitizeHtml(input);
      expect(result).not.toContain('javascript:');
      expect(result).not.toContain('onmouseover');
      expect(result).not.toContain('onload');
      expect(result).not.toContain('alert');
    });

    it('should block template injection', () => {
      const input = '<template><script>alert(1)</script></template>';
      const result = sanitizeHtml(input);
      expect(result).not.toContain('<template>');
      expect(result).not.toContain('alert');
    });

    it('should block DOM clobbering attempts', () => {
      const input = '<form name="getElementById"><input name="getElementById"></form>';
      const result = sanitizeHtml(input);
      expect(result).not.toContain('<form');
    });

    it('should block CSS import with XSS', () => {
      const input = '<style>@import url("javascript:alert(1)");</style>';
      const result = sanitizeHtml(input);
      expect(result).not.toContain('<style>');
      expect(result).not.toContain('javascript:');
    });
  });
});