'use client';

import React, { useState } from 'react';
import { useStudySpace } from '@/context/StudySpaceContext';
import { useViToken } from '@/context/ViTokenContext';
import { 
  BookOpen, 
  FileText, 
  Coins, 
  ChevronRight, 
  ArrowLeft
} from 'lucide-react';

export function MobileCompanionView() {
  const { activeSpace } = useStudySpace();
  const { wallet } = useViToken();

  const [selectedDocId, setSelectedDocId] = useState<string | null>(null);

  const selectedDoc = activeSpace.items.find(i => i.id === selectedDocId);

  return (
    <div className="w-full min-h-screen bg-slate-50 text-slate-800 flex flex-col md:hidden pb-16 font-sans">
      {/* Top Mobile Bar */}
      <header className="p-4 bg-white border-b border-slate-200 flex items-center justify-between sticky top-0 z-30 shadow-xs">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-slate-900 text-white flex items-center justify-center font-bold text-xs">
            V
          </div>
          <div>
            <h1 className="text-sm font-bold text-slate-900 leading-tight">ViTudy Đồng Hành</h1>
            <p className="text-[11px] text-slate-500 font-medium">{activeSpace.name}</p>
          </div>
        </div>

        {/* ViToken Badge */}
        <div className="flex items-center gap-1.5 bg-slate-100 border border-slate-300 px-2.5 py-1 rounded-full text-slate-800 text-xs font-mono font-bold">
          <Coins className="w-3.5 h-3.5 text-slate-700" />
          <span>{wallet.balance} V</span>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 p-4">
        {selectedDoc ? (
          /* Document Reader View on Mobile */
          <div className="space-y-4">
            <button
              onClick={() => setSelectedDocId(null)}
              className="flex items-center gap-1.5 text-xs text-slate-600 hover:text-slate-900 font-medium mb-2 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Quay lại danh sách tài liệu</span>
            </button>

            <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-xs">
              <div className="flex items-center gap-2 mb-2">
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                  selectedDoc.type === 'book' ? 'bg-slate-100 text-slate-700 border border-slate-200' : 'bg-slate-100 text-slate-700 border border-slate-200'
                }`}>
                  {selectedDoc.type === 'book' ? 'SÁCH' : 'TỜ GIẤY'}
                </span>
                <span className="text-xs text-slate-500">{selectedDoc.pageCount} trang</span>
              </div>
              <h2 className="text-base font-bold text-slate-900 mb-4">
                {selectedDoc.title}
              </h2>

              {/* Pages List */}
              <div className="space-y-4">
                {selectedDoc.pages.map((p, idx) => (
                  <div key={p.id || idx} className="bg-slate-50/70 rounded-lg p-4 border border-slate-200">
                    <div className="text-[11px] font-mono font-semibold text-slate-500 mb-1.5">
                      Trang {p.pageNumber} {p.title ? `— ${p.title}` : ''}
                    </div>
                    <p className="text-xs text-slate-700 leading-relaxed whitespace-pre-line font-sans">
                      {p.text}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : (
          /* Documents List on Mobile */
          <div>
            <div className="mb-4">
              <h2 className="text-base font-bold text-slate-900">Tài Liệu Đang Mở</h2>
              <p className="text-xs text-slate-500">
                Chế độ đọc tập trung & ôn luyện đồng bộ từ StudySpace trên máy tính.
              </p>
            </div>

            <div className="space-y-3">
              {activeSpace.items.map(item => (
                <div
                  key={item.id}
                  onClick={() => setSelectedDocId(item.id)}
                  className="bg-white border border-slate-200 hover:border-slate-300 rounded-xl p-3.5 flex items-center justify-between active:bg-slate-50 cursor-pointer shadow-2xs transition-all"
                >
                  <div className="flex items-center gap-3 overflow-hidden">
                    <div className="w-9 h-9 rounded-lg bg-slate-100 border border-slate-200 flex items-center justify-center flex-shrink-0 text-slate-700">
                      {item.type === 'book' ? <BookOpen className="w-5 h-5" /> : <FileText className="w-5 h-5" />}
                    </div>
                    <div className="truncate">
                      <h3 className="text-xs font-bold text-slate-900 truncate">{item.title}</h3>
                      <p className="text-[11px] text-slate-500">
                        {item.type === 'book' ? `${item.pageCount} trang (Sách)` : `${item.pageCount} trang (Tờ giấy)`}
                      </p>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-400" />
                </div>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
