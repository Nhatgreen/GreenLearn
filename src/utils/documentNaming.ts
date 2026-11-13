import { normalizeNFC } from './textNormalization';

/**
 * Kiểm tra xem tên file có phải là mã máy, hash ngẫu nhiên hoặc tên chụp từ camera/điện thoại
 */
export function isCameraOrMachineGeneratedName(nameWithoutExt: string): boolean {
  const clean = nameWithoutExt.trim();
  if (!clean) return true;

  // Dãy số ngẫu nhiên dài (ví dụ: 815733508_129482..., 1712938472938...)
  if (/^\d{8,}/.test(clean) || /^[0-9_-]{8,}$/.test(clean)) {
    return true;
  }

  // UUID
  if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(clean)) {
    return true;
  }

  // Tên ảnh chụp tiêu chuẩn của các dòng máy ảnh & smartphone (Samsung, iPhone, Pixel, Xiaomi...)
  // Ví dụ: IMG_20260312_142030, PXL_20260401, DSC_0042, Screenshot_2026...
  const cameraPatterns = /^(IMG|PXL|DSC|PHOTO|PIC|CAMERA|CAPTURE|SCREENSHOT|SCREEN_SHOT|IMAGE|WP|DCIM)[-_0-9A-Z]*$/i;
  if (cameraPatterns.test(clean)) {
    return true;
  }

  // Tên dạng "Ảnh chụp màn hình 2026-..."
  if (/^(ảnh\s*chụp\s*màn\s*hình|screen\s*shot)[-_0-9\s:]*$/i.test(clean)) {
    return true;
  }

  return false;
}

/**
 * Định dạng thời gian thành chuỗi DD/MM HH:mm (giờ Việt Nam)
 */
function formatDateTimeVN(timestamp?: number): string {
  const date = timestamp ? new Date(timestamp) : new Date();
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return `${day}/${month} ${hours}:${minutes}`;
}

/**
 * Chuẩn hóa tên tài liệu/hình ảnh tải lên:
 * - Tự động phát hiện và làm sạch các tên file ảnh chụp camera, hash máy rác thành 'Ảnh chụp DD/MM HH:mm'
 * - Loại bỏ phần mở rộng tệp (.pdf, .docx, .png...)
 * - Thay thế dấu gạch dưới và khoảng trắng thừa, chuẩn hóa Unicode NFC
 */
export function formatUploadedDocTitle(
  fileName: string,
  isImage?: boolean,
  fileTimestamp?: number
): string {
  if (!fileName || typeof fileName !== 'string') {
    return isImage ? `Ảnh chụp ${formatDateTimeVN(fileTimestamp)}` : 'Tài liệu mới';
  }

  // 1. Tách phần tên không có extension
  const rawWithoutExt = fileName.replace(/\.[^/.]+$/, '').trim();

  // 2. Nếu là ảnh và tên là dạng camera/mã máy
  if (isImage || /\.(png|jpe?g|webp|gif|bmp|heic|svg)$/i.test(fileName)) {
    if (isCameraOrMachineGeneratedName(rawWithoutExt)) {
      return `Ảnh chụp ${formatDateTimeVN(fileTimestamp)}`;
    }
  }

  // 3. Với tài liệu văn bản / sách
  if (!rawWithoutExt) {
    return isImage ? `Ảnh chụp ${formatDateTimeVN(fileTimestamp)}` : 'Tài liệu không tên';
  }

  // Làm sạch dấu gạch dưới, khoảng trắng dư thừa
  const readable = rawWithoutExt
    .replace(/[_-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  return normalizeNFC(readable);
}
