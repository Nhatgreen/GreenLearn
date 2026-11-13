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

/**
 * Tự chữa lành và làm sạch văn bản tài liệu trích xuất từ tệp tải lên (.docx, .pptx, .pdf, .txt, .md).
 * Loại bỏ triệt để:
 * - Ký tự NULL \u0000 và các ký tự điều khiển không in được (ngoại trừ newline \n, tab \t, \r).
 * - Ký tự thay thế Unicode lỗi \uFFFD.
 * - Chuỗi nhị phân ZIP PK\x03\x04 nếu có lọt vào do đọc nhầm file.
 * - Chuẩn hóa ngắt dòng \r\n thành \n và áp dụng Unicode NFC.
 */
export function sanitizeDocumentText(input: string | null | undefined): string {
  if (!input) return '';

  // 1. Nếu bắt đầu bằng hoặc chứa chữ ký binary ZIP header PK\x03\x04 kèm ký tự NULL
  if (input.includes('PK\x03\x04') || input.startsWith('PK')) {
    const nullCount = (input.match(/\0/g) || []).length;
    if (nullCount > 3 || input.includes('\x00\x00')) {
      return '';
    }
  }

  // 2. Loại bỏ ký tự NULL \u0000, \uFFFD và ký tự điều khiển độc hại
  // Giữ lại: \t (0x09), \n (0x0A), \r (0x0D), và các ký tự printable >= 0x20
  let cleaned = input
    .replace(/\0/g, '')
    .replace(/\uFFFD/g, '')
    .replace(/[\x01-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '');

  // 3. Chuẩn hóa ngắt dòng
  cleaned = cleaned.replace(/\r\n/g, '\n').replace(/\r/g, '\n');

  // 4. Chuẩn hóa Unicode NFC
  return cleaned.normalize('NFC').trim();
}

