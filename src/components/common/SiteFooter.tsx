'use client';

import React from 'react';
import Link from 'next/link';
import { BookOpen, Shield, HelpCircle, FileText, Mail, Heart, RefreshCcw } from 'lucide-react';

function GithubIcon({ className = 'w-3.5 h-3.5' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"
      />
    </svg>
  );
}

export function SiteFooter() {
  return (
    <footer className="border-t border-slate-200 bg-slate-50 text-slate-700 py-12 px-6">
      <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
        {/* Logo và giới thiệu ngắn */}
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-[#16A34A] text-white flex items-center justify-center font-black shadow-2xs">
            <BookOpen className="w-4 h-4 stroke-[2.4]" />
          </div>
          <div>
            <div className="text-sm font-bold text-slate-900 tracking-tight">GreenLearn</div>
            <p className="text-xs text-slate-600 whitespace-nowrap">Không gian học tập 2.5D miễn phí</p>
          </div>
        </div>

        {/* Các liên kết điều hướng và hỗ trợ */}
        <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-xs font-semibold text-slate-700">
          <Link href="/terms" className="hover:text-[#16A34A] transition-colors flex items-center gap-1.5 whitespace-nowrap">
            <FileText className="w-3.5 h-3.5 text-slate-500" />
            <span>Điều khoản sử dụng</span>
          </Link>
          <Link href="/privacy" className="hover:text-[#16A34A] transition-colors flex items-center gap-1.5 whitespace-nowrap">
            <Shield className="w-3.5 h-3.5 text-slate-500" />
            <span>Chính sách quyền riêng tư</span>
          </Link>
          <Link href="/faq" className="hover:text-[#16A34A] transition-colors flex items-center gap-1.5 whitespace-nowrap">
            <HelpCircle className="w-3.5 h-3.5 text-slate-500" />
            <span>Hỏi đáp</span>
          </Link>
          <a
            href="https://github.com/Nhatgreen/GreenLearn"
            target="_blank"
            rel="noreferrer"
            className="hover:text-[#16A34A] transition-colors flex items-center gap-1.5 text-slate-600 whitespace-nowrap"
            title="Kho mã nguồn mở GreenLearn trên GitHub"
          >
            <GithubIcon className="w-3.5 h-3.5 text-slate-500" />
            <span>GitHub</span>
          </a>
        </div>

        {/* Thông tin bản quyền & ghi công - chuẩn tương phản WCAG AA */}
        <div className="text-xs text-slate-600 text-center md:text-right font-medium">
          <p className="whitespace-nowrap">© 2026 GreenLearn. Phát triển từ mã nguồn mở ViTudy (Lê Võ Thanh Nam).</p>
          <p className="mt-1 text-[11px] text-slate-500 flex items-center justify-center md:justify-end gap-1 whitespace-nowrap">
            <span>Không gian học tập mở</span>
            <Heart className="w-3 h-3 text-[#16A34A] fill-[#16A34A]" />
          </p>
        </div>
      </div>
    </footer>
  );
}
