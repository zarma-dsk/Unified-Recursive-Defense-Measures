import DOMPurify from 'dompurify';
import { JSDOM } from 'jsdom';

// Server-side DOM implementation for DOMPurify
const window = new JSDOM('').window;
const purify = DOMPurify(window as any);

/**
 * Sanitizes HTML content to prevent XSS attacks.
 *
 * Uses DOMPurify to strip dangerous tags and attributes.
 * Additionally enforces:
 * - Removal of null bytes before processing (to prevent parser evasions).
 * - Explicit disallowance of `data-` attributes.
 *
 * Allowed tags: `b`, `i`, `em`, `strong`, `a`, `p`, `br`, `ul`, `ol`, `li`, `code`, `pre`
 * Allowed attributes: `href`, `target`, `rel`
 *
 * @param dirty - The potentially unsafe HTML string.
 * @returns The sanitized HTML string.
 */
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

/**
 * Sanitizes plain text input for general use.
 *
 * Performs the following operations:
 * 1. Unicode Normalization (NFC): Prevents visual spoofing by ensuring consistent byte representation.
 * 2. Control Character Removal: Strips non-printable ASCII characters (0-31) which can be used for log injection or other attacks.
 *    - Preserves standard whitespace: Newline (\n), Carriage Return (\r), and Tab (\t).
 * 3. Trimming: Removes leading and trailing whitespace.
 *
 * @param input - The string to sanitize.
 * @returns The sanitized plain text string.
 */
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
