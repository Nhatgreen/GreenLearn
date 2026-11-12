'use client';

import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { DeskItem } from '@/types/studyspace';
import { useStudySpace } from '@/context/StudySpaceContext';
import { askAi } from '@/lib/aiClient';
import { 
  Sparkles, 
  Send, 
  Paperclip, 
  Check, 
  Pin, 
  X, 
  Link2
} from 'lucide-react';

interface IntelineModalProps {
  sourceItem: DeskItem;
  pageNumber: number;
  selectedText: string;
  isOpen: boolean;
  onClose: () => void;
}

export function IntelineModal({
  sourceItem,
  pageNumber,
  selectedText,
  isOpen,
  onClose
}: IntelineModalProps) {
  const { activeSpace, addIntelineThread } = useStudySpace();

  const [question, setQuestion] = useState('');
  const [attachedDocIds, setAttachedDocIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [answer, setAnswer] = useState<string | null>(null);
  const [isPinned, setIsPinned] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!isOpen || !mounted) return null;

  const quickPrompts = [
    'Giải thích đoạn này một cách ngắn gọn, dễ hiểu',
    'Cho một ví dụ thực tế liên quan',
    'Tạo 1 câu hỏi trắc nghiệm kiểm tra hiểu bài'
  ];

  const handleAskInteline = async (customQ?: string) => {
    const q = customQ || question;
    if (!q.trim()) return;

    setLoading(true);
    setAnswer(null);

    try {
      const attachedDocs = activeSpace.items.filter(i => attachedDocIds.includes(i.id));
      const contextContent = attachedDocs.map(d => `--- TÀI LIỆU KÈM THEO: ${d.title} ---\n${d.pages[0]?.text || ''}`).join('\n\n');

      const data = await askAi({
        prompt: `Bạn là trợ lý học tập GreenLearn. Hãy giải thích hoặc trả lời câu hỏi của người học dựa trên đoạn trích dẫn sau:
TÀI LIỆU NGUỒN: "${sourceItem.title}" (Trang ${pageNumber})
ĐOẠN TRÍCH DẪN: "${selectedText}"
${contextContent ? `TÀI LIỆU ĐỐI CHIẾU:\n${contextContent}` : ''}

CÂU HỎI: "${q}"

Yêu cầu: Trả lời tự nhiên, chính xác, súc tích và dễ hiểu.`,
      });

      if (data.reply) {
        setAnswer(data.reply);
      } else {
        setAnswer('Chưa nhận được phản hồi. Bạn hãy thử lại sau giây lát.');
      }
    } catch (err: any) {
      setAnswer(err.message || 'Lỗi kết nối khi gửi câu hỏi. Vui lòng kiểm tra lại mạng hoặc khóa API.');
    } finally {
      setLoading(false);
    }
  };

  const handlePinToDesk = () => {
    if (!answer) return;
    addIntelineThread({
      sourceItemId: sourceItem.id,
      sourcePageNumber: pageNumber,
      selectedText,
      question: question || 'Hỏi nhanh Inteline',
      answer
    });
    setIsPinned(true);
  };

  const otherDocs = activeSpace.items.filter(i => i.id !== sourceItem.id);

  const toggleAttachment = (id: string) => {
    setAttachedDocIds(prev => 
      prev.includes(id) ? prev.filter(d => d !== id) : [...prev, id]
    );
  };

  return createPortal(
    <div className="fixed inset-0 z-[9990] bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white border border-slate-300 rounded-2xl w-full max-w-xl p-6 shadow-2xl flex flex-col max-h-[85dvh] text-slate-900 animate-fade-in">
        {/* Top Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-200 mb-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-md bg-slate-900 flex items-center justify-center text-white font-bold shadow-xs">
              <Sparkles className="w-3.5 h-3.5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <span>Inteline</span>
                <span className="text-[11px] font-medium text-slate-500 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                  {sourceItem.title} (Trang {pageNumber})
                </span>
              </h3>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-800 p-1 rounded-lg transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Selected Quote Card */}
        <div className="bg-slate-50 border-l-4 border-slate-800 rounded-r-xl p-3 mb-4 text-xs font-sans leading-relaxed text-slate-800 italic shadow-inner max-h-24 overflow-y-auto">
          "{selectedText}"
        </div>

        {/* Cross-Document Attachment Bar */}
        {otherDocs.length > 0 && (
          <div className="mb-4">
            <div className="text-[11px] font-medium text-slate-600 mb-1.5 flex items-center gap-1">
              <Paperclip className="w-3 h-3 text-slate-600" />
              <span>Đính kèm thêm tài liệu để đối chiếu:</span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {otherDocs.map(doc => {
                const isAttached = attachedDocIds.includes(doc.id);
                return (
                  <button
                    key={doc.id}
                    onClick={() => toggleAttachment(doc.id)}
                    className={`text-[11px] px-2.5 py-1 rounded-lg border flex items-center gap-1.5 transition-all ${
                      isAttached
                        ? 'bg-slate-900 text-white border-slate-900 font-medium'
                        : 'bg-white border-slate-300 text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    {isAttached ? <Check className="w-3 h-3" /> : <Paperclip className="w-3 h-3" />}
                    <span className="truncate max-w-[150px]">{doc.title}</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Quick Questions Chips */}
        {!answer && (
          <div className="mb-3 space-y-1">
            <div className="text-[10px] text-slate-400 font-mono">GỢI Ý CÂU HỎI:</div>
            <div className="flex flex-wrap gap-1.5">
              {quickPrompts.map((p, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    setQuestion(p);
                    handleAskInteline(p);
                  }}
                  className="text-xs bg-slate-50 hover:bg-slate-100 text-slate-700 hover:text-slate-900 px-2.5 py-1 rounded-lg border border-slate-200 transition-colors text-left"
                >
                  {p}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* AI Answer Display */}
        {answer && (
          <div className="flex-1 bg-slate-50 border border-slate-200 rounded-xl p-4 mb-4 overflow-y-auto max-h-60 text-xs leading-relaxed text-slate-900 font-sans whitespace-pre-line relative">
            <div className="text-[10px] font-mono text-slate-500 font-bold mb-1.5 flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-slate-700" />
              <span>PHẢN HỒI TỪ INTELINE:</span>
            </div>
            {answer}
          </div>
        )}

        {/* Input Question Form */}
        <div className="mt-auto">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleAskInteline();
            }}
            className="flex items-center gap-2"
          >
            <input
              type="text"
              placeholder="Đặt câu hỏi về đoạn văn bản này..."
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              className="flex-1 bg-white border border-slate-300 rounded-xl px-4 py-2 text-xs text-slate-900 outline-none focus:border-slate-800 placeholder-slate-400 font-sans"
            />
            <button
              type="submit"
              disabled={loading || !question.trim()}
              className="p-2.5 bg-slate-900 hover:bg-black text-white font-bold rounded-xl disabled:opacity-40 transition-colors flex items-center justify-center flex-shrink-0"
            >
              {loading ? (
                <div className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
            </button>
          </form>

          {/* Footer Action: Pin to Desk */}
          {answer && (
            <div className="flex items-center justify-between pt-3 mt-3 border-t border-slate-200">
              <span className="text-[11px] text-slate-500 flex items-center gap-1">
                <Link2 className="w-3.5 h-3.5 text-slate-600" />
                <span>Nối dây chỉ thị giác ra bàn học</span>
              </span>
              <button
                onClick={handlePinToDesk}
                disabled={isPinned}
                className="px-3.5 py-1.5 bg-slate-900 hover:bg-black text-white font-semibold rounded-xl text-xs flex items-center gap-1.5 transition-colors shadow-xs"
              >
                <Pin className="w-3.5 h-3.5" />
                <span>{isPinned ? 'Đã ghim ra bàn' : 'Ghim thành ghi chú ra bàn'}</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
}
