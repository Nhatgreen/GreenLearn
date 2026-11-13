import JSZip from 'jszip';
// @ts-ignore
import mammoth from 'mammoth';
import { ParsedPage, parsePdfFile } from './PdfParserService';
import { sanitizeDocumentText } from '@/utils/textNormalization';
import { formatUploadedDocTitle } from '@/utils/documentNaming';

export interface ParsedUploadedDocument {
  title: string;
  pages: { id?: string; pageNumber?: number; title?: string; text: string; image?: string }[];
  fileType: string;
  fileSize: string;
}

/**
 * Kiểm tra xem tệp có chứa chuỗi byte nhị phân hoặc chữ ký không được hỗ trợ
 */
export function isBinaryOrCorrupted(buffer: ArrayBuffer, previewText?: string): { isCorrupted: boolean; reason?: string } {
  if (!buffer || buffer.byteLength === 0) {
    return { isCorrupted: true, reason: 'Tệp rỗng không có dữ liệu.' };
  }

  const bytes = new Uint8Array(buffer.slice(0, 8));
  
  // Chữ ký .doc cũ (Compound File Binary Format: D0 CF 11 E0)
  if (bytes[0] === 0xD0 && bytes[1] === 0xCF && bytes[2] === 0x11 && bytes[3] === 0xE0) {
    return {
      isCorrupted: true,
      reason: 'Định dạng Word .doc (97-2003 cũ) chưa được hỗ trợ trực tiếp. Vui lòng lưu tệp sang .docx hoặc .pdf rồi tải lại.'
    };
  }

  // Tỷ lệ ký tự Unicode rác \uFFFD nếu đọc nhầm binary
  if (previewText) {
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
export function paginatePlainText(fullText: string, defaultTitlePrefix = 'Trang'): ParsedPage[] {
  const clean = sanitizeDocumentText(fullText);
  if (!clean) {
    return [{ id: `page-1-${Date.now()}`, pageNumber: 1, title: `${defaultTitlePrefix} 1`, text: 'Trang trống không có văn bản.' }];
  }

  // Nếu văn bản có chứa các heading ##, ưu tiên chia theo heading
  const headingSections = clean.split(/(?=^##\s+)/m);
  if (headingSections.length > 1) {
    const pages: ParsedPage[] = [];
    headingSections.forEach((sec) => {
      const trimmed = sec.trim();
      if (!trimmed) return;
      const firstLine = trimmed.split('\n')[0].replace(/^##\s+/, '').trim();
      pages.push({
        id: `page-${pages.length + 1}-${Date.now()}`,
        pageNumber: pages.length + 1,
        title: firstLine ? `${firstLine}` : `${defaultTitlePrefix} ${pages.length + 1}`,
        text: sanitizeDocumentText(trimmed)
      });
    });
    if (pages.length > 0) return pages;
  }

  // Chia theo đoạn văn với ngưỡng tối đa ~1.500 ký tự
  const paragraphs = clean.split(/\n\n+/);
  const pages: ParsedPage[] = [];
  let currentText = '';

  for (const p of paragraphs) {
    if (currentText.length + p.length > 1600 && currentText.length > 0) {
      pages.push({
        id: `page-${pages.length + 1}-${Date.now()}`,
        pageNumber: pages.length + 1,
        title: `${defaultTitlePrefix} ${pages.length + 1}`,
        text: sanitizeDocumentText(currentText)
      });
      currentText = p + '\n\n';
    } else {
      currentText += p + '\n\n';
    }
  }

  if (currentText.trim().length > 0) {
    pages.push({
      id: `page-${pages.length + 1}-${Date.now()}`,
      pageNumber: pages.length + 1,
      title: `${defaultTitlePrefix} ${pages.length + 1}`,
      text: sanitizeDocumentText(currentText)
    });
  }

  return pages.length > 0 ? pages : [{ id: `page-1-${Date.now()}`, pageNumber: 1, title: `${defaultTitlePrefix} 1`, text: clean }];
}

/**
 * Bóc tách tệp Word .docx bằng mammoth
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
    const result = await mammoth.extractRawText({ arrayBuffer });
    const rawText = sanitizeDocumentText(result.value || '');

    if (!rawText) {
      throw new Error('Tệp Word .docx không chứa nội dung văn bản có thể trích xuất.');
    }

    return paginatePlainText(rawText, 'Trang');
  } catch (err: any) {
    throw new Error(err.message || 'Không thể đọc nội dung tệp .docx');
  }
}

/**
 * Bóc tách tệp PowerPoint .pptx bằng JSZip trích xuất văn bản từng slide
 */
export async function parsePptxFile(file: File): Promise<ParsedPage[]> {
  const arrayBuffer = await file.arrayBuffer();

  const binaryCheck = isBinaryOrCorrupted(arrayBuffer);
  if (binaryCheck.isCorrupted) {
    throw new Error(binaryCheck.reason);
  }

  const zip = await JSZip.loadAsync(arrayBuffer);
  const slideFiles = Object.keys(zip.files).filter(path => 
    path.startsWith('ppt/slides/slide') && path.endsWith('.xml')
  );

  // Sắp xếp các slide theo số thứ tự tự nhiên (slide1, slide2, ..., slide10)
  slideFiles.sort((a, b) => {
    const numA = parseInt(a.match(/slide(\d+)\.xml/)?.[1] || '0', 10);
    const numB = parseInt(b.match(/slide(\d+)\.xml/)?.[1] || '0', 10);
    return numA - numB;
  });

  if (slideFiles.length === 0) {
    throw new Error('Tệp PowerPoint .pptx không chứa slide nào.');
  }

  const pages: ParsedPage[] = [];

  for (let i = 0; i < slideFiles.length; i++) {
    const xmlPath = slideFiles[i];
    const xmlContent = await zip.files[xmlPath].async('text');

    // Trích xuất các thẻ <a:t>...</a:t> chứa text của slide
    const textMatches = xmlContent.match(/<a:t[^>]*>([\s\S]*?)<\/a:t>/g) || [];
    const slideTexts = textMatches.map((m: string) => m.replace(/<[^>]+>/g, '').trim()).filter(Boolean);
    const slideBody = sanitizeDocumentText(slideTexts.join('\n'));

    pages.push({
      id: `slide-${i + 1}-${Date.now()}`,
      pageNumber: i + 1,
      title: `Slide ${i + 1}`,
      text: slideBody ? `## Slide ${i + 1}\n\n${slideBody}` : `## Slide ${i + 1}\n\n(Slide hình ảnh hoặc không có văn bản)`
    });
  }

  return pages;
}

/**
 * Bộ phân tích tài liệu đồng nhất (Unified Document Parser):
 * Hỗ trợ PDF, Word (.docx), PowerPoint (.pptx), hình ảnh, và văn bản thuần.
 * Tự động bảo vệ chống lại dữ liệu nhị phân hỏng (PK\x03\x04 và NULL bytes)
 * và chuẩn hóa tên tệp thông minh.
 */
export async function parseUploadedDocumentFile(file: File): Promise<ParsedUploadedDocument> {
  const fileName = file.name;
  const lowerName = fileName.toLowerCase();
  const fileTypeMime = file.type || '';
  const fileSizeStr = `${(file.size / 1024).toFixed(1)} KB`;

  const isPdf = fileTypeMime === 'application/pdf' || lowerName.endsWith('.pdf');
  const isDocx = fileTypeMime === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' || lowerName.endsWith('.docx');
  const isPptx = fileTypeMime === 'application/vnd.openxmlformats-officedocument.presentationml.presentation' || lowerName.endsWith('.pptx');
  const isImage = fileTypeMime.startsWith('image/') || /\.(png|jpe?g|webp|gif|bmp|svg)$/i.test(fileName);
  const isText = fileTypeMime.includes('text') || lowerName.endsWith('.md') || lowerName.endsWith('.txt');

  const title = formatUploadedDocTitle(fileName, isImage, file.lastModified);

  // 1. Xử lý tệp PDF
  if (isPdf) {
    const pdfPages = await parsePdfFile(file);
    const sanitizedPages = pdfPages.map(p => ({
      ...p,
      text: sanitizeDocumentText(p.text)
    }));
    return {
      title,
      pages: sanitizedPages,
      fileType: 'PDF',
      fileSize: fileSizeStr
    };
  }

  // 2. Xử lý hình ảnh (Tạo một trang có ảnh đính kèm)
  if (isImage) {
    const reader = new FileReader();
    const dataUrl = await new Promise<string>((resolve, reject) => {
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = () => reject(new Error('Không thể đọc tệp hình ảnh.'));
      reader.readAsDataURL(file);
    });

    return {
      title,
      pages: [{
        title,
        text: '',
        image: dataUrl
      }],
      fileType: 'ẢNH',
      fileSize: fileSizeStr
    };
  }

  // 3. Xử lý tệp Word .docx
  if (isDocx) {
    const docxPages = await parseDocxFile(file);
    return {
      title,
      pages: docxPages,
      fileType: 'WORD',
      fileSize: fileSizeStr
    };
  }

  // 4. Xử lý tệp PowerPoint .pptx
  if (isPptx) {
    const pptxPages = await parsePptxFile(file);
    return {
      title,
      pages: pptxPages,
      fileType: 'PPTX',
      fileSize: fileSizeStr
    };
  }

  // 5. Xử lý tệp văn bản thuần / Markdown
  if (isText) {
    const rawText = await file.text();
    const cleanText = sanitizeDocumentText(rawText);
    const pages = paginatePlainText(cleanText, 'Trang');
    return {
      title,
      pages,
      fileType: 'TEXT',
      fileSize: fileSizeStr
    };
  }

  // 6. Fallback phòng vệ: Kiểm tra tệp nhị phân trước khi đọc
  const arrayBuffer = await file.arrayBuffer();
  const binaryCheck = isBinaryOrCorrupted(arrayBuffer);
  if (binaryCheck.isCorrupted) {
    throw new Error(binaryCheck.reason || `Định dạng tệp ${fileName} không được hỗ trợ hoặc là tệp nhị phân.`);
  }

  try {
    const decoder = new TextDecoder('utf-8', { fatal: true });
    const decodedText = decoder.decode(arrayBuffer);
    const cleanText = sanitizeDocumentText(decodedText);

    if (!cleanText) {
      throw new Error(`Tệp ${fileName} không chứa văn bản hợp lệ.`);
    }

    const pages = paginatePlainText(cleanText, 'Trang');
    return {
      title,
      pages,
      fileType: fileName.split('.').pop()?.toUpperCase() || 'TỆP',
      fileSize: fileSizeStr
    };
  } catch {
    throw new Error(
      `Không thể đọc tệp ${fileName}. Tệp có thể chứa mã nhị phân không tương thích. Vui lòng dùng tệp PDF, DOCX, PPTX, hình ảnh hoặc TXT.`
    );
  }
}
