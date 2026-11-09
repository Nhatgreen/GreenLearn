'use client';

import { useState, useEffect, useRef } from 'react';
import { getSupabase } from '@/lib/supabase';
import { PaymentHistoryItem } from '@/services/PaymentService';

export interface UsePaymentStatusResult {
  status: PaymentHistoryItem['status'] | 'loading';
  secondsLeft: number;
  paymentData: PaymentHistoryItem | null;
  error: string | null;
}

export function usePaymentStatus(
  requestId: string | null,
  initialExpiresAt?: string | null
): UsePaymentStatusResult {
  const [status, setStatus] = useState<PaymentHistoryItem['status'] | 'loading'>('loading');
  const [paymentData, setPaymentData] = useState<PaymentHistoryItem | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [secondsLeft, setSecondsLeft] = useState<number>(() => {
    if (!initialExpiresAt) return 15 * 60;
    const diff = Math.floor((new Date(initialExpiresAt).getTime() - Date.now()) / 1000);
    return Math.max(0, diff);
  });

  const isTerminalRef = useRef(false);

  // Update seconds left countdown every 1s
  useEffect(() => {
    if (!requestId) return;

    const interval = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          if (!isTerminalRef.current && status === 'pending') {
            setStatus('expired');
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [requestId, status]);

  useEffect(() => {
    if (!requestId) {
      setStatus('loading');
      setPaymentData(null);
      setError(null);
      return;
    }

    const supabase = getSupabase();
    if (!supabase) {
      // Mock / Offline mode: default to pending
      setStatus('pending');
      return;
    }

    let isMounted = true;
    let pollTimer: NodeJS.Timeout | null = null;

    const checkStatus = async () => {
      try {
        const { data, error: err } = await supabase
          .from('payment_requests')
          .select('*')
          .eq('id', requestId)
          .single();

        if (err) {
          if (isMounted) setError(err.message);
          return;
        }

        if (data && isMounted) {
          const item: PaymentHistoryItem = {
            id: data.id,
            code: data.code,
            amountVnd: data.amount_vnd,
            tokenAmount: data.token_amount,
            status: data.status,
            createdAt: data.created_at,
            completedAt: data.completed_at,
          };
          setPaymentData(item);
          setStatus(item.status);

          if (data.expires_at) {
            const diff = Math.floor((new Date(data.expires_at).getTime() - Date.now()) / 1000);
            setSecondsLeft(Math.max(0, diff));
          }

          if (['completed', 'completed_late', 'expired', 'failed'].includes(data.status)) {
            isTerminalRef.current = true;
            if (pollTimer) clearInterval(pollTimer);
          }
        }
      } catch (e: any) {
        if (isMounted) setError(e.message);
      }
    };

    // Initial check
    checkStatus();

    // Polling fallback every 5s
    pollTimer = setInterval(() => {
      if (!isTerminalRef.current) {
        checkStatus();
      }
    }, 5000);

    // Realtime channel
    const channel = supabase
      .channel(`payment-status-${requestId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'payment_requests',
          filter: `id=eq.${requestId}`,
        },
        (payload) => {
          if (!isMounted) return;
          const updated = payload.new as any;
          if (updated) {
            const item: PaymentHistoryItem = {
              id: updated.id,
              code: updated.code,
              amountVnd: updated.amount_vnd,
              tokenAmount: updated.token_amount,
              status: updated.status,
              createdAt: updated.created_at,
              completedAt: updated.completed_at,
            };
            setPaymentData(item);
            setStatus(item.status);

            if (['completed', 'completed_late', 'expired', 'failed'].includes(updated.status)) {
              isTerminalRef.current = true;
              if (pollTimer) clearInterval(pollTimer);
            }
          }
        }
      )
      .subscribe();

    return () => {
      isMounted = false;
      if (pollTimer) clearInterval(pollTimer);
      supabase.removeChannel(channel);
    };
  }, [requestId]);

  return {
    status,
    secondsLeft,
    paymentData,
    error,
  };
}
