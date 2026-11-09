import { describe, it, expect } from 'vitest';
import { buildVietQrUrl, PaymentService } from './PaymentService';

describe('PaymentService', () => {
  it('buildVietQrUrl formats VietQR image URL with encoded parameters', () => {
    const url = buildVietQrUrl({
      bankId: 'MBBank',
      accountNo: '0987654321',
      amount: 10000,
      addInfo: 'VT7K2M9QXA',
      accountName: 'NGUYEN VAN A',
    });

    expect(url).toContain('https://img.vietqr.io/image/970422-0987654321-compact2.png');
    expect(url).toContain('amount=10000');
    expect(url).toContain('addInfo=VT7K2M9QXA');
    expect(url).toContain('accountName=NGUYEN%20VAN%20A');
  });

  it('listPackages returns fallback packages when Supabase is not configured', async () => {
    const packages = await PaymentService.listPackages();
    expect(packages.length).toBeGreaterThan(0);
    expect(packages[0].tokenAmount).toBe(2);
  });
});
