import DOMPurify from 'dompurify';
import { JSDOM } from 'jsdom';

// Server-side DOM implementation for DOMPurify
const window = new JSDOM('').window;
const purify = DOMPurify(window as any);

export function sanitizeHtml(dirty: string): string {
  if (!dirty) return '';
  
  return purify.sanitize(dirty, {
    ALLOWED_TAGS: [
      'b', 'i', 'em', 'strong', 'a', 'p', 'br', 'ul', 'ol', 'li', 'code', 'pre'
    ],
    ALLOWED_ATTR: ['href', 'target', 'rel'],
  });
}

export function sanitizeInput(input: string): string {
    if (typeof input !== 'string') return input;
    // Basic sanitization for simple inputs (trim, remove null bytes)
    return input.trim().replace(/\0/g, '');
}
