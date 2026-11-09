import { getSupabase } from '@/lib/supabase';

const MAX_FILE_SIZE = 20 * 1024 * 1024; // 20MB

export class DocumentService {
  static async uploadFile(file: File, userId: string): Promise<{ path: string; publicUrl: string }> {
    if (file.size > MAX_FILE_SIZE) {
      throw new Error('Kích thước file vượt quá giới hạn 20MB.');
    }

    const supabase = getSupabase();
    if (!supabase || !userId) {
      // Mock path for offline/guest mode
      return {
        path: `local/${Date.now()}-${file.name}`,
        publicUrl: URL.createObjectURL(file),
      };
    }

    const sanitizedName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
    const path = `${userId}/${Date.now()}-${sanitizedName}`;

    const { error: uploadError } = await supabase.storage
      .from('documents')
      .upload(path, file, {
        cacheControl: '3600',
        upsert: false,
      });

    if (uploadError) {
      throw new Error(`Lỗi tải file lên đám mây: ${uploadError.message}`);
    }

    const { data: { publicUrl } } = supabase.storage
      .from('documents')
      .getPublicUrl(path);

    return { path, publicUrl };
  }

  static getFileUrl(path: string): string {
    const supabase = getSupabase();
    if (!supabase) {
      return `/documents/${path}`;
    }
    const { data: { publicUrl } } = supabase.storage
      .from('documents')
      .getPublicUrl(path);

    return publicUrl || `/documents/${path}`;
  }

  static async deleteFile(path: string): Promise<void> {
    const supabase = getSupabase();
    if (!supabase || !path) return;

    try {
      await supabase.storage.from('documents').remove([path]);
    } catch (err) {
      console.warn('Lỗi xoá tài liệu khỏi Storage:', err);
    }
  }
}
