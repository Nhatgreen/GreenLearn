import { getIDB } from '@/lib/indexeddb';
import { getSupabase } from '@/lib/supabase';

export interface OfflineOp {
  id?: number;
  table: 'study_spaces' | 'desk_documents' | 'desk_drawings' | 'inteline_threads';
  action: 'upsert' | 'delete';
  payload: any;
  timestamp: number;
}

export class OfflineQueue {
  private static isFlushing = false;

  static async enqueue(op: Omit<OfflineOp, 'timestamp'>): Promise<void> {
    const db = await getIDB();
    if (!db) return;

    try {
      await db.add('offline_ops', {
        ...op,
        timestamp: Date.now(),
      });
    } catch (err) {
      console.warn('Lỗi ghi vào offline queue:', err);
    }
  }

  static async flush(): Promise<{ done: number; failed: number }> {
    if (this.isFlushing) return { done: 0, failed: 0 };
    this.isFlushing = true;

    const db = await getIDB();
    const supabase = getSupabase();

    if (!db || !supabase) {
      this.isFlushing = false;
      return { done: 0, failed: 0 };
    }

    let done = 0;
    let failed = 0;

    try {
      const ops: OfflineOp[] = await db.getAll('offline_ops');
      if (!ops || ops.length === 0) {
        this.isFlushing = false;
        return { done: 0, failed: 0 };
      }

      for (const op of ops) {
        try {
          if (op.action === 'upsert') {
            const { error } = await (supabase.from(op.table) as any).upsert(op.payload);
            if (error) throw error;
          } else if (op.action === 'delete') {
            const { error } = await (supabase.from(op.table) as any).delete().eq('id', op.payload.id);
            if (error) throw error;
          }

          if (op.id !== undefined) {
            await db.delete('offline_ops', op.id);
          }
          done++;
        } catch (err) {
          console.warn(`Lỗi đồng bộ op ${op.id} lên ${op.table}:`, err);
          failed++;
        }
      }
    } catch (err) {
      console.warn('Lỗi xử lý flush offline queue:', err);
    } finally {
      this.isFlushing = false;
    }

    return { done, failed };
  }

  static initAutoFlush(): () => void {
    if (typeof window === 'undefined') return () => {};

    const handleOnline = () => {
      OfflineQueue.flush();
    };

    window.addEventListener('online', handleOnline);

    // Initial flush if already online
    if (navigator.onLine) {
      OfflineQueue.flush();
    }

    return () => {
      window.removeEventListener('online', handleOnline);
    };
  }
}
