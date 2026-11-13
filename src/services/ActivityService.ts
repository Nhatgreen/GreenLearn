import { getSupabase } from '@/lib/supabase';

export interface ExamAttemptPayload {
  documentId?: string;
  score: number;
  total: number;
  correct: number;
}

export class ActivityService {
  /**
   * Ghi nhận nhịp tim học tập an toàn vào CSDL Supabase
   * @param seconds Số giây học tập (tối đa 30s)
   */
  static async recordHeartbeat(seconds = 20): Promise<number> {
    const supabase = getSupabase();
    if (!supabase) return seconds;

    try {
      const { data, error } = await supabase.rpc('record_heartbeat', {
        p_seconds: seconds,
      });
      if (error) throw error;
      return typeof data === 'number' ? data : seconds;
    } catch {
      return seconds;
    }
  }

  /**
   * Lưu kết quả làm bài thi trắc nghiệm hoặc bài kiểm tra
   */
  static async submitExamAttempt(payload: ExamAttemptPayload): Promise<string | null> {
    const supabase = getSupabase();
    if (!supabase) return null;

    try {
      const { data, error } = await supabase.rpc('submit_exam_attempt', {
        p_document_id: payload.documentId || null,
        p_score: payload.score,
        p_total: payload.total,
        p_correct: payload.correct,
      });
      if (error) throw error;
      return data;
    } catch {
      return null;
    }
  }

  /**
   * Ghi nhận một phiên học tập Pomodoro hoàn thành (ví dụ 25 phút)
   */
  static async recordStudySession(minutes = 25): Promise<number> {
    const seconds = Math.min(minutes * 60, 1800);
    return this.recordHeartbeat(seconds);
  }

  /**
   * Khởi động chu kỳ gửi heartbeat tự động mỗi 20 giây
   * Chỉ gửi khi tab đang mở (document.visibilityState === 'visible') và người dùng có tương tác
   */
  static startHeartbeat(isActive: () => boolean): () => void {
    if (typeof window === 'undefined') return () => {};

    const timer = setInterval(async () => {
      if (document.visibilityState === 'visible' && isActive()) {
        await ActivityService.recordHeartbeat(20);
      }
    }, 20000);

    return () => {
      clearInterval(timer);
    };
  }
}
