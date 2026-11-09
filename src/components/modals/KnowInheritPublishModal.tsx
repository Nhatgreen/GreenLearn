'use client';

import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { DeskItem } from '@/types/studyspace';
import { useViToken } from '@/context/ViTokenContext';
import { useAuth } from '@/context/AuthContext';
import { 
  Store, 
  ShieldCheck, 
  Sparkles, 
  CheckCircle2, 
  UploadCloud, 
  X,
  BookOpen,
  FileText,
  HelpCircle,
  ExternalLink
} from 'lucide-react';

interface KnowInheritPublishModalProps {
  item: DeskItem;
  isOpen: boolean;
  onClose: () => void;
  onPublished?: (listing: any) => void;
}

const SUBJECT_OPTIONS = [
  'Toán học & Giải tích',
  'AI / Machine Learning',
  'Lập trình & CNTT',
  'Khoa học & Kỹ thuật',
  'Ngoại ngữ & IELTS',
  'Kinh tế & Quản trị',
  'Khác'
];

export function KnowInheritPublishModal({
  item,
  isOpen,
  onClose,
  onPublished
}: KnowInheritPublishModalProps) {
  const { addTokens } = useViToken();
  const { user, profile } = useAuth();

  const defaultAuthor = profile?.display_name || user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'Thành Nam';
  const initialType: 'book' | 'paper' | 'exam' = item.isExamSheet ? 'exam' : item.type === 'book' ? 'book' : 'paper';

  const [authorName, setAuthorName] = useState(defaultAuthor);
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [docType, setDocType] = useState<'book' | 'paper' | 'exam'>(initialType);
  const [subject, setSubject] = useState<string>('Toán học & Giải tích');
  const [description, setDescription] = useState('');
  const [previewExcerpt, setPreviewExcerpt] = useState(item.pages[0]?.text?.slice(0, 220) || '');
  const [hasCopyrightConsent, setHasCopyrightConsent] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const [isAuditing, setIsAuditing] = useState(false);
  const [auditResult, setAuditResult] = useState<{
    score: number;
    price: number;
    authorEarn: number;
    approved: boolean;
    reason: string;
  } | null>(null);

  useEffect(() => {
    if (defaultAuthor && authorName === 'Bạn (Người chia sẻ)') {
      setAuthorName(defaultAuthor);
    }
  }, [defaultAuthor]);

  if (!isOpen || !mounted) return null;

  const handleToggleAnonymous = (checked: boolean) => {
    setIsAnonymous(checked);
    if (checked) {
      setAuthorName('Tác giả ẩn danh');
    } else {
      setAuthorName(defaultAuthor);
    }
  };

  const handleStartAudit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!hasCopyrightConsent) return;

    setIsAuditing(true);
    setAuditResult(null);

    await new Promise(resolve => setTimeout(resolve, 1100));

    const totalWords = item.pages.reduce((acc, p) => acc + (p.text || '').split(/\s+/).length, 0);
    const calculatedScore = Math.min(98, Math.max(72, Math.floor(70 + (item.pageCount * 3) + (totalWords / 250))));
    
    // Set fixed standard price based on document type
    let price = 50;
    if (docType === 'paper') price = 15;
    else if (docType === 'exam') price = 30;
    else price = 50;

    const authorEarn = Math.round(price * 0.85 * 10) / 10;

    setAuditResult({
      score: calculatedScore,
      price,
      authorEarn,
      approved: true,
      reason: `Tài liệu đạt tiêu chuẩn chất lượng (${calculatedScore}/100) và độ nguyên bản cao, sẵn sàng niêm yết.`
    });
    setIsAuditing(false);
  };

  const handleConfirmPublish = () => {
    if (!auditResult) return;
    
    const newListing = {
      id: `mkt-${Date.now()}`,
      title: item.title,
      author: authorName,
      type: docType,
      subject,
      aiScore: auditResult.score,
      price: auditResult.price,
      authorEarn: auditResult.authorEarn,
      purchased: true,
      summary: description || `Bộ tài liệu ${item.title} gồm ${item.pageCount} trang, thuộc môn ${subject}.`,
      previewText: previewExcerpt || item.pages[0]?.text?.slice(0, 300) || 'Xem trước tài liệu...'
    };

    onPublished?.(newListing);
    onClose();
  };

  return createPortal(
    <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-[9999] flex items-center justify-center p-4">
      <div className="bg-white border border-slate-300 rounded-3xl w-full max-w-lg p-6 shadow-2xl relative text-slate-900 animate-fade-in font-sans max-h-[90vh] flex flex-col">
        {/* Close Button */}
        <button
          onClick={onClose}
          aria-label="Đóng"
          className="absolute top-4 right-4 w-9 h-9 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-800 hover:bg-slate-100 transition-colors cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Header */}
        <div className="flex items-center gap-2.5 mb-1 flex-shrink-0">
          <div className="w-9 h-9 rounded-xl bg-[#F0FDF4] border border-green-200 flex items-center justify-center text-[#16A34A]">
            <Store className="w-5 h-5 stroke-[2.2]" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900 leading-tight">Chia sẻ lên Chợ tài liệu</h3>
            <p className="text-xs text-slate-500">
              Chia sẻ tài liệu học tập cho cộng đồng sinh viên. Bạn nhận 85% ViToken cho mỗi lượt mở khóa.
            </p>
          </div>
        </div>

        {/* 85% Concrete Example Pill */}
        <div className="bg-green-50/70 border border-green-200/80 rounded-xl p-2.5 my-2.5 text-xs text-slate-700 flex-shrink-0 leading-relaxed">
          <strong className="text-[#16A34A]">Chính sách chia sẻ 85/15:</strong> Bạn nhận 85% giá bán (Ví dụ: giá 50 ViToken, bạn nhận <strong>42,5 ViToken</strong> mỗi lượt mở khóa). ViToken tích lũy dùng để mở khóa tài liệu khác hoặc hỏi đáp AI.
        </div>

        <div className="overflow-y-auto pr-1 flex-1">
          {!auditResult ? (
            <form onSubmit={handleStartAudit} className="space-y-3.5 pt-1">
              {/* Document Overview Pill */}
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 text-xs flex items-center justify-between">
                <div>
                  <span className="text-slate-500">Tài liệu: </span>
                  <strong className="text-slate-900">{item.title}</strong>
                  <div className="text-[11px] text-slate-500 mt-0.5 font-mono">
                    {item.pageCount} trang • Định dạng {item.type === 'book' ? 'Sách' : 'Tờ giấy'}
                  </div>
                </div>
                <div className="px-2 py-1 bg-white border border-slate-200 rounded-lg text-[11px] font-bold text-slate-700">
                  {item.pageCount} trang
                </div>
              </div>

              {/* 1. Loại tài liệu (Sách, Tờ tóm tắt, Đề thi) */}
              <div>
                <label className="text-xs font-bold text-slate-800 block mb-1.5">
                  1. Loại tài liệu niêm yết
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'book' as const, label: 'Sách', price: '50 V', icon: <BookOpen className="w-3.5 h-3.5" /> },
                    { id: 'paper' as const, label: 'Tờ tóm tắt', price: '15 V', icon: <FileText className="w-3.5 h-3.5" /> },
                    { id: 'exam' as const, label: 'Đề thi', price: '30 V', icon: <HelpCircle className="w-3.5 h-3.5" /> },
                  ].map(t => (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => setDocType(t.id)}
                      className={`p-2 rounded-xl border text-xs flex flex-col items-center justify-center gap-1 transition-all cursor-pointer ${
                        docType === t.id
                          ? 'border-[#16A34A] bg-[#F0FDF4] text-[#16A34A] font-bold ring-1 ring-[#16A34A]'
                          : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      <div className="flex items-center gap-1">
                        {t.icon}
                        <span>{t.label}</span>
                      </div>
                      <span className="text-[10px] font-mono text-slate-500 font-semibold">{t.price}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* 2. Môn học */}
              <div>
                <label htmlFor="publish-subject-select" className="text-xs font-bold text-slate-800 block mb-1.5">
                  2. Môn học / Lĩnh vực
                </label>
                <select
                  id="publish-subject-select"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 outline-none focus:border-slate-800 cursor-pointer shadow-2xs"
                >
                  {SUBJECT_OPTIONS.map(s => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>

              {/* 3. Tác giả & Tùy chọn Ẩn danh */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label htmlFor="publish-author-input" className="text-xs font-bold text-slate-800">
                    3. Tên tác giả / Bút danh
                  </label>
                  <label className="flex items-center gap-1.5 text-[11px] text-slate-600 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={isAnonymous}
                      onChange={(e) => handleToggleAnonymous(e.target.checked)}
                      className="accent-[#16A34A] rounded cursor-pointer"
                    />
                    <span>Dùng bút danh ẩn danh</span>
                  </label>
                </div>
                <input
                  id="publish-author-input"
                  type="text"
                  required
                  value={authorName}
                  onChange={(e) => setAuthorName(e.target.value)}
                  placeholder="Nhập tên hiển thị của bạn..."
                  className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 outline-none focus:border-slate-800 shadow-2xs"
                />
              </div>

              {/* 4. Mô tả tài liệu & Bộ đếm ký tự */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label htmlFor="publish-desc-input" className="text-xs font-bold text-slate-800">
                    4. Mô tả tóm tắt tài liệu
                  </label>
                  <span className={`text-[10px] font-mono ${description.length < 20 ? 'text-amber-600' : 'text-slate-400'}`}>
                    {description.length}/300 ký tự {description.length < 20 && '(khuyến khích ≥ 20)'}
                  </span>
                </div>
                <textarea
                  id="publish-desc-input"
                  rows={2}
                  maxLength={300}
                  placeholder="Ghi chú nội dung trọng tâm để người học khóa sau dễ hình dung..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-xl p-2.5 text-xs text-slate-900 outline-none focus:border-slate-800 font-sans leading-relaxed resize-none shadow-2xs"
                />
              </div>

              {/* 5. Đoạn trích xem trước */}
              <div>
                <label htmlFor="publish-preview-input" className="text-xs font-bold text-slate-800 block mb-1">
                  5. Đoạn trích xem trước (Hiển thị cho người mua đọc thử)
                </label>
                <textarea
                  id="publish-preview-input"
                  rows={2}
                  maxLength={300}
                  value={previewExcerpt}
                  onChange={(e) => setPreviewExcerpt(e.target.value)}
                  placeholder="Trích dẫn một đoạn tiêu biểu của trang đầu tiên..."
                  className="w-full bg-white border border-slate-300 rounded-xl p-2.5 text-xs text-slate-900 outline-none focus:border-slate-800 font-sans leading-relaxed resize-none shadow-2xs"
                />
              </div>

              {/* Giải thích thẩm định chất lượng thay cho C/B/A/S */}
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-600 flex items-start gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                <span>
                  Hệ thống sẽ thẩm định chất lượng và đề xuất mức giá từ 15 đến 50 ViToken dựa trên độ dài, tính học thuật và độ nguyên bản.
                </span>
              </div>

              {/* Cam kết bản quyền (Bắt buộc) */}
              <label className="flex items-start gap-2 p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 cursor-pointer select-none">
                <input
                  type="checkbox"
                  required
                  checked={hasCopyrightConsent}
                  onChange={(e) => setHasCopyrightConsent(e.target.checked)}
                  className="w-4 h-4 accent-[#16A34A] rounded cursor-pointer mt-0.5 flex-shrink-0"
                />
                <span className="leading-snug">
                  Tôi xác nhận có quyền chia sẻ tài liệu này, không vi phạm bản quyền và cam kết tuân thủ{' '}
                  <a href="/terms" target="_blank" rel="noreferrer" className="text-[#16A34A] underline font-semibold inline-flex items-center gap-0.5">
                    Điều khoản chia sẻ tri thức
                    <ExternalLink className="w-2.5 h-2.5" />
                  </a>{' '}
                  của ViTudy.
                </span>
              </label>

              {/* Actions */}
              <div className="flex justify-end gap-2 pt-2 border-t border-slate-200">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={isAuditing || !hasCopyrightConsent}
                  className="px-5 py-2 bg-[#16A34A] hover:bg-[#15803D] disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold rounded-xl text-xs flex items-center gap-1.5 shadow-xs transition-all active:scale-95 cursor-pointer"
                >
                  <UploadCloud className="w-4 h-4" />
                  <span>{isAuditing ? 'Đang thẩm định...' : 'Kiểm tra & Báo giá'}</span>
                </button>
              </div>
            </form>
          ) : (
            <div className="space-y-4 pt-2">
              <div className="bg-emerald-50/60 border border-emerald-200 rounded-2xl p-4">
                <div className="flex items-center gap-2 text-emerald-900 font-bold text-sm mb-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>Tài liệu đủ điều kiện chia sẻ lên Chợ</span>
                </div>
                <p className="text-xs text-slate-700 mb-3">{auditResult.reason}</p>

                <div className="grid grid-cols-3 gap-2.5 text-xs">
                  <div className="bg-white p-2.5 rounded-xl border border-slate-200 text-center">
                    <div className="text-slate-400 text-[10px] font-semibold">Điểm chất lượng AI</div>
                    <div className="text-base font-bold text-slate-900 font-mono mt-0.5">{auditResult.score}/100</div>
                  </div>
                  <div className="bg-white p-2.5 rounded-xl border border-slate-200 text-center">
                    <div className="text-slate-400 text-[10px] font-semibold">Giá niêm yết</div>
                    <div className="text-base font-bold text-[#16A34A] font-mono mt-0.5">{auditResult.price} ViToken</div>
                  </div>
                  <div className="bg-white p-2.5 rounded-xl border border-emerald-300 text-center bg-emerald-50/30">
                    <div className="text-emerald-700 text-[10px] font-semibold">Bạn nhận (85%)</div>
                    <div className="text-base font-black text-emerald-700 font-mono mt-0.5">+{auditResult.authorEarn} V</div>
                  </div>
                </div>

                <div className="mt-3 text-[11px] text-slate-600 bg-white/80 p-2 rounded-lg border border-slate-100 flex items-center justify-between">
                  <span>Môn: <strong>{subject}</strong></span>
                  <span>Định dạng: <strong>{docType === 'book' ? 'Sách' : docType === 'paper' ? 'Tờ tóm tắt' : 'Đề thi'}</strong></span>
                  <span>Tác giả: <strong>{authorName}</strong></span>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setAuditResult(null)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 cursor-pointer"
                >
                  Quay lại sửa
                </button>
                <button
                  type="button"
                  onClick={handleConfirmPublish}
                  className="px-5 py-2 bg-[#16A34A] hover:bg-[#15803D] text-white font-bold rounded-xl text-xs shadow-xs transition-all active:scale-95 cursor-pointer"
                >
                  Xác nhận đưa lên Chợ
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
}
