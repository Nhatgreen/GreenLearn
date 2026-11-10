'use client';

import React, { useState } from 'react';
import { summarizeWithTextRank } from '@/lib/nonAiEngine';
import { useStudySpace } from '@/context/StudySpaceContext';
import { askAi } from '@/lib/aiClient';
import { Sparkles, Copy, Check, StickyNote } from 'lucide-react';

interface SummaryTabProps {
  fullText: string;
  documentTitle: string;
  isPaper?: boolean;
  targetPos?: { x: number; y: number };
}

export function SummaryTab({ fullText, documentTitle, isPaper, targetPos }: SummaryTabProps) {
  const { addStickyNote } = useStudySpace();

  const [summaryResult, setSummaryResult] = useState<string>('');
  const [useAi, setUseAi] = useState(false);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleGenerateSummary = async () => {
    if (!fullText) return;

    if (!useAi) {
      // Non-AI TextRank + TF-IDF summarization (Client-side, 0đ)
      const res = summarizeWithTextRank(fullText, 4);
      setSummaryResult(res.join('\n\n'));
      return;
    }

    setLoading(true);
    try {
      const data = await askAi({
        prompt: `Hãy tóm tắt văn bản sau thành 3 đến 5 gạch đầu dòng súc tích, làm nổi bật các khái niệm trọng tâm nhất để ôn thi:`,
        context: fullText.slice(0, 4000),
      });

      if (data.reply) {
        setSummaryResult(data.reply);
      } else {
        setSummaryResult(summarizeWithTextRank(fullText, 4).join('\n\n'));
      }
    } catch {
      setSummaryResult(summarizeWithTextRank(fullText, 4).join('\n\n'));
    } finally {
      setLoading(false);
    }
  };

  const handleCopyToClipboard = () => {
    if (!summaryResult) return;
    navigator.clipboard.writeText(summaryResult);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handlePinSummaryToDesk = () => {
    if (!summaryResult) return;
    const posX = targetPos?.x ?? 450;
    const posY = targetPos?.y ?? 250;
    addStickyNote(`[TÓM TẮT: ${documentTitle}]\n\n${summaryResult}`, posX, posY);
  };

  if (isPaper) {
    return (
      <div className="flex-1 flex flex-col p-4 font-sans text-slate-900 bg-white overflow-hidden select-none">
        {/* Dòng 1: Tiêu đề viết ngang ra không xuống dòng: Tóm tắt nội dung trọng tâm (Bỏ mô tả) */}
        <h4 className="text-xs font-black text-slate-900 tracking-tight whitespace-nowrap mb-2">
          Tóm tắt nội dung trọng tâm
        </h4>

        {/* Dòng 2: Nổi bật tùy chọn Sử dụng AI */}
        <div className="mb-2.5">
          <label className={`flex items-center justify-between px-3 py-2 rounded-xl border transition-all cursor-pointer ${
            useAi 
              ? 'bg-gradient-to-r from-orange-50 via-amber-50 to-orange-50 border-[#16A34A]/60 shadow-2xs ring-1 ring-[#16A34A]/20' 
              : 'bg-slate-50 border-slate-200 hover:border-slate-300'
          }`}>
            <div className="flex items-center gap-2">
              <Sparkles className={`w-3.5 h-3.5 ${useAi ? 'text-[#16A34A] animate-pulse' : 'text-slate-400'}`} />
              <span className={`text-xs font-black ${useAi ? 'text-[#16A34A]' : 'text-slate-700'}`}>
                Sử dụng AI.
              </span>
              <span className="text-[9.5px] px-1.5 py-0.5 rounded-full bg-[#F0FDF4] text-[#166534] font-bold border border-[#BBF7D0]">
                Chuyên sâu
              </span>
            </div>
            <input 
              type="checkbox"
              checked={useAi}
              onChange={(e) => setUseAi(e.target.checked)}
              className="w-4 h-4 rounded accent-[#16A34A] cursor-pointer"
            />
          </label>
        </div>

        {/* Dòng 3: Nút nằm sát bên phải là Tạo tóm tắt màu nền cam ViT chữ trắng. Text viết ngang ra không wrap */}
        <div className="flex justify-end mb-3">
          <button
            onClick={handleGenerateSummary}
            disabled={loading}
            className="px-4 py-2 bg-[#16A34A] hover:bg-[#15803D] active:scale-95 text-white rounded-xl text-xs font-bold whitespace-nowrap shadow-xs transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
          >
            <Sparkles className="w-3.5 h-3.5 text-white stroke-[2.4]" />
            <span>{loading ? 'Đang tóm tắt...' : 'Tạo tóm tắt'}</span>
          </button>
        </div>

        {/* Summary Content Body (Không xuất hiện cuộn trừ khi tràn subpixel) */}
        <div className="flex-1 min-h-[160px] max-h-[220px] flex flex-col">
          {summaryResult ? (
            <div className="flex-1 bg-slate-50 border border-slate-200 rounded-xl p-3.5 text-xs leading-relaxed text-slate-800 whitespace-pre-line overflow-y-auto no-scrollbar">
              {summaryResult}
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-slate-400 text-xs text-center border-2 border-dashed border-slate-200 rounded-xl p-4">
              <Sparkles className="w-6 h-6 mb-1.5 text-slate-300 stroke-[2.4]" />
              <span>Nhấn "Tạo tóm tắt" để trích xuất các ý cốt lõi của tài liệu</span>
            </div>
          )}
        </div>

        {/* Footer thu hẹp độ rộng vừa khít 1 dòng ngắn gọn */}
        {summaryResult && (
          <div className="pt-2.5 border-t border-slate-100 flex items-center justify-between gap-2 mt-3">
            <button
              onClick={handlePinSummaryToDesk}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-bold transition-colors border border-slate-200 cursor-pointer whitespace-nowrap"
            >
              <StickyNote className="w-3.5 h-3.5 text-amber-600 stroke-[2.4]" />
              <span>Ghim Tóm Tắt Lên Bàn</span>
            </button>

            <button
              onClick={handleCopyToClipboard}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 hover:bg-black text-white rounded-xl text-xs font-bold transition-colors shadow-xs cursor-pointer whitespace-nowrap"
            >
              {copied ? <Check className="w-3.5 h-3.5 stroke-[2.4]" /> : <Copy className="w-3.5 h-3.5 stroke-[2.4]" />}
              <span>{copied ? 'Đã sao chép' : 'Sao chép nội dung'}</span>
            </button>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col p-6 overflow-y-auto no-scrollbar font-sans text-slate-900 bg-white">
      {/* Controls Bar */}
      <div className="flex items-center justify-between pb-4 border-b border-slate-200">
        <div>
          <h4 className="text-sm font-bold text-slate-900">Tóm Tắt Văn Bản Trọng Tâm</h4>
          <p className="text-xs text-slate-500">
            {useAi 
              ? 'Mô hình AI OpenAI chắt lọc các luận điểm logic (kết nối trực tiếp BYOK)'
              : 'Động cơ Non-AI TextRank phân tích tần suất câu (Miễn phí 100%)'}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 px-3 py-1.5 rounded-full transition-colors border border-slate-300">
            <input 
              type="checkbox"
              checked={useAi}
              onChange={(e) => setUseAi(e.target.checked)}
              className="rounded accent-slate-900"
            />
            <span>Dùng AI Chuyên Sâu</span>
          </label>

          <button
            onClick={handleGenerateSummary}
            disabled={loading}
            className="px-4 py-1.5 bg-slate-900 hover:bg-black text-white rounded-lg text-xs font-bold shadow-xs transition-colors flex items-center gap-1.5 disabled:opacity-50"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>{loading ? 'Đang trích xuất...' : 'Tạo Tóm Tắt'}</span>
          </button>
        </div>
      </div>

      {/* Summary Content Body */}
      <div className="flex-1 mt-4">
        {summaryResult ? (
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 text-sm leading-relaxed text-slate-800 whitespace-pre-line">
            {summaryResult}
          </div>
        ) : (
          <div className="h-64 flex flex-col items-center justify-center text-slate-400 text-xs text-center border-2 border-dashed border-slate-200 rounded-xl">
            <Sparkles className="w-8 h-8 mb-2 text-slate-300" />
            <span>Nhấn "Tạo Tóm Tắt" để bắt đầu trích xuất các ý chính của tài liệu</span>
          </div>
        )}
      </div>

      {/* Action Footer */}
      {summaryResult && (
        <div className="pt-4 border-t border-slate-200 flex items-center justify-between mt-4">
          <button
            onClick={handlePinSummaryToDesk}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg text-xs font-semibold transition-colors border border-slate-300"
          >
            <StickyNote className="w-3.5 h-3.5 text-amber-600" />
            <span>Ghim Tóm Tắt Thành Note Lên Bàn</span>
          </button>

          <button
            onClick={handleCopyToClipboard}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 hover:bg-black text-white rounded-lg text-xs font-semibold transition-colors shadow-xs"
          >
            {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? 'Đã sao chép' : 'Sao chép nội dung'}</span>
          </button>
        </div>
      )}
    </div>
  );
}
