'use client';

const STORAGE_KEY = 'vitudy_purchased_market_items';

/**
 * Lấy danh sách ID các tài liệu người dùng đã mua / sở hữu trên Chợ Tài Liệu
 */
export function getPurchasedItemIds(): string[] {
  if (typeof window === 'undefined') return ['market-math-1'];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch {
    // fallback
  }
  // Mặc định tài liệu mẫu đã được sở hữu để trải nghiệm
  return ['market-math-1'];
}

/**
 * Ghi nhận một tài liệu mới đã được mua thành công vào Tủ tài liệu cá nhân
 */
export function recordPurchasedItemId(id: string): string[] {
  if (typeof window === 'undefined') return [id];
  try {
    const current = getPurchasedItemIds();
    if (!current.includes(id)) {
      const updated = [...current, id];
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      return updated;
    }
    return current;
  } catch {
    return [id];
  }
}
