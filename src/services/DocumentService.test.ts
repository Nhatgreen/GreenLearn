import { describe, it, expect, vi, beforeEach } from 'vitest';
import { DocumentService } from './DocumentService';

describe('DocumentService', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('rejects files larger than 20MB', async () => {
    const hugeFile = {
      name: 'large.pdf',
      size: 25 * 1024 * 1024,
      type: 'application/pdf',
    } as File;

    await expect(DocumentService.uploadFile(hugeFile, 'user-1')).rejects.toThrow(
      'Kích thước file vượt quá giới hạn 20MB'
    );
  });

  it('getFileUrl returns formatted public URL', () => {
    const url = DocumentService.getFileUrl('user-1/doc.pdf');
    expect(url).toContain('documents');
  });
});
