'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { getSupabase } from '@/lib/supabase';
import { isDiscordActivity } from '@/lib/discord/detect';
import { migrateLegacyStorage } from '@/lib/storageMigration';

export type AuthStatus = 'loading' | 'guest' | 'authenticated';

export interface UserProfile {
  id: string;
  email: string;
  display_name: string | null;
  avatar_url: string | null;
}

export interface AuthResult {
  success: boolean;
  error?: string;
}

export interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: UserProfile | null;
  status: AuthStatus;
  isLoading: boolean;
  signIn: (email: string, password: string) => Promise<AuthResult>;
  signUp: (email: string, password: string, displayName?: string) => Promise<AuthResult>;
  signOut: () => Promise<void>;
  signInWithOAuth: (provider: 'google' | 'discord') => Promise<AuthResult>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [status, setStatus] = useState<AuthStatus>('guest');
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const fetchProfile = useCallback(async (userId: string) => {
    const supabase = getSupabase();
    if (!supabase) return;
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, email, display_name, avatar_url')
        .eq('id', userId)
        .single();
      if (!error && data) {
        setProfile(data as UserProfile);
      }
    } catch (err) {
      console.warn('Lỗi tải thông tin hồ sơ:', err);
    }
  }, []);

  const refreshProfile = useCallback(async () => {
    if (user?.id) {
      await fetchProfile(user.id);
    }
  }, [user?.id, fetchProfile]);

  useEffect(() => {
    migrateLegacyStorage();

    const supabase = getSupabase();
    if (!supabase) {
      setStatus('guest');
      return;
    }

    // Check initial session
    supabase.auth.getSession().then(async ({ data: { session: initialSession } }) => {
      setSession(initialSession);
      setUser(initialSession?.user ?? null);
      if (initialSession?.user) {
        setStatus('authenticated');
        fetchProfile(initialSession.user.id);
      } else if (isDiscordActivity()) {
        // Trong iframe Discord Activity: tự động đăng nhập qua luồng SDK
        try {
          setStatus('loading');
          const { initDiscord } = await import('@/lib/discord/sdk');
          const discordData = await initDiscord();
          const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
          const res = await fetch(`${supabaseUrl}/functions/v1/discord-auth`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ code: discordData.code }),
          });
          if (!res.ok) {
            throw new Error('Discord auth failed');
          }
          const { token_hash } = await res.json();
          await supabase.auth.verifyOtp({ token_hash, type: 'magiclink' });
        } catch (err) {
          console.warn('[Discord Auth] Auto-login failed:', err);
          setStatus('guest');
        }
      } else {
        setStatus('guest');
      }
    });

    // Subscribe to auth state updates across tabs
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, currentSession) => {
        setSession(currentSession);
        setUser(currentSession?.user ?? null);

        if (currentSession?.user) {
          setStatus('authenticated');
          fetchProfile(currentSession.user.id);
        } else {
          setProfile(null);
          setStatus('guest');
        }
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, [fetchProfile]);

  const signIn = async (email: string, password: string): Promise<AuthResult> => {
    const supabase = getSupabase();
    if (!supabase) {
      return { success: false, error: 'Chưa kết nối Supabase Cloud.' };
    }

    setIsLoading(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (error) {
        let msg = error.message;
        if (error.message.includes('Invalid login credentials')) {
          msg = 'Email hoặc mật khẩu không chính xác.';
        } else if (error.message.includes('Email not confirmed')) {
          msg = 'Vui lòng xác thực email trước khi đăng nhập.';
        }
        return { success: false, error: msg };
      }

      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message || 'Lỗi đăng nhập không xác định.' };
    } finally {
      setIsLoading(false);
    }
  };

  const signUp = async (email: string, password: string, displayName?: string): Promise<AuthResult> => {
    const supabase = getSupabase();
    if (!supabase) {
      return { success: false, error: 'Chưa kết nối Supabase Cloud.' };
    }

    setIsLoading(true);
    try {
      const { error } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          data: {
            display_name: displayName?.trim() || splitEmailName(email),
          },
        },
      });

      if (error) {
        let msg = error.message;
        if (error.message.includes('already registered')) {
          msg = 'Email này đã được đăng ký tài khoản.';
        } else if (error.message.includes('Password should be')) {
          msg = 'Mật khẩu phải có độ dài tối thiểu 6 ký tự.';
        }
        return { success: false, error: msg };
      }

      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message || 'Lỗi đăng ký không xác định.' };
    } finally {
      setIsLoading(false);
    }
  };

  const signOut = async (): Promise<void> => {
    const supabase = getSupabase();
    if (supabase) {
      await supabase.auth.signOut();
    }
    setUser(null);
    setSession(null);
    setProfile(null);
    setStatus('guest');
  };

  const signInWithOAuth = async (provider: 'google' | 'discord'): Promise<AuthResult> => {
    const supabase = getSupabase();
    if (!supabase) {
      return { success: false, error: 'Chưa thể kết nối tới máy chủ xác thực.' };
    }

    try {
      setIsLoading(true);
      let basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? '';
      if (!basePath && typeof window !== 'undefined') {
        if (window.location.pathname.startsWith('/GreenLearn')) {
          basePath = '/GreenLearn';
        } else if (window.location.pathname.startsWith('/ViTudy')) {
          basePath = '/ViTudy';
        }
      }
      const origin = typeof window !== 'undefined' ? window.location.origin : '';
      const redirectUrl = `${origin}${basePath}/auth/callback`;

      const { data, error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: redirectUrl,
          skipBrowserRedirect: false,
        },
      });

      if (error) {
        setIsLoading(false);
        const msg = error.message.toLowerCase();
        if (msg.includes('not enabled') || msg.includes('unsupported provider')) {
          return {
            success: false,
            error: `Đăng nhập qua ${provider === 'google' ? 'Google' : 'Discord'} chưa được kích hoạt trên hệ thống máy chủ. Bạn có thể đăng ký và đăng nhập nhanh bằng Email bên dưới.`,
          };
        }
        return { success: false, error: error.message };
      }

      if (data?.url && typeof window !== 'undefined') {
        window.location.href = data.url;
        return { success: true };
      }

      setIsLoading(false);
      return { success: true };
    } catch (err: any) {
      setIsLoading(false);
      return { success: false, error: err?.message || 'Lỗi trong quá trình khởi tạo đăng nhập.' };
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        profile,
        status,
        isLoading,
        signIn,
        signUp,
        signOut,
        signInWithOAuth,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

function splitEmailName(email: string): string {
  return email.split('@')[0] || 'Học viên GreenLearn';
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
