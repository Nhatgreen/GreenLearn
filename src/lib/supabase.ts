import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { applyDiscordUrlMappings } from './discord/urlMappings';

const envUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const envKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

const DEFAULT_SUPABASE_URL = 'https://yndwxcnedlilmsbbydvb.supabase.co';
const DEFAULT_SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InluZHd4Y25lZGxpbG1zYmJ5ZHZiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODczMDE3MjQsImV4cCI6MjEwMjg3NzcyNH0.9uTO5Vfg-eQvCIkiUcXFgH9vYsjnglicr4KbYnnl-E8';

export function getSupabaseConfig(): { url: string; anonKey: string; isConfigured: boolean } {
  let url = envUrl;
  let anonKey = envKey;

  // Đọc từ localStorage nếu người dùng đã cấu hình riêng
  if (typeof window !== 'undefined') {
    const localUrl = localStorage.getItem('vitudy_supabase_url');
    const localKey = localStorage.getItem('vitudy_supabase_anon_key');
    if (localUrl && localKey) {
      url = localUrl;
      anonKey = localKey;
    }
  }

  // Sử dụng cấu hình mặc định của ViTudy nếu biến môi trường chưa có
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
    localStorage.setItem('vitudy_supabase_url', url.trim());
    localStorage.setItem('vitudy_supabase_anon_key', anonKey.trim());
    cachedClient = null;
  }
}

export function clearSupabaseConfig() {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('vitudy_supabase_url');
    localStorage.removeItem('vitudy_supabase_anon_key');
    cachedClient = null;
  }
}
