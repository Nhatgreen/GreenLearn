'use client';

import React, { useState } from 'react';
import { useStudySpace } from '@/context/StudySpaceContext';
import { normalizeNFC } from '@/utils/textNormalization';
import { Camera, Copy, Check, StickyNote, FileText } from 'lucide-react';

interface OcrTabProps {
  documentTitle: string;
}

export function OcrTab({ documentTitle }: OcrTabProps) {
  const { addStickyNote, addUploadedDocument } = useStudySpace();

  const [ocrText, setOcrText] = useState('');
  const [ocrLoading, setOcrLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleOcrFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setOcrLoading(true);
    try {
      // Dynamic import Tesseract.js client-side
      const Tesseract = await import('tesseract.js');
      const result = await Tesseract.recognize(
        file,
        'vie+eng',
        {
          logger: m => console.log(m)
        }
      );

      const cleaned = normalizeNFC(result.data.text);
      setOcrText(cleaned);
    } catch (err: any) {
      alert(`Không thể trích xuất chữ từ ảnh: ${err.message || 'Lỗi không xác định'}`);
    } finally {
      setOcrLoading(false);
    }
  };

  const handleCopyToClipboard = () => {
    if (!ocrText) return;
    navigator.clipboard.writeText(ocrText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleAddAsNote = () => {
    if (!ocrText) return;
    addStickyNote(`[OCR TỪ ẢNH]\n\n${ocrText}`, 450, 300);
  };

  const handleAddAsPaper = () => {
    if (!ocrText) return;
    addUploadedDocument(`Tài Liệu OCR: ${documentTitle}`, [
      { title: 'Trích xuất từ ảnh', text: ocrText }
    ]);
  };

  return (
    <div className="flex-1 flex flex-col p-6 overflow-y-auto no-scrollbar font-sans text-slate-900 bg-white">
      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b border-slate-200">
        <div>
          <h4 className="text-sm font-bold text-slate-900">Quét Chữ Từ Ảnh Chụp (Tesseract.js OCR)</h4>
          <p className="text-xs text-slate-500">
            Nhận dạng ký tự quang học tiếng Việt và tiếng Anh chạy 100% bằng WebAssembly trên trình duyệt.
          </p>
        </div>
      </div>

      {/* Upload & Result Area */}
      <div className="flex-1 mt-4 flex flex-col">
        {!ocrText && (
          <label className="flex-1 min-h-[220px] flex flex-col items-center justify-center border-2 border-dashed border-slate-300 hover:border-slate-800 rounded-2xl cursor-pointer bg-slate-50 hover:bg-slate-100 transition-colors p-6 text-center">
            <Camera className="w-10 h-10 text-slate-400 mb-3" />
            <span className="text-sm font-bold text-slate-900 mb-1">
              {ocrLoading ? 'Đang phân tích hình ảnh qua Tesseract.js...' : 'Nhấp để tải lên ảnh chụp trang sách hoặc tài liệu'}
            </span>
            <span className="text-xs text-slate-500">
              Hỗ trợ định dạng PNG, JPG, WEBP — Ngôn ngữ tiếng Việt & tiếng Anh
            </span>
            <input 
              type="file" 
              accept="image/*" 
              disabled={ocrLoading} 
              onChange={handleOcrFileChange} 
              className="hidden" 
            />
          </label>
        )}

        {ocrText && (
          <div className="flex-1 flex flex-col">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-slate-700">Văn bản đã nhận diện:</span>
              <label className="text-xs text-slate-600 hover:text-black font-semibold cursor-pointer underline">
                Chọn ảnh khác
                <input 
                  type="file" 
                  accept="image/*" 
                  disabled={ocrLoading} 
                  onChange={handleOcrFileChange} 
                  className="hidden" 
                />
              </label>
            </div>

            <textarea
              value={ocrText}
              onChange={(e) => setOcrText(e.target.value)}
              className="flex-1 w-full bg-slate-50 border border-slate-200 rounded-xl p-4 text-xs font-mono text-slate-800 outline-none leading-relaxed resize-none"
            />
          </div>
        )}
      </div>

      {/* Footer Actions */}
      {ocrText && (
        <div className="pt-4 border-t border-slate-200 flex items-center justify-between mt-4">
          <div className="flex items-center gap-2">
            <button
              onClick={handleAddAsNote}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg text-xs font-semibold border border-slate-300 transition-colors"
            >
              <StickyNote className="w-3.5 h-3.5 text-amber-600" />
              <span>Ghim Lên Bàn</span>
            </button>

            <button
              onClick={handleAddAsPaper}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg text-xs font-semibold border border-slate-300 transition-colors"
            >
              <FileText className="w-3.5 h-3.5 text-slate-700" />
              <span>Tạo Tờ Giấy Mới</span>
            </button>
          </div>

          <button
            onClick={handleCopyToClipboard}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 hover:bg-black text-white rounded-lg text-xs font-semibold shadow-xs transition-colors"
          >
            {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? 'Đã sao chép' : 'Sao chép văn bản'}</span>
          </button>
        </div>
      )}
    </div>
  );
}
