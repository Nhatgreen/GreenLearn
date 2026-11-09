'use client';

import { useState, useEffect, useRef } from 'react';
import { isDiscordActivity } from '@/lib/discord/detect';
import { initDiscord } from '@/lib/discord/sdk';
import { getSupabase } from '@/lib/supabase';

export interface UseDiscordActivityResult {
  isDiscord: boolean;
  status: 'idle' | 'authorizing' | 'ready' | 'error';
  discordUser: {
    id: string;
    username: string;
    avatar: string | null;
  } | null;
  channelId: string | null;
  guildId: string | null;
  instanceId: string | null;
  error: string | null;
}

export function useDiscordActivity(): UseDiscordActivityResult {
  const [isDiscord] = useState<boolean>(() => isDiscordActivity());
  const [status, setStatus] = useState<UseDiscordActivityResult['status']>(isDiscord ? 'authorizing' : 'idle');
  const [discordUser, setDiscordUser] = useState<UseDiscordActivityResult['discordUser']>(null);
  const [channelId, setChannelId] = useState<string | null>(null);
  const [guildId, setGuildId] = useState<string | null>(null);
  const [instanceId, setInstanceId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const initAttemptedRef = useRef(false);

  useEffect(() => {
    if (!isDiscord) return;
    if (initAttemptedRef.current) return;
    initAttemptedRef.current = true;

    let isMounted = true;

    async function runDiscordAuth() {
      try {
        setStatus('authorizing');

        // 1. Khởi tạo SDK và lấy mã ủy quyền code
        const discordData = await initDiscord();
        if (!isMounted) return;

        setDiscordUser(discordData.user);
        setChannelId(discordData.channelId);
        setGuildId(discordData.guildId);
        setInstanceId(discordData.instanceId);

        // 2. Gửi code lên Supabase Edge Function discord-auth
        const supabase = getSupabase();
        if (!supabase) {
          throw new Error('Supabase Client chưa được cấu hình.');
        }

        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
        const res = await fetch(`${supabaseUrl}/functions/v1/discord-auth`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ code: discordData.code }),
        });

        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          throw new Error(errData.error || `Lỗi xác thực Discord: HTTP ${res.status}`);
        }

        const authPayload = await res.json();
        const tokenHash = authPayload.token_hash;

        // 3. Đổi token_hash lấy session Supabase Auth thật
        const { error: verifyError } = await supabase.auth.verifyOtp({
          token_hash: tokenHash,
          type: 'magiclink',
        });

        if (verifyError) {
          throw new Error(verifyError.message);
        }

        if (isMounted) {
          setStatus('ready');
        }
      } catch (err: any) {
        console.error('[useDiscordActivity] Auth failed:', err);
        if (isMounted) {
          setError(err.message || 'Không thể đăng nhập Discord Activity');
          setStatus('error');
        }
      }
    }

    runDiscordAuth();

    return () => {
      isMounted = false;
    };
  }, [isDiscord]);

  return {
    isDiscord,
    status,
    discordUser,
    channelId,
    guildId,
    instanceId,
    error,
  };
}
