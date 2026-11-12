import JSZip from 'jszip';
// @ts-ignore
import mammoth from 'mammoth';
import { ParsedPage } from './PdfParserService';

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
function paginatePlainText(fullText: string, defaultTitlePrefix = 'Trang'): ParsedPage[] {
  const clean = fullText.replace(/\r\n/g, '\n').trim();
  if (!clean) {
    return [{ id: `page-1-${Date.now()}`, pageNumber: 1, title: `${defaultTitlePrefix} 1`, text: 'Trang trống không có văn bản.' }];
  }

  // Nếu văn bản có chứa các heading ##, ưu tiên chia theo heading
  const headingSections = clean.split(/(?=^##\s+)/m);
  if (headingSections.length > 1) {
    const pages: ParsedPage[] = [];
    headingSections.forEach((sec, idx) => {
      const trimmed = sec.trim();
      if (!trimmed) return;
      const firstLine = trimmed.split('\n')[0].replace(/^##\s+/, '').trim();
      pages.push({
        id: `page-${pages.length + 1}-${Date.now()}`,
        pageNumber: pages.length + 1,
        title: firstLine ? `${firstLine}` : `${defaultTitlePrefix} ${pages.length + 1}`,
        text: trimmed
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
        text: currentText.trim()
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
      text: currentText.trim()
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
    const rawText = (result.value || '').trim();

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
    const slideBody = slideTexts.join('\n');

    pages.push({
      id: `slide-${i + 1}-${Date.now()}`,
      pageNumber: i + 1,
      title: `Slide ${i + 1}`,
      text: slideBody ? `## Slide ${i + 1}\n\n${slideBody}` : `## Slide ${i + 1}\n\n(Slide hình ảnh hoặc không có văn bản)`
    });
  }

  return pages;
}
