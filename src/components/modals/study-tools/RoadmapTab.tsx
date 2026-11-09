'use client';

import React, { useState } from 'react';
import { extractOutlineAndRoadmap, RoadmapStep } from '@/lib/nonAiEngine';
import { useStudySpace } from '@/context/StudySpaceContext';
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

  const handleGenerateRoadmap = () => {
    if (!pages || pages.length === 0) return;
    const steps = extractOutlineAndRoadmap(pages);
    setRoadmap(steps);
  };

  const totalReadingMinutes = roadmap.reduce((acc, cur) => acc + (cur.estimatedMinutes || 2), 0);

  return (
    <div className="flex-1 flex flex-col p-6 overflow-y-auto no-scrollbar font-sans text-slate-900 bg-white">
      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b border-slate-200">
        <div>
          <h4 className="text-sm font-bold text-slate-900">Lộ Trình Học & Cây Mục Lục</h4>
          <p className="text-xs text-slate-500">
            Tự động chia nhỏ nội dung theo chương/mục và ước lượng thời gian học (200 từ/phút).
          </p>
        </div>

        <button
          onClick={handleGenerateRoadmap}
          className="px-4 py-1.5 bg-slate-900 hover:bg-black text-white rounded-lg text-xs font-bold transition-colors shadow-xs"
        >
          {roadmap.length > 0 ? 'Cập Nhật Lộ Trình' : 'Dựng Lộ Trình'}
        </button>
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
                    <div className="w-7 h-7 rounded-full bg-slate-900 text-white flex items-center justify-center text-xs font-bold font-mono">
                      {idx + 1}
                    </div>
                    <div>
                      <h5 className="text-xs font-bold text-slate-900">{step.title}</h5>
                      <p className="text-[11px] text-slate-500 line-clamp-1">{step.description}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 flex-shrink-0">
                    <span className="text-[11px] text-slate-500 font-mono">
                      ~{step.estimatedMinutes} phút
                    </span>

                    {itemType === 'book' && (
                      <button
                        title="Mở đến trang này"
                        onClick={() => {
                          if (step.pageIndex !== undefined) {
                            setBookPage(itemId, step.pageIndex);
                          }
                        }}
                        className="p-1 hover:bg-slate-200 rounded-lg text-slate-700 transition-colors"
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
            <span>Nhấn "Dựng Lộ Trình" để hệ thống tính toán thời lượng và các chặng học tối ưu</span>
          </div>
        )}
      </div>
    </div>
  );
}
