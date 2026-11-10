'use client';

import React, { useState } from 'react';
import { generateClozeQuestions, QuizQuestion } from '@/lib/nonAiEngine';
import { useStudySpace } from '@/context/StudySpaceContext';
import { askAi } from '@/lib/aiClient';
import { 
  HelpCircle, 
  CheckCircle2, 
  XCircle, 
  FileText, 
  Award, 
  Clock,
  RotateCcw,
  Sparkles
} from 'lucide-react';

interface QuizTabProps {
  fullText: string;
  documentTitle: string;
  onCloseModal: () => void;
  isPaper?: boolean;
  targetPos?: { x: number; y: number };
}

export function QuizTab({ fullText, documentTitle, onCloseModal, isPaper, targetPos }: QuizTabProps) {
  const { addExamSheet } = useStudySpace();

  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [userAnswers, setUserAnswers] = useState<Record<string, number>>({});
  const [isGraded, setIsGraded] = useState(false);
  const [timeLimit, setTimeLimit] = useState<number>(15);
  const [useAi, setUseAi] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleGenerateQuestions = async () => {
    if (!fullText) return;

    if (!useAi) {
      const generated = generateClozeQuestions(fullText, 4);
      setQuestions(generated);
      setUserAnswers({});
      setIsGraded(false);
      return;
    }

    setLoading(true);
    try {
      const prompt = `Từ nội dung học tập sau đây, hãy tạo chính xác 3 câu hỏi trắc nghiệm kiểm tra hiểu bài (mỗi câu gồm 4 đáp án A, B, C, D, chỉ duy nhất 1 đáp án đúng).
Trả về dạng JSON array hợp lệ, KHÔNG thêm bất kỳ văn bản nào khác ngoài JSON:
[
  {
    "question": "Câu hỏi...",
    "options": ["Đáp án A", "Đáp án B", "Đáp án C", "Đáp án D"],
    "correctIndex": 0,
    "explanation": "Giải thích ngắn gọn lý do vì sao đúng"
  }
]`;

      const data = await askAi({
        prompt,
        context: fullText.slice(0, 4000),
      });

      const rawText = data.reply || '';
      const match = rawText.match(/\[[\s\S]*\]/);
      if (match) {
        const parsed = JSON.parse(match[0]);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setQuestions(parsed.map((q: any, idx: number) => ({
            id: `ai-q-${idx}-${Date.now()}`,
            question: q.question,
            options: q.options || [],
            correctIndex: typeof q.correctIndex === 'number' ? q.correctIndex : 0,
            explanation: q.explanation || ''
          })));
          setUserAnswers({});
          setIsGraded(false);
          return;
        }
      }
      setQuestions(generateClozeQuestions(fullText, 4));
    } catch (err) {
      console.warn('Lỗi AI Quiz, fallback Non-AI:', err);
      setQuestions(generateClozeQuestions(fullText, 4));
    } finally {
      setLoading(false);
      setUserAnswers({});
      setIsGraded(false);
    }
  };

  const handleSelectOption = (questionId: string, optionIdx: number) => {
    if (isGraded) return;
    setUserAnswers(prev => ({ ...prev, [questionId]: optionIdx }));
  };

  const handleGradeNow = () => {
    setIsGraded(true);
  };

  const handleExportToExamSheet = () => {
    if (questions.length === 0) return;
    const examQuestions = questions.map((q, idx) => ({
      id: q.id || `q-${idx}`,
      question: q.question,
      options: q.options,
      correctAnswer: q.correctIndex,
      explanation: q.explanation
    }));

    addExamSheet(`Đề Thi: ${documentTitle}`, examQuestions, timeLimit, targetPos);
    onCloseModal();
  };

  const calculateScore = () => {
    let correct = 0;
    questions.forEach(q => {
      if (userAnswers[q.id] === q.correctIndex) correct++;
    });
    return Math.round((correct / (questions.length || 1)) * 100) / 10;
  };

  // Dedicated layout for PaperSheet (Tờ giấy đơn)
  if (isPaper) {
    return (
      <div className="flex-1 flex flex-col p-4 font-sans text-slate-900 bg-white overflow-hidden select-none">
        {/* Dòng 1: Tiêu đề viết ngang hết dòng: Tạo đề ôn tập trắc nghiệm. */}
        <h4 className="text-xs font-black text-slate-900 tracking-tight whitespace-nowrap mb-2">
          Tạo đề ôn tập trắc nghiệm.
        </h4>

        {/* Dòng 2: Nổi bật tùy chọn Sử dụng AI */}
        <div className="mb-2.5">
          <label className={`flex items-center justify-between px-3 py-2 rounded-xl border transition-all cursor-pointer ${
            useAi 
              ? 'bg-gradient-to-r from-green-50 via-emerald-50 to-green-50 border-[#16A34A]/60 shadow-2xs ring-1 ring-[#16A34A]/20' 
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

        {/* Dòng 3: Nút nằm sát bên phải là Sinh Câu Hỏi màu nền cam ViT chữ trắng */}
        <div className="flex justify-end mb-3">
          <button
            onClick={handleGenerateQuestions}
            disabled={loading}
            className="px-4 py-2 bg-[#16A34A] hover:bg-[#15803D] active:scale-95 text-white rounded-xl text-xs font-bold whitespace-nowrap shadow-xs transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
          >
            <Sparkles className="w-3.5 h-3.5 text-white stroke-[2.4]" />
            <span>{loading ? 'Đang tạo đề...' : questions.length > 0 ? 'Tạo Đề Mới' : 'Sinh Câu Hỏi'}</span>
          </button>
        </div>

        {/* Quiz Content Body (Không xuất hiện cuộn trừ khi tràn subpixel) */}
        <div className="flex-1 min-h-[160px] max-h-[220px] flex flex-col overflow-y-auto no-scrollbar">
          {questions.length > 0 ? (
            <div className="space-y-3 pr-1">
              {questions.map((q, idx) => (
                <div key={q.id || idx} className="p-3 rounded-xl border border-slate-200 bg-slate-50 text-xs">
                  <p className="font-bold text-slate-900 mb-2 leading-snug">
                    Câu {idx + 1}: {q.question}
                  </p>
                  <div className="grid grid-cols-1 gap-1.5 pl-1">
                    {q.options.map((opt, oIdx) => {
                      const isChosen = userAnswers[q.id] === oIdx;
                      const isCorrect = isGraded && q.correctIndex === oIdx;
                      const isWrong = isGraded && isChosen && !isCorrect;

                      return (
                        <button
                          key={oIdx}
                          disabled={isGraded}
                          onClick={() => handleSelectOption(q.id, oIdx)}
                          className={`text-left p-1.5 rounded-lg border text-[11px] transition-all flex items-center gap-2 cursor-pointer ${
                            isCorrect
                              ? 'bg-[#ECFDF5] border-[#15803D] text-[#15803D] font-bold'
                              : isWrong
                              ? 'bg-[#FEF2F2] border-[#DC2626] text-[#DC2626] font-bold'
                              : isChosen
                              ? 'bg-[#F0FDF4] border-[#16A34A] text-slate-900 font-bold'
                              : 'bg-white hover:bg-slate-100 border-slate-200 text-slate-700'
                          }`}
                        >
                          <span className="w-4 h-4 rounded text-[9.5px] font-bold flex items-center justify-center bg-slate-200 text-slate-700 flex-shrink-0">
                            {String.fromCharCode(65 + oIdx)}
                          </span>
                          <span className="truncate flex-1">{opt}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-slate-400 text-xs text-center border-2 border-dashed border-slate-200 rounded-xl p-4">
              <HelpCircle className="w-6 h-6 mb-1.5 text-slate-300 stroke-[2.4]" />
              <span>Nhấn "Sinh Câu Hỏi" để tạo đề ôn tập trắc nghiệm</span>
            </div>
          )}
        </div>

        {/* Footer thu hẹp độ rộng vừa khít 1 dòng ngắn gọn */}
        {questions.length > 0 && (
          <div className="pt-2.5 border-t border-slate-100 flex items-center justify-between gap-2 mt-3">
            <button
              onClick={handleExportToExamSheet}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-[#16A34A] hover:bg-[#15803D] text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer whitespace-nowrap active:scale-95"
            >
              <FileText className="w-3.5 h-3.5 stroke-[2.4]" />
              <span>Xuất Đề Thi Ra Bàn</span>
            </button>

            {!isGraded ? (
              <button
                onClick={handleGradeNow}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 hover:bg-black text-white rounded-xl text-xs font-bold transition-colors shadow-xs cursor-pointer whitespace-nowrap"
              >
                <Award className="w-3.5 h-3.5 stroke-[2.4]" />
                <span>Chấm Điểm Ngay</span>
              </button>
            ) : (
              <div className="text-xs font-bold text-[#15803D] bg-[#ECFDF5] border border-[#A7F3D0] px-3 py-1 rounded-lg">
                Điểm: {calculateScore()}/10
              </div>
            )}
          </div>
        )}
      </div>
    );
  }

  // Full layout for Books
  return (
    <div className="flex-1 flex flex-col p-6 overflow-y-auto no-scrollbar font-sans text-slate-900 bg-white">
      {/* Header Bar */}
      <div className="flex items-center justify-between pb-4 border-b border-slate-200">
        <div>
          <h4 className="text-sm font-bold text-slate-900">Trắc Nghiệm Tự Động (Non-AI Cloze Deletion)</h4>
          <p className="text-xs text-slate-500">
            Tự động bóc tách thuật ngữ bài học sinh 4 phương án lựa chọn, chạy 100% offline.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {questions.length > 0 && (
            <button
              onClick={handleExportToExamSheet}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 hover:bg-black text-white rounded-lg text-xs font-bold transition-colors shadow-xs"
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Xuất Tờ Đề Thi Ra Bàn</span>
            </button>
          )}

          <button
            onClick={handleGenerateQuestions}
            className="px-4 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-300 rounded-lg text-xs font-bold transition-colors shadow-2xs"
          >
            {questions.length > 0 ? 'Tạo Đề Mới' : 'Sinh Câu Hỏi'}
          </button>
        </div>
      </div>

      {/* Quiz Body */}
      <div className="flex-1 mt-4">
        {questions.length > 0 ? (
          <div className="space-y-4">
            {questions.map((q, qIdx) => {
              const selectedAns = userAnswers[q.id];
              const isCorrect = selectedAns === q.correctIndex;

              return (
                <div key={q.id} className="p-4 rounded-xl border border-slate-200 bg-slate-50/60">
                  <div className="font-bold text-xs text-slate-900 mb-2.5 flex items-start justify-between gap-2">
                    <span>Câu {qIdx + 1}: {q.question}</span>
                    {isGraded && (
                      isCorrect ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                      ) : (
                        <XCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />
                      )
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {q.options.map((opt, oIdx) => {
                      const isChosen = selectedAns === oIdx;
                      const isRight = isGraded && q.correctIndex === oIdx;
                      const isWrong = isGraded && isChosen && !isCorrect;

                      return (
                        <button
                          key={oIdx}
                          disabled={isGraded}
                          onClick={() => handleSelectOption(q.id, oIdx)}
                          className={`flex items-center gap-2 p-2 rounded-lg text-left text-xs transition-colors border ${
                            isRight 
                              ? 'bg-emerald-100 border-emerald-400 font-bold text-emerald-900'
                              : isWrong
                              ? 'bg-rose-100 border-rose-400 text-rose-900'
                              : isChosen
                              ? 'bg-slate-900 text-white font-medium border-slate-900 shadow-2xs'
                              : 'bg-white hover:bg-slate-100 border-slate-200 text-slate-800'
                          }`}
                        >
                          <span className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-bold ${
                            isChosen ? 'bg-white text-slate-900' : 'bg-slate-200 text-slate-700'
                          }`}>
                            {String.fromCharCode(65 + oIdx)}
                          </span>
                          <span className="flex-1 truncate">{opt}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="h-64 flex flex-col items-center justify-center text-slate-400 text-xs text-center border-2 border-dashed border-slate-200 rounded-xl">
            <HelpCircle className="w-8 h-8 mb-2 text-slate-300" />
            <span>Nhấn "Sinh Câu Hỏi" để trích xuất bài kiểm tra trắc nghiệm từ nội dung văn bản</span>
          </div>
        )}
      </div>

      {/* Footer Controls */}
      {questions.length > 0 && (
        <div className="pt-4 border-t border-slate-200 flex items-center justify-between mt-4">
          <div className="text-xs text-slate-500">
            Đã trả lời: {Object.keys(userAnswers).length} / {questions.length} câu
          </div>

          <div className="flex items-center gap-2">
            {isGraded ? (
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-900 bg-slate-100 px-3 py-1.5 rounded-lg border border-slate-300">
                  Điểm số: {calculateScore()} / 10
                </span>
                <button
                  onClick={() => {
                    setIsGraded(false);
                    setUserAnswers({});
                  }}
                  className="flex items-center gap-1 px-3 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded-lg text-xs font-semibold cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Làm lại</span>
                </button>
              </div>
            ) : (
              <button
                onClick={handleGradeNow}
                disabled={Object.keys(userAnswers).length === 0}
                className="px-4 py-1.5 bg-slate-900 hover:bg-black text-white text-xs font-bold rounded-lg shadow-xs transition-colors flex items-center gap-1.5 disabled:opacity-50 cursor-pointer"
              >
                <Award className="w-3.5 h-3.5" />
                <span>Chấm Điểm Ngay</span>
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
