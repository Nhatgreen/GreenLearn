export const VIETNAM_TIMEZONE = 'Asia/Ho_Chi_Minh';

/**
 * Trả về chuỗi ngày YYYY-MM-DD theo giờ Việt Nam
 */
export function todayKey(date: Date = new Date()): string {
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: VIETNAM_TIMEZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
  return formatter.format(date);
}

/**
 * Định dạng mốc thời gian ISO/Date sang YYYY-MM-DD giờ VN
 */
export function toDateKeyVN(input: string | number | Date): string {
  const d = typeof input === 'string' || typeof input === 'number' ? new Date(input) : input;
  return todayKey(d);
}

/**
 * Lấy danh sách 28 ngày học tập gần nhất (kết thúc đúng ngày hôm nay giờ VN, không tràn tương lai)
 * Kèm số ô đệm trống đầu lưới (leading empty cells) để ngày đầu tiên khớp đúng cột thứ (T2..CN).
 */
export function getLast28DaysGrid(activityMinutesMap: Record<string, number> = {}, referenceDate: Date = new Date()) {
  const todayStr = todayKey(referenceDate);
  const [tY, tM, tD] = todayStr.split('-').map(Number);
  
  // Neo mốc 12:00 trưa để tránh nhảy ngày do chuyển đổi giờ
  const anchor = new Date(Date.UTC(tY, tM - 1, tD, 12, 0, 0));

  const days: { dateStr: string; dayNumber: number; minutes: number; isToday: boolean; dow: number }[] = [];

  for (let i = 27; i >= 0; i--) {
    const cur = new Date(anchor.getTime() - i * 86400000);
    const dStr = cur.toISOString().split('T')[0];
    const dow = cur.getUTCDay(); // 0 = CN, 1 = T2, ..., 6 = T7
    days.push({
      dateStr: dStr,
      dayNumber: Number(dStr.split('-')[2]),
      minutes: activityMinutesMap[dStr] || 0,
      isToday: dStr === todayStr,
      dow,
    });
  }

  // Thứ Hai coi là cột 0, Chủ Nhật coi là cột 6
  // dow: 0 (CN) -> 6, 1 (T2) -> 0, 2 (T3) -> 1, ..., 6 (T7) -> 5
  const firstDow = days[0].dow;
  const leadingEmptyCells = (firstDow + 6) % 7;

  return {
    days,
    leadingEmptyCells,
    todayStr,
  };
}

/**
 * Định dạng thời gian tương đối thân thiện tiếng Việt
 */
export function formatRelativeTimeVN(timestamp?: string | number | Date): string {
  if (!timestamp) return 'Chưa mở';
  const time = typeof timestamp === 'string' || typeof timestamp === 'number' ? new Date(timestamp).getTime() : timestamp.getTime();
  if (isNaN(time)) return 'Chưa mở';

  const diffMs = Date.now() - time;
  if (diffMs < 0) return 'Vừa xong';
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHour = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHour / 24);

  if (diffMin < 1) return 'Vừa xong';
  if (diffMin < 60) return `${diffMin} phút trước`;
  if (diffHour < 24) return `${diffHour} giờ trước`;

  const d = new Date(time);
  const hours = String(d.getHours()).padStart(2, '0');
  const minutes = String(d.getMinutes()).padStart(2, '0');

  if (diffDay === 1) return `Hôm qua ${hours}:${minutes}`;
  if (diffDay < 7) return `${diffDay} ngày trước`;

  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  return `${day}/${month} ${hours}:${minutes}`;
}
