import { describe, it, expect } from 'vitest';
import { toDateKeyVN, todayKey, getLast28DaysGrid, formatRelativeTimeVN } from './dateVN';

describe('dateVN', () => {
  it('formats dates into YYYY-MM-DD in Vietnam timezone', () => {
    const d = new Date('2026-11-12T03:00:00Z'); // 10:00 AM VN
    expect(toDateKeyVN(d)).toBe('2026-11-12');
  });

  it('generates a 28-day grid ending on today without future days', () => {
    const grid = getLast28DaysGrid();
    expect(grid.days).toHaveLength(28);
    const today = todayKey();
    expect(grid.days[grid.days.length - 1].dateStr).toBe(today);
  });

  it('formats relative times in Vietnamese cleanly', () => {
    const now = new Date();
    expect(formatRelativeTimeVN(now.toISOString())).toBe('Vừa xong');

    const tenMinAgo = new Date(Date.now() - 10 * 60 * 1000).toISOString();
    expect(formatRelativeTimeVN(tenMinAgo)).toBe('10 phút trước');

    const twoHoursAgo = new Date(Date.now() - 2 * 3600 * 1000).toISOString();
    expect(formatRelativeTimeVN(twoHoursAgo)).toBe('2 giờ trước');
  });
});
