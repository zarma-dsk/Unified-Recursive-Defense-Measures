import { describe, it, expect } from 'vitest';
import { sanitizeInput } from '../../../src/lib/sanitize';

describe('sanitizeInput Enhanced Logic', () => {
  describe('Unicode Normalization', () => {
    it('should normalize decomposed characters to NFC', () => {
      // 'A' + combining acute accent
      const decomposed = '\u0041\u0301';
      // 'Á' precomposed
      const precomposed = '\u00C1';

      const result = sanitizeInput(decomposed);
      expect(result).toBe(precomposed);
      expect(result.length).toBe(1);
    });

    it('should normalize compatibility characters', () => {
      // 'A' + combining acute accent
      const decomposed = '\u0041\u0301';
      // 'Á' precomposed
      const precomposed = '\u00C1';

      expect(sanitizeInput(decomposed)).toBe(precomposed);
    });
  });

  describe('Control Character Removal', () => {
    it('should remove bell character \x07', () => {
      const input = 'Ding\x07Dong';
      expect(sanitizeInput(input)).toBe('DingDong');
    });

    it('should remove escape character \x1B', () => {
      const input = 'Exit\x1B';
      expect(sanitizeInput(input)).toBe('Exit');
    });

    it('should remove backspace \x08', () => {
      const input = 'Back\x08space';
      expect(sanitizeInput(input)).toBe('Backspace');
    });

    it('should remove vertical tab \x0B', () => {
      const input = 'Vertical\x0BTab';
      expect(sanitizeInput(input)).toBe('VerticalTab');
    });

    it('should preserve newlines \n', () => {
      const input = 'Line\nBreak';
      expect(sanitizeInput(input)).toBe('Line\nBreak');
    });

    it('should preserve carriage returns \r', () => {
      const input = 'Carriage\rReturn';
      expect(sanitizeInput(input)).toBe('Carriage\rReturn');
    });

    it('should preserve tabs \t', () => {
      const input = 'Tab\tCharacter';
      expect(sanitizeInput(input)).toBe('Tab\tCharacter');
    });

    it('should remove mix of allowed and disallowed control chars', () => {
      // \x07 (bell) - remove
      // \n (newline) - keep
      // \x00 (null) - remove
      const input = 'Mix\x07ed\nCon\x00tent';
      expect(sanitizeInput(input)).toBe('Mixed\nContent');
    });
  });
});
