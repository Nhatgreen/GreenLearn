'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { useAuth } from '@/hooks/useAuth';
import { getSupabase } from '@/lib/supabase';
import { getAssetPath } from '@/lib/assets';
import {
  Plug,
  Plus,
  Copy,
  Check,
  Trash2,
  Download,
  Loader2,
  AlertTriangle,
  KeyRound,
  X,
} from 'lucide-react';

interface ApiTokenRow {
  id: string;
  name: string;
  last4: string;
  created_at: string;
  expires_at: string;
  last_used_at: string | null;
  revoked_at: string | null;
}

function formatDateVi(iso: string | null): string {
  if (!iso) return 'Chưa sử dụng';
  try {
    return new Date(iso).toLocaleString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return iso;
  }
}

function getTokenStatus(row: ApiTokenRow): {
  label: string;
  badgeClass: string;
  isActive: boolean;
} {
  if (row.revoked_at) {
    return {
      label: 'Đã thu hồi',
      badgeClass: 'bg-slate-100 text-slate-600 border-slate-200',
      isActive: false,
    };
  }
  if (Date.parse(row.expires_at) <= Date.now()) {
    return {
      label: 'Hết hạn',
      badgeClass: 'bg-amber-50 text-amber-700 border-amber-200',
      isActive: false,
    };
  }
  return {
    label: 'Đang hoạt động',
    badgeClass: 'bg-green-50 text-[#166534] border-green-200',
    isActive: true,
  };
}

export function AntigravityMcpSettings() {
  const { user, status } = useAuth();
  const [tokens, setTokens] = useState<ApiTokenRow[]>([]);
  const [isLoadingTokens, setIsLoadingTokens] = useState(false);
  const [tokenName, setTokenName] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Modal hiển thị token một lần duy nhất
  const [createdToken, setCreatedToken] = useState<{
    token: string;
    expiresAt: string;
  } | null>(null);
  const [copied, setCopied] = useState(false);

  // Xác nhận thu hồi 2 bước
  const [confirmRevokeId, setConfirmRevokeId] = useState<string | null>(null);
  const [revokingId, setRevokingId] = useState<string | null>(null);

  const loadTokens = useCallback(async () => {
    const supabase = getSupabase();
    if (!supabase || !user?.id) return;

    setIsLoadingTokens(true);
    try {
      const { data, error } = await supabase
        .from('api_tokens')
        .select('id, name, last4, created_at, expires_at, last_used_at, revoked_at')
        .order('created_at', { ascending: false });

      if (error) {
        setErrorMsg('Không thể tải danh sách token.');
      } else {
        setTokens((data || []) as ApiTokenRow[]);
      }
    } catch {
      setErrorMsg('Lỗi kết nối khi tải danh sách token.');
    } finally {
      setIsLoadingTokens(false);
    }
  }, [user?.id]);

  useEffect(() => {
    if (status === 'authenticated' && user?.id) {
      loadTokens();
    }
  }, [status, user?.id, loadTokens]);

  const handleCreateToken = async (e: React.FormEvent) => {
    e.preventDefault();
    const supabase = getSupabase();
    if (!supabase || !user?.id) return;

    setErrorMsg(null);
    setIsCreating(true);
    try {
      const trimmed = tokenName.trim();
      const { data, error } = await supabase.rpc('create_api_token', {
        p_name: trimmed || 'Antigravity',
      });

      if (error) {
        setErrorMsg(error.message || 'Không thể tạo token mới.');
        return;
      }

      const row = Array.isArray(data) ? data[0] : data;
      if (row?.token) {
        setCreatedToken({
          token: row.token,
          expiresAt: row.expires_at,
        });
        setCopied(false);
        setTokenName('');
        await loadTokens();
      }
    } catch (err: any) {
      setErrorMsg(err?.message || 'Đã xảy ra lỗi khi tạo token.');
    } finally {
      setIsCreating(false);
    }
  };

  const handleCopyToken = async () => {
    if (!createdToken?.token) return;
    try {
      await navigator.clipboard.writeText(createdToken.token);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      // Fallback: người dùng tự bôi đen sao chép
    }
  };

  const handleRevokeToken = async (tokenId: string) => {
    if (confirmRevokeId !== tokenId) {
      setConfirmRevokeId(tokenId);
      setTimeout(() => {
        setConfirmRevokeId((cur) => (cur === tokenId ? null : cur));
      }, 4000);
      return;
    }

    const supabase = getSupabase();
    if (!supabase) return;

    setRevokingId(tokenId);
    setErrorMsg(null);
    try {
      const { error } = await supabase.rpc('revoke_api_token', { p_id: tokenId });
      if (error) {
        setErrorMsg(error.message || 'Không thể thu hồi token.');
      } else {
        setConfirmRevokeId(null);
        await loadTokens();
      }
    } catch (err: any) {
      setErrorMsg(err?.message || 'Lỗi khi thu hồi token.');
    } finally {
      setRevokingId(null);
    }
  };

  const cmdDownloadHref = getAssetPath('/Ketnoianti.cmd');
  const shDownloadHref = getAssetPath('/ketnoianti.sh');

  return (
    <section className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-5">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Plug className="w-4 h-4 text-[#16A34A]" />
          <h3 className="text-sm font-bold text-slate-900">Kết nối Antigravity</h3>
        </div>
        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-green-50 text-[#166534] border border-green-200">
          MCP Chỉ đọc
        </span>
      </div>

      {status !== 'authenticated' || !user ? (
        <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-xs text-slate-600">
          Vui lòng đăng nhập tài khoản GreenLearn để tạo token và kết nối bàn học với Antigravity qua MCP.
        </div>
      ) : (
        <>
          <p className="text-xs text-slate-500 leading-relaxed">
            Cho phép Antigravity đọc danh sách bàn học, ghi chú và tài liệu của bạn qua giao thức MCP (chỉ đọc, tối đa 5 token hoạt động, hết hạn sau 90 ngày).
          </p>

          {/* Tải script kết nối & 3 bước hướng dẫn */}
          <div className="p-4 rounded-2xl bg-green-50/70 border border-green-200 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <p className="text-xs font-bold text-[#166534]">Hướng dẫn kết nối nhanh (3 bước)</p>
                <ol className="text-[11px] text-slate-700 mt-1.5 space-y-1 list-decimal list-inside">
                  <li>Nhập tên (tùy chọn) và bấm <strong>Tạo token</strong> bên dưới.</li>
                  <li>
                    Tải và chạy <strong>Ketnoianti.cmd</strong> (Windows) hoặc{' '}
                    <strong>ketnoianti.sh</strong> (Linux: <code className="px-1 py-0.5 rounded bg-white/80 font-mono text-[10px]">bash ketnoianti.sh</code>).
                  </li>
                  <li>Dán token vừa sao chép vào cửa sổ dòng lệnh để hoàn tất.</li>
                </ol>
              </div>
              <div className="flex flex-col gap-2 flex-shrink-0">
                <a
                  href={cmdDownloadHref}
                  download="Ketnoianti.cmd"
                  className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#16A34A] hover:bg-[#15803D] text-white text-xs font-bold shadow-xs transition-all active:scale-95"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Tải cho Windows (.cmd)</span>
                </a>
                <a
                  href={shDownloadHref}
                  download="ketnoianti.sh"
                  className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-black text-white text-xs font-bold shadow-xs transition-all active:scale-95"
                >
                  <Download className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Tải cho Linux (.sh)</span>
                </a>
              </div>
            </div>
          </div>

          {/* Form tạo token mới */}
          <form onSubmit={handleCreateToken} className="flex flex-col sm:flex-row gap-2.5">
            <input
              type="text"
              value={tokenName}
              onChange={(e) => setTokenName(e.target.value)}
              maxLength={60}
              placeholder="Tên token (tùy chọn, mặc định: Antigravity)"
              className="flex-1 px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#16A34A]/20 focus:border-[#16A34A] transition-all"
            />
            <button
              type="submit"
              disabled={isCreating}
              className="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 bg-[#16A34A] hover:bg-[#15803D] text-white text-xs font-bold rounded-xl shadow-xs transition-all disabled:opacity-50 cursor-pointer active:scale-95 flex-shrink-0"
            >
              {isCreating ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Plus className="w-3.5 h-3.5" />
              )}
              <span>Tạo token</span>
            </button>
          </form>

          {errorMsg && (
            <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700 font-medium flex items-center gap-2">
              <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Danh sách token */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold text-slate-700">Danh sách token của bạn</h4>
              {isLoadingTokens && <Loader2 className="w-3.5 h-3.5 animate-spin text-slate-400" />}
            </div>

            {tokens.length === 0 && !isLoadingTokens ? (
              <p className="text-xs text-slate-400 py-3 text-center border border-dashed border-slate-200 rounded-xl">
                Chưa có token nào. Bấm &ldquo;Tạo token&rdquo; để bắt đầu.
              </p>
            ) : (
              <div className="divide-y divide-slate-100 border border-slate-200 rounded-2xl overflow-hidden">
                {tokens.map((item) => {
                  const st = getTokenStatus(item);
                  const isConfirming = confirmRevokeId === item.id;
                  const isRevoking = revokingId === item.id;

                  return (
                    <div
                      key={item.id}
                      className="p-3.5 bg-white flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                    >
                      <div className="space-y-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <KeyRound className="w-3.5 h-3.5 text-slate-500 flex-shrink-0" />
                          <span className="text-xs font-bold text-slate-900 truncate">
                            {item.name}
                          </span>
                          <code className="text-[11px] font-mono px-1.5 py-0.5 rounded bg-slate-100 text-slate-700">
                            ...{item.last4}
                          </code>
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${st.badgeClass}`}
                          >
                            {st.label}
                          </span>
                        </div>
                        <div className="flex flex-wrap gap-x-4 gap-y-0.5 text-[11px] text-slate-500">
                          <span>Tạo: {formatDateVi(item.created_at)}</span>
                          <span>Dùng cuối: {formatDateVi(item.last_used_at)}</span>
                          <span>Hạn: {formatDateVi(item.expires_at)}</span>
                        </div>
                      </div>

                      {st.isActive && (
                        <button
                          type="button"
                          onClick={() => handleRevokeToken(item.id)}
                          disabled={isRevoking}
                          className={`inline-flex items-center justify-center gap-1 px-3 py-1.5 rounded-xl text-[11px] font-bold border transition-all cursor-pointer active:scale-95 flex-shrink-0 ${
                            isConfirming
                              ? 'bg-rose-600 hover:bg-rose-700 text-white border-rose-600'
                              : 'bg-white hover:bg-rose-50 text-rose-600 border-rose-200'
                          }`}
                        >
                          {isRevoking ? (
                            <Loader2 className="w-3 h-3 animate-spin" />
                          ) : (
                            <Trash2 className="w-3 h-3" />
                          )}
                          <span>{isConfirming ? 'Xác nhận thu hồi?' : 'Thu hồi'}</span>
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </>
      )}

      {/* Modal hiển thị token một lần duy nhất (React Portal) */}
      {createdToken &&
        typeof document !== 'undefined' &&
        createPortal(
          <div className="fixed inset-0 z-[9995] flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
            <div className="bg-white border border-slate-200 rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-green-50 border border-green-200 flex items-center justify-center">
                    <KeyRound className="w-4 h-4 text-[#16A34A]" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-slate-900">Token kết nối đã sẵn sàng</h4>
                    <p className="text-[11px] text-slate-500">
                      Hết hạn: {formatDateVi(createdToken.expiresAt)}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setCreatedToken(null)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer"
                  aria-label="Đóng"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-800 flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                <span className="font-medium">
                  Chỉ hiển thị một lần. Hãy sao chép và lưu token ngay trước khi đóng hộp thoại này.
                </span>
              </div>

              <div className="p-3 rounded-xl bg-slate-900 text-slate-100 font-mono text-xs break-all select-all">
                {createdToken.token}
              </div>

              <div className="flex items-center justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={handleCopyToken}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#16A34A] hover:bg-[#15803D] text-white text-xs font-bold shadow-xs transition-all cursor-pointer active:scale-95"
                >
                  {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copied ? 'Đã sao chép' : 'Sao chép token'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setCreatedToken(null)}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-all cursor-pointer"
                >
                  Đã lưu, đóng lại
                </button>
              </div>
            </div>
          </div>,
          document.body
        )}
    </section>
  );
}
