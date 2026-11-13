import { describe, it, expect } from 'vitest';
import { isBinaryOrCorrupted, parseDocxFile, parseUploadedDocumentFile } from './OfficeParserService';

describe('OfficeParserService', () => {
  it('detects binary corrupted files with old doc CFBF header', () => {
    const rawBuffer = new Uint8Array([0xd0, 0xcf, 0x11, 0xe0, 0x00, 0x00, 0x00, 0x00]).buffer;
    expect(isBinaryOrCorrupted(rawBuffer).isCorrupted).toBe(true);
  });

  it('detects text filled with replacement characters (\\uFFFD)', () => {
    const corruptText = 'abc \uFFFD \uFFFD \uFFFD \uFFFD \uFFFD \uFFFD \uFFFD \uFFFD \uFFFD \uFFFD \uFFFD \uFFFD \uFFFD \uFFFD \uFFFD \uFFFD';
    expect(isBinaryOrCorrupted(new ArrayBuffer(10), corruptText).isCorrupted).toBe(true);
  });

  it('accepts clean plain text or html', () => {
    const clean = 'Chương 1: Giới thiệu về Machine Learning và ứng dụng trong ViTudy.';
    expect(isBinaryOrCorrupted(new ArrayBuffer(10), clean).isCorrupted).toBe(false);
  });

  it('rejects empty or corrupt file buffer in parseDocxFile gracefully', async () => {
    const file = new File([new ArrayBuffer(0)], 'test.docx', { type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' });
    await expect(parseDocxFile(file)).rejects.toThrow('Tệp Word rỗng hoặc không đúng định dạng .docx.');
  });

  it('parses text/markdown files cleanly using parseUploadedDocumentFile', async () => {
    const content = '# Tiêu đề tài liệu\n\nĐây là nội dung thử nghiệm.\n\n## Mục 2\n\nNội dung chi tiết.';
    const file = new File([content], 'giai_tich_1.md', { type: 'text/markdown' });

    const result = await parseUploadedDocumentFile(file);
    expect(result.title).toBe('giai tich 1');
    expect(result.fileType).toBe('TEXT');
    expect(result.pages.length).toBeGreaterThanOrEqual(1);
    expect(result.pages[0].text).toContain('Tiêu đề tài liệu');
  });

  it('rejects corrupted binary zip file masquerading as text', async () => {
    // Old zip binary header with nulls
    const badBuffer = new Uint8Array([0xd0, 0xcf, 0x11, 0xe0, 0x00, 0x00, 0x00, 0x00]).buffer;
    const file = new File([badBuffer], 'document.doc', { type: 'application/msword' });

    await expect(parseUploadedDocumentFile(file)).rejects.toThrow();
  });
});
