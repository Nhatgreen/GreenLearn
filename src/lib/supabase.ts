import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { applyDiscordUrlMappings } from './discord/urlMappings';

const envUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const envKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

const DEFAULT_SUPABASE_URL = 'https://jzwmgflmhtaceasqzfop.supabase.co';
const DEFAULT_SUPABASE_ANON_KEY = 'sb_publishable_JWNMIkBarfQNQLUm4SqEIQ_g02iEqFF';

export function getSupabaseConfig(): { url: string; anonKey: string; isConfigured: boolean } {
  let url = envUrl;
  let anonKey = envKey;

  // Đọc từ localStorage nếu người dùng đã cấu hình riêng (loại bỏ dứt điểm URL ViTudy cũ)
  if (typeof window !== 'undefined') {
    const localUrl = localStorage.getItem('greenlearn_supabase_url') || localStorage.getItem('vitudy_supabase_url');
    const localKey = localStorage.getItem('greenlearn_supabase_anon_key') || localStorage.getItem('vitudy_supabase_anon_key');
    if (localUrl && localKey && !localUrl.includes('yndwxcnedlilmsbbydvb')) {
      url = localUrl;
      anonKey = localKey;
    } else if (localUrl && localUrl.includes('yndwxcnedlilmsbbydvb')) {
      localStorage.removeItem('greenlearn_supabase_url');
      localStorage.removeItem('greenlearn_supabase_anon_key');
      localStorage.removeItem('vitudy_supabase_url');
      localStorage.removeItem('vitudy_supabase_anon_key');
    }
  }

  // Sử dụng cấu hình mặc định của GreenLearn nếu biến môi trường chưa có
  if (!url || !anonKey || !url.startsWith('https://') || url.includes('placeholder')) {
    url = DEFAULT_SUPABASE_URL;
    anonKey = DEFAULT_SUPABASE_ANON_KEY;
  }

  const isConfigured = Boolean(
    url && 
    anonKey && 
    url.startsWith('https://') && 
    !url.includes('placeholder')
  );
  return { url, anonKey, isConfigured };
}

let cachedClient: SupabaseClient | null = null;

export function getSupabase(): SupabaseClient | null {
  const { url, anonKey, isConfigured } = getSupabaseConfig();
  if (!isConfigured) return null;

  if (cachedClient) {
    return cachedClient;
  }

  // Khởi tạo URL mapping nếu đang chạy trong Discord Embedded Activity trước khi gọi mạng
  applyDiscordUrlMappings();

  try {
    cachedClient = createClient(url, anonKey, {
      auth: {
        flowType: 'pkce',
        detectSessionInUrl: true,
        persistSession: true,
        autoRefreshToken: true,
      },
      realtime: {
        params: {
          eventsPerSecond: 20,
        },
      },
    });
    return cachedClient;
  } catch (err) {
    console.warn('Không thể khởi tạo Supabase Client:', err);
    return null;
  }
}

export function saveSupabaseConfig(url: string, anonKey: string) {
  if (typeof window !== 'undefined') {
    localStorage.setItem('greenlearn_supabase_url', url.trim());
    localStorage.setItem('greenlearn_supabase_anon_key', anonKey.trim());
    cachedClient = null;
  }
}

export function clearSupabaseConfig() {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('greenlearn_supabase_url');
    localStorage.removeItem('greenlearn_supabase_anon_key');
    localStorage.removeItem('vitudy_supabase_url');
    localStorage.removeItem('vitudy_supabase_anon_key');
    cachedClient = null;
  }
}
