'use client';

import React, { useState } from 'react';
import { extractOutlineAndRoadmap, RoadmapStep } from '@/lib/nonAiEngine';
import { useStudySpace } from '@/context/StudySpaceContext';
import { askAi } from '@/lib/aiClient';
import { MathRenderer } from '@/components/common/MathRenderer';
import { 
  ListOrdered, 
  Clock, 
  ChevronRight, 
  CheckCircle,
  ExternalLink
} from 'lucide-react';

interface RoadmapTabProps {
  pages: { title?: string; text: string }[];
  itemType: string;
  itemId: string;
  onJumpToPage?: (pageIdx: number) => void;
}

export function RoadmapTab({ pages, itemType, itemId, onJumpToPage }: RoadmapTabProps) {
  const { setBookPage } = useStudySpace();

  const [roadmap, setRoadmap] = useState<RoadmapStep[]>([]);
  const [useAi, setUseAi] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleGenerateRoadmap = async () => {
    if (!pages || pages.length === 0) return;

    if (!useAi) {
      const steps = extractOutlineAndRoadmap(pages);
      setRoadmap(steps);
      return;
    }

    setLoading(true);
    try {
      const fullContext = pages.map((p, idx) => `[Trang ${idx + 1}: ${p.title || 'Mục ' + (idx + 1)}]\n${p.text.slice(0, 500)}`).join('\n\n');
      const prompt = `Từ cấu trúc và nội dung các trang tài liệu sau đây, hãy xây dựng một lộ trình học tập cá nhân hóa (4 đến 6 chặng) giúp người học nắm vững kiến thức từ cơ bản đến chuyên sâu.
Mỗi chặng gồm:
- "title": Tên chặng học súc tích và hành động cụ thể (ví dụ: "Chặng 1: Nền tảng khái niệm ...")
- "description": Mục tiêu cốt lõi cần đạt và cách ôn tập
- "estimatedMinutes": Thời gian hoàn thành dự kiến (số nguyên phút)
- "pageIndex": Số thứ tự trang bắt đầu tương ứng (0-indexed)
Trả về dạng JSON array hợp lệ, KHÔNG thêm bất kỳ văn bản nào khác ngoài JSON:
[
  {
    "title": "Chặng 1: ...",
    "description": "...",
    "estimatedMinutes": 20,
    "pageIndex": 0
  }
]`;

      const data = await askAi({
        prompt,
        context: fullContext.slice(0, 4000),
      });

      const rawText = data.reply || '';
      const match = rawText.match(/\[[\s\S]*\]/);
      if (match) {
        const parsed = JSON.parse(match[0]);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setRoadmap(parsed.map((item: any, idx: number) => ({
            id: `ai-rm-${idx}-${Date.now()}`,
            stepNumber: idx + 1,
            title: item.title || `Chặng ${idx + 1}`,
            description: item.description || '',
            estimatedMinutes: typeof item.estimatedMinutes === 'number' ? item.estimatedMinutes : 15,
            pageIndex: typeof item.pageIndex === 'number' ? item.pageIndex : idx,
            isCompleted: false,
          })));
          return;
        }
      }
      setRoadmap(extractOutlineAndRoadmap(pages));
    } catch {
      setRoadmap(extractOutlineAndRoadmap(pages));
    } finally {
      setLoading(false);
    }
  };

  const totalReadingMinutes = roadmap.reduce((acc, cur) => acc + (cur.estimatedMinutes || 2), 0);

  return (
    <div className="flex-1 flex flex-col p-6 overflow-y-auto no-scrollbar font-sans text-slate-900 bg-white">
      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b border-slate-200">
        <div>
          <h4 className="text-sm font-bold text-slate-900">Lộ trình học & cây mục lục</h4>
          <p className="text-xs text-slate-500">
            {useAi 
              ? 'Mô hình AI xây dựng lộ trình từng chặng mục tiêu cá nhân hóa'
              : 'Động cơ Non-AI chia nhỏ nội dung theo chương/mục và ước lượng thời gian học (chạy 100% offline)'}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 px-3 py-1.5 rounded-full transition-colors border border-slate-300 select-none">
            <input 
              type="checkbox"
              checked={useAi}
              onChange={(e) => setUseAi(e.target.checked)}
              className="rounded accent-[#16A34A]"
            />
            <span>Dùng AI chuyên sâu</span>
          </label>

          <button
            onClick={handleGenerateRoadmap}
            disabled={loading}
            className="px-4 py-1.5 bg-[#16A34A] hover:bg-[#15803D] text-white rounded-lg text-xs font-bold transition-colors shadow-xs flex items-center justify-center disabled:opacity-50 cursor-pointer active:scale-95"
          >
            <span>{loading ? 'Đang dựng...' : roadmap.length > 0 ? 'Cập nhật lộ trình' : 'Dựng lộ trình'}</span>
          </button>
        </div>
      </div>

      {/* Roadmap Content */}
      <div className="flex-1 mt-4">
        {roadmap.length > 0 ? (
          <div>
            {/* Total Stat Badge */}
            <div className="flex items-center gap-2 mb-4 bg-slate-100 p-3 rounded-xl border border-slate-200 text-xs text-slate-700">
              <Clock className="w-4 h-4 text-slate-900" />
              <span>Tổng thời gian học ước tính: <strong>{totalReadingMinutes} phút</strong> ({roadmap.length} chặng học)</span>
            </div>

            <div className="space-y-3">
              {roadmap.map((step, idx) => (
                <div 
                  key={step.id || idx}
                  className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex items-center justify-between hover:border-slate-300 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-7 h-7 rounded-full bg-slate-900 text-white flex items-center justify-center text-xs font-bold font-mono shrink-0">
                      {idx + 1}
                    </div>
                    <div>
                      <h5 className="text-xs font-bold text-slate-900">
                        <MathRenderer content={step.title} />
                      </h5>
                      <div className="text-[11px] text-slate-500 line-clamp-2 mt-0.5">
                        <MathRenderer content={step.description} />
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 flex-shrink-0 ml-2">
                    <span className="text-[11px] text-slate-500 font-mono">
                      ~{step.estimatedMinutes} phút
                    </span>

                    {itemType === 'book' && typeof step.pageIndex === 'number' && (
                      <button
                        title={`Lật đến trang ${step.pageIndex + 1}`}
                        onClick={() => {
                          if (onJumpToPage) {
                            onJumpToPage(step.pageIndex);
                          } else {
                            setBookPage(itemId, step.pageIndex);
                          }
                        }}
                        className="p-1 hover:bg-slate-200 rounded-lg text-slate-700 transition-colors cursor-pointer"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="h-64 flex flex-col items-center justify-center text-slate-400 text-xs text-center border-2 border-dashed border-slate-200 rounded-xl">
            <ListOrdered className="w-8 h-8 mb-2 text-slate-300" />
            <span>Nhấn "Dựng lộ trình" để tạo cây mục lục và kế hoạch ôn tập</span>
          </div>
        )}
      </div>
    </div>
  );
}
