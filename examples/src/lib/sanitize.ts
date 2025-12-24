import DOMPurify from 'dompurify';
import { JSDOM } from 'jsdom';

// Server-side DOM implementation for DOMPurify
const window = new JSDOM('').window;
const purify = DOMPurify(window as any);

/**
 * Produce a sanitized HTML string containing only a restricted set of safe tags and attributes.
 *
 * @param dirty - The potentially unsafe HTML input to sanitize.
 * @returns The sanitized HTML preserving only allowed tags and attributes (allowed tags: `b`, `i`, `em`, `strong`, `a`, `p`, `br`, `ul`, `ol`, `li`, `code`, `pre`; allowed attributes: `href`, `target`, `rel`). Returns an empty string if `dirty` is falsy.
 */
export function sanitizeHtml(dirty: string): string {
  if (!dirty) return '';
  
  return purify.sanitize(dirty, {
    ALLOWED_TAGS: [
      'b', 'i', 'em', 'strong', 'a', 'p', 'br', 'ul', 'ol', 'li', 'code', 'pre'
    ],
    ALLOWED_ATTR: ['href', 'target', 'rel'],
  });
}

/**
 * Performs minimal sanitization of a text input.
 *
 * Trims surrounding whitespace and removes all null-byte characters from the string.
 *
 * @param input - The value to sanitize; if not a string, it is returned unchanged.
 * @returns The sanitized string with leading/trailing whitespace removed and `\0` characters stripped; non-string inputs are returned as provided.
 */
export function sanitizeInput(input: string): string {
    if (typeof input !== 'string') return input;
    // Basic sanitization for simple inputs (trim, remove null bytes)
    return input.trim().replace(/\0/g, '');
}