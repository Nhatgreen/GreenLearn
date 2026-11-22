import { describe, it, expect, vi, afterEach } from 'vitest';
import {
  resolveImportableUrl,
  importDocumentFromUrl,
  UrlSharePermissionError,
} from './UrlDocumentService';

describe('UrlDocumentService', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('resolves Google Docs, Sheets, and Slides URLs to their export endpoints', () => {
    const doc = resolveImportableUrl('https://docs.google.com/document/d/abc123XYZ/edit?usp=sharing');
    expect(doc.provider).toBe('google_docs');
    expect(doc.fetchUrl).toBe('https://docs.google.com/document/d/abc123XYZ/export?format=docx');

    const sheet = resolveImportableUrl('https://docs.google.com/spreadsheets/d/sheet999/edit#gid=0');
    expect(sheet.provider).toBe('google_sheets');
    expect(sheet.fetchUrl).toBe('https://docs.google.com/spreadsheets/d/sheet999/export?format=xlsx');

    const slide = resolveImportableUrl('https://docs.google.com/presentation/d/pres777/edit');
    expect(slide.provider).toBe('google_slides');
    expect(slide.fetchUrl).toBe('https://docs.google.com/presentation/d/pres777/export/pptx');
  });

  it('throws UrlSharePermissionError with sharing guide when Google doc is private (403 or login HTML)', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockImplementation(() =>
        Promise.resolve(
          new Response('<html><body>Sign in - Google Accounts ServiceLogin</body></html>', {
            status: 200,
            headers: { 'content-type': 'text/html; charset=utf-8' },
          })
        )
      )
    );

    await expect(
      importDocumentFromUrl('https://docs.google.com/document/d/privateDocId/edit')
    ).rejects.toBeInstanceOf(UrlSharePermissionError);

    try {
      await importDocumentFromUrl('https://docs.google.com/document/d/privateDocId/edit');
    } catch (err) {
      expect(err).toBeInstanceOf(UrlSharePermissionError);
      expect((err as UrlSharePermissionError).guideSteps.length).toBeGreaterThanOrEqual(4);
    }
  });
});
