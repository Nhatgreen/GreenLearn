'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useRouter } from 'next/navigation';
import { useStudySpace } from '@/context/StudySpaceContext';
import { MarketItem } from '@/data/marketMockData';
import { 
  X, 
  Search, 
  BookOpen, 
  FileText, 
  HelpCircle, 
  Clock, 
  Check, 
  Plus, 
  ArrowRight,
  Layers,
  Sparkles
} from 'lucide-react';
import { formatRelativeTimeVN } from '@/lib/dateVN';

interface SelectSpaceForDocModalProps {
  isOpen: boolean;
  onClose: () => void;
  item: MarketItem | null;
}

export function SelectSpaceForDocModal({ isOpen, onClose, item }: SelectSpaceForDocModalProps) {
  const router = useRouter();
  const { spaces, activeSpaceId, addMarketItemToSpace, createSpace, saveCurrentSpaceImmediately } = useStudySpace();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSpaceId, setSelectedSpaceId] = useState<string>('');
  const [isCreatingNew, setIsCreatingNew] = useState(false);
  const [newSpaceName, setNewSpaceName] = useState('');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Sắp xếp bàn học từ ngày gần nhất trở đi (lastOpenedAt hoặc updatedAt)
  const sortedSpaces = useMemo(() => {
    return [...spaces].sort((a, b) => {
      const timeA = a.lastOpenedAt 
        ? new Date(a.lastOpenedAt).getTime() 
        : (a.updatedAt ? new Date(a.updatedAt).getTime() : 0);
      const timeB = b.lastOpenedAt 
        ? new Date(b.lastOpenedAt).getTime() 
        : (b.updatedAt ? new Date(b.updatedAt).getTime() : 0);
      return timeB - timeA;
    });
  }, [spaces]);

  // Tự động chọn bàn học mở gần nhất hoặc bàn hiện tại
  useEffect(() => {
    if (isOpen) {
      if (activeSpaceId && spaces.some(s => s.id === activeSpaceId)) {
        setSelectedSpaceId(activeSpaceId);
      } else if (sortedSpaces.length > 0) {
        setSelectedSpaceId(sortedSpaces[0].id);
      }
      setIsCreatingNew(false);
      setSearchQuery('');
    }
  }, [isOpen, activeSpaceId, sortedSpaces, spaces]);

  // Lọc theo từ khóa tìm kiếm (tên bàn học, môn học)
  const filteredSpaces = useMemo(() => {
    if (!searchQuery.trim()) return sortedSpaces;
    const q = searchQuery.toLowerCase().trim();
    return sortedSpaces.filter(s => 
      s.name.toLowerCase().includes(q) || 
      s.subject.toLowerCase().includes(q)
    );
  }, [sortedSpaces, searchQuery]);

  // Phím tắt Esc
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !mounted || !item) return null;

  const handleConfirm = async () => {
    let targetSpaceId = selectedSpaceId;

    // Nếu chọn tạo bàn học mới
    if (isCreatingNew) {
      const name = newSpaceName.trim() || `Bàn học: ${item.title.slice(0, 30)}`;
      const subject = item.category === 'math' ? 'Toán học' : 
                      item.category === 'ai_ml' ? 'Trí tuệ nhân tạo' : 
                      item.category === 'cs' ? 'Khoa học máy tính' : 'Học tập';
      
      const newSpaceId = typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `space-${Date.now()}`;
      createSpace(name, subject);
      targetSpaceId = newSpaceId;
    }

    if (!targetSpaceId && spaces.length > 0) {
      targetSpaceId = spaces[0].id;
    }

    if (targetSpaceId) {
      // 1. Thêm tài liệu vào bàn học đích (giữ nguyên những thứ có sẵn trên bàn)
      addMarketItemToSpace(targetSpaceId, item);

      // 2. Lưu trạng thái ngay lập tức
      await saveCurrentSpaceImmediately?.();

      // 3. Đóng modal
      onClose();

      // 4. Điều hướng chuyển view sang bàn học đã chọn kèm tham số space
      router.push(`/?view=desk&space=${encodeURIComponent(targetSpaceId)}`);
    }
  };

  const getDocTypeIcon = () => {
    if (item.type === 'book') return <BookOpen className="w-4 h-4 text-[#16A34A]" />;
    if (item.type === 'exam') return <HelpCircle className="w-4 h-4 text-sky-600" />;
    return <FileText className="w-4 h-4 text-emerald-600" />;
  };

  return createPortal(
    <div 
      className="fixed inset-0 z-[9999] bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 font-sans text-slate-900 select-none animate-fade-in"
      onClick={onClose}
    >
      <div 
        className="bg-white rounded-2xl border border-slate-300 shadow-2xl max-w-lg w-full overflow-hidden flex flex-col max-h-[88vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/70">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-orange-50 border border-orange-200 flex items-center justify-center">
              {getDocTypeIcon()}
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 leading-tight">
                Mở tài liệu trên bàn học
              </h3>
              <p className="text-xs text-slate-500 mt-0.5 line-clamp-1">
                Chọn bàn học của bạn để đặt <strong className="text-slate-800">&ldquo;{item.title}&rdquo;</strong>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-900 hover:bg-slate-200/60 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Search Bar */}
        <div className="p-4 border-b border-slate-100 bg-white">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Tìm kiếm theo tên bàn học hoặc môn học..."
              className="w-full pl-9 pr-8 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-[#16A34A] focus:bg-white transition-all font-medium"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Space List: Sắp xếp theo ngày gần nhất trở đi */}
        <div className="p-4 overflow-y-auto flex-1 space-y-2.5 max-h-[380px]">
          <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider px-1 flex items-center justify-between">
            <span>Danh sách bàn học ({filteredSpaces.length})</span>
            <span className="text-[10px] font-normal lowercase">Gần nhất trước</span>
          </div>

          {filteredSpaces.map((sp) => {
            const isSelected = !isCreatingNew && selectedSpaceId === sp.id;
            const bookCount = sp.items.filter(i => i.type === 'book').length;
            const noteCount = sp.items.filter(i => i.type === 'sticky_note').length;
            const paperCount = sp.items.filter(i => i.type === 'paper').length;

            let summaryText = 'Chưa có tài liệu';
            if (bookCount > 0 || paperCount > 0 || noteCount > 0) {
              const parts = [];
              if (bookCount > 0) parts.push(`${bookCount} sách`);
              if (paperCount > 0) parts.push(`${paperCount} tài liệu`);
              if (noteCount > 0) parts.push(`${noteCount} ghi chú`);
              summaryText = parts.join(' · ');
            }

            const timeDisplay = sp.lastOpenedAt 
              ? formatRelativeTimeVN(sp.lastOpenedAt) 
              : (sp.updatedAt ? formatRelativeTimeVN(sp.updatedAt) : 'Vừa tạo');

            return (
              <div
                key={sp.id}
                onClick={() => {
                  setIsCreatingNew(false);
                  setSelectedSpaceId(sp.id);
                }}
                className={`p-3 rounded-xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                  isSelected
                    ? 'border-[#16A34A] bg-[#F0FDF4]/60 ring-1 ring-[#16A34A]/60 shadow-xs'
                    : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs flex-shrink-0 ${
                    isSelected ? 'bg-[#16A34A] text-white' : 'bg-slate-100 text-slate-600'
                  }`}>
                    {sp.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-slate-900 truncate">
                        {sp.name}
                      </span>
                      {sp.starred && (
                        <span className="text-amber-500 text-xs">★</span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 text-[11px] text-slate-500 mt-0.5">
                      <span className="font-medium text-slate-600">{sp.subject}</span>
                      <span>•</span>
                      <span>{summaryText}</span>
                    </div>
                  </div>
                </div>

                <div className="text-right flex-shrink-0 flex items-center gap-3">
                  <div className="text-[10.5px] text-slate-400 font-mono hidden sm:block">
                    {timeDisplay}
                  </div>
                  <div className={`w-5 h-5 rounded-full border flex items-center justify-center transition-all ${
                    isSelected
                      ? 'border-[#16A34A] bg-[#16A34A] text-white'
                      : 'border-slate-300 bg-white'
                  }`}>
                    {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                  </div>
                </div>
              </div>
            );
          })}

          {filteredSpaces.length === 0 && (
            <div className="py-8 text-center text-xs text-slate-400">
              Không tìm thấy bàn học nào khớp với &ldquo;{searchQuery}&rdquo;
            </div>
          )}

          {/* Option: Tạo bàn học mới */}
          <div
            onClick={() => setIsCreatingNew(true)}
            className={`p-3 rounded-xl border border-dashed transition-all cursor-pointer flex items-center justify-between gap-3 ${
              isCreatingNew
                ? 'border-[#16A34A] bg-[#F0FDF4]/60 ring-1 ring-[#16A34A]/60'
                : 'border-slate-300 hover:border-slate-400 bg-slate-50/50 hover:bg-slate-100/50'
            }`}
          >
            <div className="flex items-center gap-3">
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                isCreatingNew ? 'bg-[#16A34A] text-white' : 'bg-slate-200 text-slate-700'
              }`}>
                <Plus className="w-4 h-4" />
              </div>
              <div>
                <span className="text-xs font-bold text-slate-900">
                  Tạo bàn học mới cho tài liệu này
                </span>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Mở một không gian mới riêng biệt để nghiên cứu tài liệu
                </p>
              </div>
            </div>
            <div className={`w-5 h-5 rounded-full border flex items-center justify-center ${
              isCreatingNew ? 'border-[#16A34A] bg-[#16A34A] text-white' : 'border-slate-300'
            }`}>
              {isCreatingNew && <Check className="w-3 h-3 stroke-[3]" />}
            </div>
          </div>

          {/* Input tên bàn học mới khi chọn tạo mới */}
          {isCreatingNew && (
            <div className="p-3 bg-green-50/40 rounded-xl border border-green-200 space-y-2 animate-fade-in">
              <label className="text-xs font-bold text-slate-800 block">
                Tên bàn học mới:
              </label>
              <input
                type="text"
                value={newSpaceName}
                onChange={(e) => setNewSpaceName(e.target.value)}
                placeholder={`Bàn học: ${item.title}`}
                className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs text-slate-900 focus:outline-none focus:border-[#16A34A]"
                autoFocus
              />
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="px-5 py-3.5 border-t border-slate-200 bg-slate-50 flex items-center justify-between">
          <div className="text-xs text-slate-500">
            Tài liệu sẽ được thêm vào bàn đã chọn
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-200/60 rounded-xl transition-colors cursor-pointer"
            >
              Hủy
            </button>
            <button
              type="button"
              onClick={handleConfirm}
              className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-[#16A34A] hover:bg-[#15803D] rounded-xl shadow-xs transition-all cursor-pointer active:scale-95"
            >
              <span>Mở bàn học</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}
