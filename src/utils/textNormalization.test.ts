import { describe, it, expect } from 'vitest';
import { normalizeNFC, normalizeNFCPreserveWhitespace, normalizeNFCAndTrim } from './textNormalization';

describe('textNormalization', () => {
  it('preserves spaces and spaces at the end when typing', () => {
    expect(normalizeNFC('lỗi ')).toBe('lỗi ');
    expect(normalizeNFCPreserveWhitespace('lỗi ')).toBe('lỗi ');
    expect(normalizeNFC('  ghi chú  ')).toBe('  ghi chú  ');
  });

  it('normalizes decomposed Unicode marks into standard NFC', () => {
    // 'u' + combining hook above + 'a' + combining circumflex and acute
    const decomposed = 'Tu\u1EA7n';
    expect(normalizeNFC(decomposed)).toBe('Tuần');
  });

  it('trims only when explicitly using normalizeNFCAndTrim', () => {
    expect(normalizeNFCAndTrim('  lỗi ghi chú  ')).toBe('lỗi ghi chú');
  });

  it('handles null or undefined safely', () => {
    expect(normalizeNFC(null)).toBe('');
    expect(normalizeNFC(undefined)).toBe('');
    expect(normalizeNFCPreserveWhitespace(null)).toBe('');
    expect(normalizeNFCAndTrim(null)).toBe('');
  });
});
