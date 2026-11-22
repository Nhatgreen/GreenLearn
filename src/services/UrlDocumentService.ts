import { parseUploadedDocumentResult, type UploadedParseResult } from './OfficeParserService';

export interface UrlImportResult {
  title: string;
  sourceUrl: string;
  parsed: UploadedParseResult;
}

export class UrlSharePermissionError extends Error {
  readonly guideSteps: string[];

  constructor(message: string, guideSteps: string[]) {
    super(message);
    this.name = 'UrlSharePermissionError';
    this.guideSteps = guideSteps;
  }
}

export const GOOGLE_SHARE_GUIDE_STEPS = [
  'Mở tài liệu gốc trên Google Docs / Sheets / Slides.',
  'Bấm nút "Chia sẻ" (Share) ở góc trên bên phải.',
  'Tại mục "Quyền truy cập chung" (General access), đổi từ "Bị hạn chế" sang "Bất kỳ ai có đường liên kết" (Anyone with the link) với vai trò Người xem (Viewer).',
  'Bấm biểu tượng bánh răng (Cài đặt) trong hộp thoại Chia sẻ và đảm bảo đang bật "Người xem và người nhận xét có thể thấy tùy chọn tải xuống, in và sao chép".',
  'Sao chép lại liên kết và bấm "Thử đưa vào lại" ở đây.'
];

export const GENERAL_URL_GUIDE_STEPS = [
  'Kiểm tra lại đường liên kết có cho phép truy cập công khai mà không cần đăng nhập hay không.',
  'Đảm bảo tài liệu gốc bật quyền tải về cho mọi người.',
  'Nếu trang web chặn tải trực tiếp từ trình duyệt (CORS), bạn có thể tải tệp về máy (.pdf, .docx, .xlsx, .pptx) rồi kéo thả thẳng vào bàn học.'
];

export interface ResolvedDocumentUrl {
  provider: 'google_docs' | 'google_sheets' | 'google_slides' | 'google_drive' | 'direct';
  fetchUrl: string;
  defaultFileName: string;
  defaultTitle: string;
  expectedKind: 'docx' | 'xlsx' | 'pptx' | 'auto';
}

export function resolveImportableUrl(rawUrl: string): ResolvedDocumentUrl {
  const trimmed = rawUrl.trim();
  let parsedUrl: URL;
  try {
    parsedUrl = new URL(trimmed);
  } catch {
    throw new Error('Đường liên kết không hợp lệ. Vui lòng dán đầy đủ URL bắt đầu bằng https://');
  }

  if (parsedUrl.protocol !== 'https:' && parsedUrl.protocol !== 'http:') {
    throw new Error('Chỉ hỗ trợ liên kết HTTP/HTTPS.');
  }

  const href = parsedUrl.href;

  // Google Docs
  const docsMatch = href.match(/docs\.google\.com\/document\/d\/([a-zA-Z0-9_-]+)/);
  if (docsMatch) {
    const id = docsMatch[1];
    return {
      provider: 'google_docs',
      fetchUrl: `https://docs.google.com/document/d/${id}/export?format=docx`,
      defaultFileName: `google-doc-${id.slice(0, 6)}.docx`,
      defaultTitle: 'Tài liệu Google Docs',
      expectedKind: 'docx',
    };
  }

  // Google Sheets
  const sheetsMatch = href.match(/docs\.google\.com\/spreadsheets\/d\/([a-zA-Z0-9_-]+)/);
  if (sheetsMatch) {
    const id = sheetsMatch[1];
    return {
      provider: 'google_sheets',
      fetchUrl: `https://docs.google.com/spreadsheets/d/${id}/export?format=xlsx`,
      defaultFileName: `google-sheet-${id.slice(0, 6)}.xlsx`,
      defaultTitle: 'Bảng tính Google Sheets',
      expectedKind: 'xlsx',
    };
  }

  // Google Slides
  const slidesMatch = href.match(/docs\.google\.com\/presentation\/d\/([a-zA-Z0-9_-]+)/);
  if (slidesMatch) {
    const id = slidesMatch[1];
    return {
      provider: 'google_slides',
      fetchUrl: `https://docs.google.com/presentation/d/${id}/export/pptx`,
      defaultFileName: `google-slides-${id.slice(0, 6)}.pptx`,
      defaultTitle: 'Bài trình chiếu Google Slides',
      expectedKind: 'pptx',
    };
  }

  // Google Drive file link
  const driveFileMatch =
    href.match(/drive\.google\.com\/file\/d\/([a-zA-Z0-9_-]+)/) ||
    href.match(/drive\.google\.com\/open\?id=([a-zA-Z0-9_-]+)/);
  if (driveFileMatch) {
    const id = driveFileMatch[1];
    return {
      provider: 'google_drive',
      fetchUrl: `https://drive.google.com/uc?export=download&id=${id}`,
      defaultFileName: `drive-file-${id.slice(0, 6)}.pdf`,
      defaultTitle: 'Tài liệu Google Drive',
      expectedKind: 'auto',
    };
  }

  const pathSegment = parsedUrl.pathname.split('/').filter(Boolean).pop() || 'tai-lieu';
  const cleanName = decodeURIComponent(pathSegment).replace(/\.[^/.]+$/, '') || 'Tài liệu từ liên kết';
  return {
    provider: 'direct',
    fetchUrl: href,
    defaultFileName: decodeURIComponent(pathSegment) || 'document.txt',
    defaultTitle: cleanName,
    expectedKind: 'auto',
  };
}

function inferExtensionFromContentType(contentType: string, fallbackName: string): string {
  const ct = contentType.toLowerCase();
  if (ct.includes('pdf')) return 'pdf';
  if (ct.includes('wordprocessingml')) return 'docx';
  if (ct.includes('spreadsheetml') || ct.includes('ms-excel')) return 'xlsx';
  if (ct.includes('presentationml')) return 'pptx';
  if (ct.includes('csv')) return 'csv';
  if (ct.includes('plain') || ct.includes('markdown')) return 'txt';
  const ext = fallbackName.split('.').pop()?.toLowerCase();
  return ext || 'txt';
}

function extractReadableTextFromHtml(html: string): { title: string; text: string } {
  const titleMatch = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
  const title = titleMatch ? titleMatch[1].replace(/\s+/g, ' ').trim() : '';
  const bodyMatch = html.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
  const rawBody = bodyMatch ? bodyMatch[1] : html;
  const cleaned = rawBody
    .replace(/<(script|style|noscript|svg)[^>]*>[\s\S]*?<\/\1>/gi, ' ')
    .replace(/<\/(p|div|h1|h2|h3|h4|h5|h6|li|tr|section|article)>/gi, '\n\n')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/[ \t]+/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim();

  return { title, text: cleaned };
}

export async function importDocumentFromUrl(
  rawUrl: string,
  customTitle?: string
): Promise<UrlImportResult> {
  const resolved = resolveImportableUrl(rawUrl);
  const isGoogle = resolved.provider !== 'direct';
  const guide = isGoogle ? GOOGLE_SHARE_GUIDE_STEPS : GENERAL_URL_GUIDE_STEPS;

  let response: Response;
  try {
    response = await fetch(resolved.fetchUrl, {
      method: 'GET',
      credentials: 'omit',
      redirect: 'follow',
    });
  } catch {
    throw new UrlSharePermissionError(
      isGoogle
        ? 'Không thể tải tài liệu Google vì chưa bật chia sẻ tải về công khai cho mọi người.'
        : 'Không thể truy cập liên kết này do yêu cầu đăng nhập hoặc chặn tải từ trình duyệt.',
      guide
    );
  }

  if (
    response.status === 401 ||
    response.status === 403 ||
    response.url.includes('accounts.google.com')
  ) {
    throw new UrlSharePermissionError(
      'Tài liệu gốc chưa được chia sẻ công khai để mọi người có thể xem và tải về.',
      guide
    );
  }

  if (!response.ok) {
    throw new UrlSharePermissionError(
      `Không thể tải tài liệu (mã lỗi ${response.status}). Vui lòng kiểm tra quyền chia sẻ của tài liệu gốc.`,
      guide
    );
  }

  const contentType = response.headers.get('content-type') || '';
  if (contentType.toLowerCase().includes('text/html')) {
    const html = await response.text();
    const looksLikeLoginGate =
      /accounts\.google\.com|ServiceLogin|Sign in to continue|Access Denied|Request access/i.test(html);

    if (isGoogle || looksLikeLoginGate) {
      throw new UrlSharePermissionError(
        'Tài liệu gốc đang ở chế độ riêng tư hoặc tắt quyền tải về. Hãy bật chia sẻ công khai rồi thử lại.',
        guide
      );
    }

    const { title: htmlTitle, text } = extractReadableTextFromHtml(html);
    if (!text) {
      throw new Error('Trang web này không có nội dung văn bản đọc được.');
    }
    const finalTitle = customTitle?.trim() || htmlTitle || resolved.defaultTitle;
    const txtFile = new File([text], `${finalTitle}.txt`, { type: 'text/plain' });
    const parsed = await parseUploadedDocumentResult(txtFile, finalTitle);
    return { title: finalTitle, sourceUrl: rawUrl.trim(), parsed };
  }

  const buffer = await response.arrayBuffer();
  if (!buffer || buffer.byteLength === 0) {
    throw new UrlSharePermissionError(
      'Không nhận được dữ liệu từ liên kết. Hãy kiểm tra quyền chia sẻ công khai của tài liệu gốc.',
      guide
    );
  }

  const ext =
    resolved.expectedKind !== 'auto'
      ? resolved.expectedKind
      : inferExtensionFromContentType(contentType, resolved.defaultFileName);
  const finalTitle = customTitle?.trim() || resolved.defaultTitle;
  const fileName = `${finalTitle}.${ext}`;
  const file = new File([buffer], fileName, { type: contentType || 'application/octet-stream' });

  const parsed = await parseUploadedDocumentResult(file, finalTitle);
  return { title: finalTitle, sourceUrl: rawUrl.trim(), parsed };
}
