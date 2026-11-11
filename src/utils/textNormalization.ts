/**
 * Chuẩn hóa Unicode NFC toàn hệ thống GreenLearn / ViTudy.
 * Loại bỏ triệt để lỗi dấu rời (như 'Tuầ´n', 'trắ´c') và bảo toàn 100% khoảng trắng tự nhiên (space, tab, newline).
 */
export function normalizeNFC(input: string | null | undefined): string {
  if (!input) return '';
  return input.normalize('NFC');
}

export function normalizeNFCPreserveWhitespace(input: string | null | undefined): string {
  if (!input) return '';
  return input.normalize('NFC');
}

export function normalizeNFCAndTrim(input: string | null | undefined): string {
  if (!input) return '';
  return input.normalize('NFC').trim();
}
