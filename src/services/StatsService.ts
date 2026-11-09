import { getSupabase } from '@/lib/supabase';

export interface DayStudyTime {
  day: string; // e.g. "T2", "T3"
  date: string; // "YYYY-MM-DD"
  minutes: number;
}

export interface ExamStats {
  averageScore: number;
  totalExams: number;
}

export class StatsService {
  static async getWeeklyStudyMinutes(userId: string): Promise<DayStudyTime[]> {
    const supabase = getSupabase();
    const result: DayStudyTime[] = [];
    const daysLabel = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];

    const today = new Date();
    // 7 days ending today
    for (let i = 6; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      const dayLabel = daysLabel[d.getDay()];
      result.push({
        day: dayLabel,
        date: dateStr,
        minutes: 0,
      });
    }

    if (!supabase) return result;

    try {
      const startDate = result[0].date;
      const { data, error } = await supabase
        .from('study_sessions')
        .select('day, seconds')
        .eq('user_id', userId)
        .gte('day', startDate);

      if (!error && data) {
        data.forEach((row) => {
          const matched = result.find((r) => r.date === row.day);
          if (matched) {
            matched.minutes = Math.round(row.seconds / 60);
          }
        });
      }
    } catch {}

    return result;
  }

  static async getExamPerformance(userId: string): Promise<ExamStats> {
    const supabase = getSupabase();
    if (!supabase) {
      return { averageScore: 0, totalExams: 0 };
    }

    try {
      const { data, error } = await supabase
        .from('exam_attempts')
        .select('score')
        .eq('user_id', userId);

      if (error || !data || data.length === 0) {
        return { averageScore: 0, totalExams: 0 };
      }

      const total = data.length;
      const sum = data.reduce((acc, curr) => acc + Number(curr.score), 0);
      return {
        averageScore: Math.round((sum / total) * 10) / 10,
        totalExams: total,
      };
    } catch {
      return { averageScore: 0, totalExams: 0 };
    }
  }

  static async getMonthlyActivityGrid(userId: string): Promise<{ date: string; minutes: number; isToday?: boolean; isMonthStart?: boolean; monthLabel?: string }[]> {
    const supabase = getSupabase();
    const grid: { date: string; minutes: number; isToday?: boolean; isMonthStart?: boolean; monthLabel?: string }[] = [];
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];

    // Căn chuẩn lưới 28 ngày (4 tuần đầy đủ từ T2 đến CN):
    // JS getDay(): 0 = CN, 1 = T2, 2 = T3, ..., 6 = T7
    const dayOfWeek = today.getDay();
    const distanceToMonday = (dayOfWeek + 6) % 7; // Số ngày từ Thứ Hai tuần này
    const currentMonday = new Date(today);
    currentMonday.setDate(today.getDate() - distanceToMonday);

    // Lùi thêm 3 tuần (21 ngày) để có đúng 4 tuần tròn (28 ngày)
    const startMonday = new Date(currentMonday);
    startMonday.setDate(currentMonday.getDate() - 21);

    for (let i = 0; i < 28; i++) {
      const d = new Date(startMonday);
      d.setDate(startMonday.getDate() + i);
      const dateStr = d.toISOString().split('T')[0];
      const isToday = dateStr === todayStr;
      const isMonthStart = d.getDate() === 1 || i === 0;
      const monthLabel = isMonthStart ? `Th${d.getMonth() + 1}` : undefined;

      grid.push({
        date: dateStr,
        minutes: 0,
        isToday,
        isMonthStart,
        monthLabel,
      });
    }

    if (!supabase) return grid;

    try {
      const startDate = grid[0].date;
      const { data, error } = await supabase
        .from('study_sessions')
        .select('day, seconds')
        .eq('user_id', userId)
        .gte('day', startDate);

      if (!error && data) {
        data.forEach((row) => {
          const matched = grid.find((r) => r.date === row.day);
          if (matched) {
            matched.minutes = Math.round(row.seconds / 60);
          }
        });
      }
    } catch {}

    return grid;
  }
}
