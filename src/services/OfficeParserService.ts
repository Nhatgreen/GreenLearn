import JSZip from 'jszip';
// @ts-ignore
import mammoth from 'mammoth';
import * as XLSX from 'xlsx';
import type { PresentationSlide, SpreadsheetSheet } from '@/types/studyspace';
import { ParsedPage, parsePdfFile } from './PdfParserService';
import { formatUploadedDocTitle } from '@/utils/documentNaming';

export interface ParsedUploadedDocument {
  title: string;
  pages: ParsedPage[];
  fileType: string;
  fileSize: string;
  kind?: 'document' | 'spreadsheet' | 'presentation';
  sheets?: SpreadsheetSheet[];
  slides?: PresentationSlide[];
}

export type UploadedParseResult =
  | { kind: 'document'; pages: ParsedPage[] }
  | { kind: 'spreadsheet'; sheets: SpreadsheetSheet[]; pages: ParsedPage[] }
  | { kind: 'presentation'; slides: PresentationSlide[]; pages: ParsedPage[] };

const CORRUPTED_BINARY_NOTICE =
  'Tài liệu này chứa dữ liệu nhị phân bị lỗi khi tải lên trước đây. Vui lòng xóa và tải lại tệp đúng định dạng (.docx, .pdf, .pptx, .txt).';

/**
 * Kiểm tra xem văn bản đã lưu có bị nhiễm dữ liệu nhị phân (ví dụ đọc nhầm .docx/.zip như text) hay không
 * và làm sạch ký tự NULL (\u0000) để tránh treo MathRenderer / lỗi PostgreSQL.
 */
export function sanitizeDocumentText(text: string): string {
  if (!text) return '';
  if (text.includes('\u0000') || (text.startsWith('PK\x03\x04') && text.length > 500)) {
    return CORRUPTED_BINARY_NOTICE;
  }
  const replacementChars = (text.match(/\uFFFD/g) || []).length;
  if (replacementChars > 30 || (text.length > 200 && replacementChars / text.length > 0.05)) {
    return CORRUPTED_BINARY_NOTICE;
  }
  return text.replace(/\u0000/g, '');
}

/**
 * Kiểm tra xem tệp có chứa chuỗi byte nhị phân hoặc chữ ký không được hỗ trợ
 */
export function isBinaryOrCorrupted(buffer: ArrayBuffer, previewText?: string): { isCorrupted: boolean; reason?: string } {
  const bytes = new Uint8Array(buffer.slice(0, 8));
  
  // Chữ ký .doc cũ (Compound File Binary Format: D0 CF 11 E0)
  if (bytes[0] === 0xD0 && bytes[1] === 0xCF && bytes[2] === 0x11 && bytes[3] === 0xE0) {
    return {
      isCorrupted: true,
      reason: 'Định dạng Word .doc (97-2003 cũ) chưa được hỗ trợ trực tiếp. Vui lòng lưu tệp sang .docx hoặc .pdf rồi tải lại.'
    };
  }

  // Tỷ lệ ký tự Unicode rác \uFFFD hoặc ký tự NULL \u0000 nếu đọc nhầm binary (như ZIP/.docx)
  if (previewText) {
    if (previewText.includes('\u0000') || previewText.startsWith('PK\x03\x04')) {
      return {
        isCorrupted: true,
        reason: 'Tệp chứa dữ liệu nhị phân không thể đọc được dưới dạng văn bản.'
      };
    }
    const replacementChars = (previewText.match(/\uFFFD/g) || []).length;
    if (replacementChars > 15 || (previewText.length > 50 && replacementChars / previewText.length > 0.05)) {
      return {
        isCorrupted: true,
        reason: 'Tệp chứa dữ liệu nhị phân không thể đọc được dưới dạng văn bản.'
      };
    }
  }

  return { isCorrupted: false };
}

/**
 * Chia một văn bản dài thành các trang có độ dài vừa vặn (~1.500 ký tự / trang)
 */
function paginatePlainText(fullText: string, defaultTitlePrefix = 'Trang', startPageNumber = 1): ParsedPage[] {
  const clean = fullText.replace(/\r\n/g, '\n').trim();
  if (!clean) {
    return [{ id: `page-${startPageNumber}-${Date.now()}`, pageNumber: startPageNumber, title: `${defaultTitlePrefix} ${startPageNumber}`, text: 'Trang trống không có văn bản.' }];
  }

  // Nếu văn bản có chứa các heading ##, ưu tiên chia theo heading
  const headingSections = clean.split(/(?=^##\s+)/m);
  if (headingSections.length > 1) {
    const pages: ParsedPage[] = [];
    headingSections.forEach((sec) => {
      const trimmed = sec.trim();
      if (!trimmed) return;
      const firstLine = trimmed.split('\n')[0].replace(/^##\s+/, '').trim();
      const pageNum = startPageNumber + pages.length;
      pages.push({
        id: `page-${pageNum}-${Date.now()}`,
        pageNumber: pageNum,
        title: firstLine ? `${firstLine}` : `${defaultTitlePrefix} ${pageNum}`,
        text: trimmed
      });
    });
    if (pages.length > 0) return pages;
  }

  // Chia theo đoạn văn (\n\n+); nếu không có đoạn kép thì chia theo từng dòng (\n)
  const rawUnits = clean.split(/\n\n+/);
  const units = rawUnits.length === 1 && clean.includes('\n') ? clean.split(/\n+/) : rawUnits;
  const separator = rawUnits.length === 1 && clean.includes('\n') ? '\n' : '\n\n';

  // Tách nhỏ các đoạn đơn lẻ quá dài (> 1600 ký tự) theo ranh giới câu/từ
  const normalizedUnits: string[] = [];
  for (const unit of units) {
    if (unit.length <= 1600) {
      normalizedUnits.push(unit);
      continue;
    }
    let remaining = unit;
    while (remaining.length > 1600) {
      let splitIdx = remaining.lastIndexOf('. ', 1500);
      if (splitIdx < 800) splitIdx = remaining.lastIndexOf(' ', 1500);
      if (splitIdx < 400) splitIdx = 1500;
      normalizedUnits.push(remaining.slice(0, splitIdx + 1).trim());
      remaining = remaining.slice(splitIdx + 1).trim();
    }
    if (remaining) normalizedUnits.push(remaining);
  }

  const pages: ParsedPage[] = [];
  let currentText = '';

  for (const p of normalizedUnits) {
    if (currentText.length + p.length > 1600 && currentText.length > 0) {
      const pageNum = startPageNumber + pages.length;
      pages.push({
        id: `page-${pageNum}-${Date.now()}`,
        pageNumber: pageNum,
        title: `${defaultTitlePrefix} ${pageNum}`,
        text: currentText.trim()
      });
      currentText = p + separator;
    } else {
      currentText += p + separator;
    }
  }

  if (currentText.trim().length > 0) {
    const pageNum = startPageNumber + pages.length;
    pages.push({
      id: `page-${pageNum}-${Date.now()}`,
      pageNumber: pageNum,
      title: `${defaultTitlePrefix} ${pageNum}`,
      text: currentText.trim()
    });
  }

  return pages.length > 0
    ? pages
    : [{ id: `page-${startPageNumber}-${Date.now()}`, pageNumber: startPageNumber, title: `${defaultTitlePrefix} ${startPageNumber}`, text: clean }];
}

function decodeXmlEntities(text: string): string {
  return text
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&#(\d+);/g, (_, code) => String.fromCharCode(Number(code)))
    .replace(/&#x([0-9a-fA-F]+);/g, (_, hex) => String.fromCharCode(parseInt(hex, 16)));
}

function extractPlainTextFromWordXmlChunk(xmlChunk: string): string {
  const cleaned = xmlChunk
    .replace(/<w:del\b[\s\S]*?<\/w:del>/g, '')
    .replace(/<w:instrText\b[\s\S]*?<\/w:instrText>/g, '');

  const tokens = cleaned.match(
    /<\/w:p>|<\/w:tr>|<\/w:tc>|<w:tab\b[^>]*\/?>|<w:cr\b[^>]*\/?>|<w:br\b[^>]*\/?>|<w:t\b[^>]*>[\s\S]*?<\/w:t>/g
  );
  if (!tokens) return '';

  let out = '';
  for (const token of tokens) {
    if (token === '</w:p>') {
      out += '\n\n';
    } else if (token === '</w:tr>') {
      out += '\n';
    } else if (token === '</w:tc>') {
      out += '  ';
    } else if (token.startsWith('<w:tab')) {
      out += '\t';
    } else if (token.startsWith('<w:cr') || token.startsWith('<w:br')) {
      out += '\n';
    } else if (token.startsWith('<w:t')) {
      const inner = token.replace(/^<w:t\b[^>]*>/, '').replace(/<\/w:t>$/, '');
      out += decodeXmlEntities(inner);
    }
  }

  return out.replace(/\n{3,}/g, '\n\n').trim();
}

async function extractDocxPagesFromXml(arrayBuffer: ArrayBuffer): Promise<{ pages: ParsedPage[] | null; declaredPages: number }> {
  try {
    const zip = await JSZip.loadAsync(arrayBuffer);
    let declaredPages = 0;

    const appXmlFile = zip.file('docProps/app.xml');
    if (appXmlFile) {
      const appXml = await appXmlFile.async('text');
      const pagesMatch = appXml.match(/<Pages>(\d+)<\/Pages>/);
      if (pagesMatch) {
        declaredPages = parseInt(pagesMatch[1], 10) || 0;
      }
    }

    const docXmlFile = zip.file('word/document.xml');
    if (!docXmlFile) return { pages: null, declaredPages };

    const docXml = await docXmlFile.async('text');
    const pageBreakRegex =
      /<w:br\b[^>]*w:type=["']page["'][^>]*\/?>|<w:lastRenderedPageBreak\b[^>]*\/?>|<w:pageBreakBefore\b(?![^>]*w:val=["'](?:0|false)["'])[^>]*\/?>/g;

    const chunks = docXml.split(pageBreakRegex);
    if (chunks.length < 2) {
      return { pages: null, declaredPages };
    }

    const pages: ParsedPage[] = [];
    for (const chunk of chunks) {
      const chunkText = extractPlainTextFromWordXmlChunk(chunk);
      if (!chunkText) continue;

      if (chunkText.length > 2500) {
        const subPages = paginatePlainText(chunkText, 'Trang', pages.length + 1);
        pages.push(...subPages);
      } else {
        const pageNum = pages.length + 1;
        pages.push({
          id: `page-${pageNum}-${Date.now()}`,
          pageNumber: pageNum,
          title: `Trang ${pageNum}`,
          text: chunkText
        });
      }
    }

    return { pages: pages.length >= 2 ? pages : null, declaredPages };
  } catch {
    return { pages: null, declaredPages: 0 };
  }
}

function splitTextIntoApproximatePages(text: string, targetPages: number): ParsedPage[] {
  const lines = text.replace(/\r\n/g, '\n').split('\n').map(l => l.trim()).filter(Boolean);
  if (lines.length < 2 || targetPages < 2) {
    return paginatePlainText(text, 'Trang');
  }
  const pageCount = Math.min(targetPages, lines.length);
  const linesPerPage = Math.ceil(lines.length / pageCount);
  const pages: ParsedPage[] = [];
  for (let i = 0; i < lines.length; i += linesPerPage) {
    const pageNum = pages.length + 1;
    pages.push({
      id: `page-${pageNum}-${Date.now()}`,
      pageNumber: pageNum,
      title: `Trang ${pageNum}`,
      text: lines.slice(i, i + linesPerPage).join('\n\n')
    });
  }
  return pages;
}

/**
 * Bóc tách tệp Word .docx ưu tiên theo ngắt trang thực tế trong XML, fallback sang mammoth
 */
export async function parseDocxFile(file: File): Promise<ParsedPage[]> {
  const arrayBuffer = await file.arrayBuffer();

  if (!arrayBuffer || arrayBuffer.byteLength < 10) {
    throw new Error('Tệp Word rỗng hoặc không đúng định dạng .docx.');
  }

  const binaryCheck = isBinaryOrCorrupted(arrayBuffer);
  if (binaryCheck.isCorrupted) {
    throw new Error(binaryCheck.reason);
  }

  try {
    const { pages: xmlPages, declaredPages } = await extractDocxPagesFromXml(arrayBuffer);
    if (xmlPages && xmlPages.length >= 2) {
      return xmlPages;
    }

    const isNodeRuntime = typeof process !== 'undefined' && Boolean(process.versions?.node) && typeof Buffer !== 'undefined';
    const mammothInput = isNodeRuntime
      ? { buffer: Buffer.from(arrayBuffer) }
      : { arrayBuffer };
    const result = await mammoth.extractRawText(mammothInput);
    const rawText = (result.value || '').trim();

    if (!rawText) {
      throw new Error('Tệp Word .docx không chứa nội dung văn bản có thể trích xuất.');
    }

    const paginated = paginatePlainText(rawText, 'Trang');
    if (paginated.length === 1 && declaredPages > 1) {
      return splitTextIntoApproximatePages(rawText, declaredPages);
    }
    return paginated;
  } catch (err: any) {
    throw new Error(err.message || 'Không thể đọc nội dung tệp .docx');
  }
}

/**
 * Bóc tách tệp bảng tính (.xlsx, .xls, .csv, .ods) thành các sheet dữ liệu
 */
export async function parseSpreadsheetFile(
  file: File
): Promise<{ sheets: SpreadsheetSheet[]; pages: ParsedPage[] }> {
  const arrayBuffer = await file.arrayBuffer();
  if (!arrayBuffer || arrayBuffer.byteLength === 0) {
    throw new Error('Tệp bảng tính rỗng hoặc không hợp lệ.');
  }

  const workbook = XLSX.read(arrayBuffer, { type: 'array' });
  if (!workbook.SheetNames || workbook.SheetNames.length === 0) {
    throw new Error('Tệp bảng tính không chứa trang tính (sheet) nào.');
  }

  const sheets: SpreadsheetSheet[] = [];
  const pages: ParsedPage[] = [];

  workbook.SheetNames.forEach((sheetName, idx) => {
    const ws = workbook.Sheets[sheetName];
    if (!ws) return;
    const rawRows = XLSX.utils.sheet_to_json<unknown[]>(ws, {
      header: 1,
      defval: '',
      raw: false,
    });

    // Giới hạn tối đa 1.000 dòng x 40 cột mỗi sheet để đảm bảo hiệu năng bàn học
    const trimmedRows: string[][] = rawRows
      .slice(0, 1000)
      .map((row) =>
        (Array.isArray(row) ? row : []).slice(0, 40).map((cell) => String(cell ?? '').trim())
      );

    // Xóa các dòng trống ở cuối
    while (trimmedRows.length > 0 && trimmedRows[trimmedRows.length - 1].every((c) => !c)) {
      trimmedRows.pop();
    }

    const safeRows = trimmedRows.length > 0 ? trimmedRows : [['(Trang tính trống)']];
    sheets.push({ name: sheetName, rows: safeRows });

    const previewLines = safeRows.slice(0, 30).map((r) => r.join(' | ')).join('\n');
    pages.push({
      id: `sheet-${idx + 1}-${Date.now()}`,
      pageNumber: idx + 1,
      title: sheetName,
      text: `## Sheet: ${sheetName}\n\n${previewLines}`,
    });
  });

  if (sheets.length === 0) {
    throw new Error('Không thể đọc dữ liệu từ bảng tính này.');
  }

  return { sheets, pages };
}

/**
 * Bóc tách tệp PowerPoint .pptx thành cả danh sách slide trình chiếu lẫn trang văn bản
 */
export async function parsePptxPresentation(
  file: File
): Promise<{ slides: PresentationSlide[]; pages: ParsedPage[] }> {
  const arrayBuffer = await file.arrayBuffer();

  const binaryCheck = isBinaryOrCorrupted(arrayBuffer);
  if (binaryCheck.isCorrupted) {
    throw new Error(binaryCheck.reason);
  }

  const zip = await JSZip.loadAsync(arrayBuffer);
  const slideFiles = Object.keys(zip.files).filter(
    (path) => path.startsWith('ppt/slides/slide') && path.endsWith('.xml')
  );

  slideFiles.sort((a, b) => {
    const numA = parseInt(a.match(/slide(\d+)\.xml/)?.[1] || '0', 10);
    const numB = parseInt(b.match(/slide(\d+)\.xml/)?.[1] || '0', 10);
    return numA - numB;
  });

  if (slideFiles.length === 0) {
    throw new Error('Tệp PowerPoint .pptx không chứa slide nào.');
  }

  const slides: PresentationSlide[] = [];
  const pages: ParsedPage[] = [];

  for (let i = 0; i < slideFiles.length; i++) {
    const xmlPath = slideFiles[i];
    const xmlContent = await zip.files[xmlPath].async('text');
    const slideNumMatch = xmlPath.match(/slide(\d+)\.xml/);
    const slideNum = slideNumMatch ? parseInt(slideNumMatch[1], 10) : i + 1;

    // Tách theo từng đoạn <a:p> để giữ cấu trúc dòng trên slide
    const paragraphs = xmlContent.match(/<a:p\b[\s\S]*?<\/a:p>/g) || [];
    const lines: string[] = [];
    for (const para of paragraphs) {
      const textTokens = para.match(/<a:t[^>]*>([\s\S]*?)<\/a:t>/g) || [];
      const lineText = textTokens
        .map((t) => decodeXmlEntities(t.replace(/<[^>]+>/g, '')))
        .join('')
        .trim();
      if (lineText) lines.push(lineText);
    }

    const slideTitle = lines[0] || `Slide ${i + 1}`;
    const slideBody = lines.slice(1).join('\n');

    // Đọc ghi chú diễn giả (speaker notes) nếu có
    let notesText = '';
    const notesFile = zip.file(`ppt/notesSlides/notesSlide${slideNum}.xml`);
    if (notesFile) {
      const notesXml = await notesFile.async('text');
      const noteTokens = notesXml.match(/<a:t[^>]*>([\s\S]*?)<\/a:t>/g) || [];
      notesText = noteTokens
        .map((t) => decodeXmlEntities(t.replace(/<[^>]+>/g, '').trim()))
        .filter((t) => t && !/^\d+$/.test(t))
        .join(' ')
        .trim();
    }

    const fullSlideText = lines.join('\n');
    slides.push({
      id: `slide-${i + 1}-${Date.now()}`,
      slideNumber: i + 1,
      title: slideTitle,
      body: slideBody || (lines.length === 1 ? '' : '(Slide hình ảnh hoặc không có văn bản)'),
      notes: notesText || undefined,
    });

    pages.push({
      id: `slide-${i + 1}-${Date.now()}`,
      pageNumber: i + 1,
      title: `Slide ${i + 1}: ${slideTitle}`,
      text: fullSlideText
        ? `## ${slideTitle}\n\n${slideBody || ''}`
        : `## Slide ${i + 1}\n\n(Slide hình ảnh hoặc không có văn bản)`,
    });
  }

  return { slides, pages };
}

/**
 * Bóc tách tệp PowerPoint .pptx bằng JSZip trích xuất văn bản từng slide
 */
export async function parsePptxFile(file: File): Promise<ParsedPage[]> {
  const { pages } = await parsePptxPresentation(file);
  return pages;
}

/**
 * Bộ phân tích tệp tải lên dùng chung cho cả nút Tải lên và thao tác kéo-thả vào bàn học.
 * Đảm bảo .docx, .pptx, .pdf, .xlsx, ảnh và văn bản được xử lý đồng nhất, chặn tuyệt đối tệp nhị phân đọc nhầm thành text.
 */
export async function parseUploadedDocumentFile(
  file: File,
  formattedTitle?: string
): Promise<ParsedUploadedDocument> {
  const fileName = file.name;
  const lowerName = fileName.toLowerCase();
  const fileTypeMime = file.type || '';
  const fileSizeStr = `${(file.size / 1024).toFixed(1)} KB`;
  const ext = (fileName.split('.').pop() || '').toLowerCase();

  const isPdf = fileTypeMime === 'application/pdf' || ext === 'pdf';
  const isDocx = ext === 'docx' || fileTypeMime.includes('wordprocessingml');
  const isPptx = ext === 'pptx' || fileTypeMime.includes('presentationml');
  const isSpreadsheet =
    ext === 'xlsx' ||
    ext === 'xls' ||
    ext === 'csv' ||
    ext === 'ods' ||
    fileTypeMime.includes('spreadsheetml') ||
    fileTypeMime === 'text/csv' ||
    fileTypeMime === 'application/vnd.ms-excel';
  const isImage = fileTypeMime.startsWith('image/') || /\.(png|jpe?g|webp|gif|bmp|svg)$/i.test(fileName);
  const isText = fileTypeMime.includes('text') || ext === 'md' || ext === 'txt';

  if (ext === 'doc' || ext === 'ppt') {
    throw new Error(
      `Định dạng ${ext === 'doc' ? 'Word .doc' : 'PowerPoint .ppt'} cũ (97-2003) chưa được hỗ trợ trực tiếp. Vui lòng lưu sang .${ext === 'doc' ? 'docx' : 'pptx'} hoặc .pdf rồi tải lại.`
    );
  }

  const title = formattedTitle || formatUploadedDocTitle(fileName, isImage, file.lastModified);

  if (isSpreadsheet) {
    const { sheets, pages } = await parseSpreadsheetFile(file);
    return {
      title,
      pages,
      fileType: 'SPREADSHEET',
      fileSize: fileSizeStr,
      kind: 'spreadsheet',
      sheets,
    };
  }

  if (isPptx) {
    const { slides, pages } = await parsePptxPresentation(file);
    return {
      title,
      pages,
      fileType: 'PRESENTATION',
      fileSize: fileSizeStr,
      kind: 'presentation',
      slides,
    };
  }

  if (isPdf) {
    const pdfPages = await parsePdfFile(file);
    const sanitizedPages = pdfPages.map(p => ({
      ...p,
      text: sanitizeDocumentText(p.text),
    }));
    return {
      title,
      pages: sanitizedPages,
      fileType: 'PDF',
      fileSize: fileSizeStr,
      kind: 'document',
    };
  }

  if (isDocx) {
    const docxPages = await parseDocxFile(file);
    const sanitizedPages = docxPages.map(p => ({
      ...p,
      text: sanitizeDocumentText(p.text),
    }));
    return {
      title,
      pages: sanitizedPages,
      fileType: 'DOCX',
      fileSize: fileSizeStr,
      kind: 'document',
    };
  }

  if (isImage) {
    const reader = new FileReader();
    const dataUrl = await new Promise<string>((resolve, reject) => {
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = () => reject(new Error('Không thể đọc tệp hình ảnh.'));
      reader.readAsDataURL(file);
    });
    return {
      title,
      pages: [
        {
          id: `img-${Date.now()}`,
          pageNumber: 1,
          title,
          text: '',
          image: dataUrl,
        },
      ],
      fileType: 'IMAGE',
      fileSize: fileSizeStr,
      kind: 'document',
    };
  }

  const buffer = await file.arrayBuffer();
  const content = await file.text();
  const check = isBinaryOrCorrupted(buffer, content.slice(0, 4096));
  if (check.isCorrupted) {
    throw new Error(check.reason || 'Định dạng tệp không được hỗ trợ hoặc chứa dữ liệu nhị phân.');
  }

  if (isText) {
    const paragraphs = content.split('\n\n').filter(p => p.trim().length > 0);
    const pages =
      paragraphs.length > 0
        ? paragraphs.map((p, idx) => ({
            id: `txt-${idx + 1}-${Date.now()}`,
            pageNumber: idx + 1,
            title: `Trang ${idx + 1}`,
            text: sanitizeDocumentText(p.trim()),
          }))
        : [{ id: `txt-1-${Date.now()}`, pageNumber: 1, title, text: sanitizeDocumentText(content.trim()) }];
    return {
      title,
      pages,
      fileType: 'TEXT',
      fileSize: fileSizeStr,
      kind: 'document',
    };
  }

  return {
    title,
    pages: [{ id: `txt-1-${Date.now()}`, pageNumber: 1, title, text: sanitizeDocumentText(content.trim()) }],
    fileType: 'FILE',
    fileSize: fileSizeStr,
    kind: 'document',
  };
}

/**
 * Bộ phân tích tệp trả về phân loại chuẩn (tài liệu, bảng tính đa sheet, hoặc slide trình chiếu) cho dịch vụ URL
 */
export async function parseUploadedDocumentResult(
  file: File,
  formattedTitle: string
): Promise<UploadedParseResult> {
  const parsed = await parseUploadedDocumentFile(file, formattedTitle);
  if (parsed.kind === 'spreadsheet' && parsed.sheets) {
    return { kind: 'spreadsheet', sheets: parsed.sheets, pages: parsed.pages };
  }
  if (parsed.kind === 'presentation' && parsed.slides) {
    return { kind: 'presentation', slides: parsed.slides, pages: parsed.pages };
  }
  return { kind: 'document', pages: parsed.pages };
}
