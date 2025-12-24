import DOMPurify from 'dompurify';
import { JSDOM } from 'jsdom';

// Server-side DOM implementation for DOMPurify
const window = new JSDOM('').window;
const purify = DOMPurify(window as any);

export function sanitizeHtml(dirty: string): string {
  if (!dirty) return '';
  
  // Pre-process to remove null bytes as DOMPurify might not strip them in all contexts
  const cleanDirty = dirty.replace(/\0/g, '');

  return purify.sanitize(cleanDirty, {
    ALLOWED_TAGS: [
      'b', 'i', 'em', 'strong', 'a', 'p', 'br', 'ul', 'ol', 'li', 'code', 'pre'
    ],
    ALLOWED_ATTR: ['href', 'target', 'rel'],
    ALLOW_DATA_ATTR: false, // Explicitly disallow data- attributes
  });
}

export function sanitizeInput(input: string): string {
    if (typeof input !== 'string') return input;

    // Normalize Unicode to NFC form to avoid visual spoofing and ensure consistency
    let sanitized = input.normalize('NFC');

    // Remove control characters (ASCII 0-31) except for allowed whitespace (\n, \r, \t)
    // \x00-\x08 matches 0-8
    // \x0B-\x0C matches 11-12 (vertical tab, form feed)
    // \x0E-\x1F matches 14-31
    // This preserves \t (9), \n (10), \r (13)
    sanitized = sanitized.replace(/[\x00-\x08\x0B-\x0C\x0E-\x1F]/g, '');

    // Trim whitespace from start and end
    return sanitized.trim();
}
