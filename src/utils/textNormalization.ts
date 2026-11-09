/**
 * Chuẩn hóa Unicode NFC toàn hệ thống ViTudy.
 * Loại bỏ triệt để lỗi dấu rời (như 'Tuầ´n', 'trắ´c') và làm sạch khoảng trắng.
 */
export function normalizeNFC(input: string | null | undefined): string {
  if (!input) return '';
  return input.normalize('NFC').trim();
}

export function normalizeNFCPreserveWhitespace(input: string | null | undefined): string {
  if (!input) return '';
  return input.normalize('NFC');
}
