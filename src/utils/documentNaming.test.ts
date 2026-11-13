import { describe, it, expect } from 'vitest';
import { formatUploadedDocTitle, isCameraOrMachineGeneratedName } from './documentNaming';

describe('documentNaming utils', () => {
  it('correctly detects machine generated and camera file names', () => {
    expect(isCameraOrMachineGeneratedName('IMG_20261113_220501')).toBe(true);
    expect(isCameraOrMachineGeneratedName('PXL_20260401_123456789')).toBe(true);
    expect(isCameraOrMachineGeneratedName('DSC_0042')).toBe(true);
    expect(isCameraOrMachineGeneratedName('815733508_1729384729384')).toBe(true);
    expect(isCameraOrMachineGeneratedName('Screenshot_20261113-220000')).toBe(true);
    expect(isCameraOrMachineGeneratedName('c3d2e1a0-4b5c-6d7e-8f9a-0b1c2d3e4f5a')).toBe(true);

    // Natural human names should not be detected as machine generated
    expect(isCameraOrMachineGeneratedName('Giao Trinh Giai Tich 1')).toBe(false);
    expect(isCameraOrMachineGeneratedName('Bai tap Dai so tuyen tinh')).toBe(false);
  });

  it('formats camera image name into readable Vietnamese timestamp', () => {
    const fixedTime = new Date(2026, 10, 13, 22, 15).getTime(); // 13/11 22:15
    const formatted = formatUploadedDocTitle('IMG_20261113_221500.jpg', true, fixedTime);
    expect(formatted).toBe('Ảnh chụp 13/11 22:15');

    const formattedHash = formatUploadedDocTitle('815733508_4829104.png', true, fixedTime);
    expect(formattedHash).toBe('Ảnh chụp 13/11 22:15');
  });

  it('formats normal documents by stripping extension and replacing underscores', () => {
    expect(formatUploadedDocTitle('Giao_Trinh_Giai_Tich_1.pdf')).toBe('Giao Trinh Giai Tich 1');
    expect(formatUploadedDocTitle('Chuong_2-Khai_Niem_Co_Ban.docx')).toBe('Chuong 2 Khai Niem Co Ban');
    expect(formatUploadedDocTitle('Slide_Bai_Giang_Vatly.pptx')).toBe('Slide Bai Giang Vatly');
  });
});
