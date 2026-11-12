'use client';

import React, { useState } from 'react';
import { generateClozeQuestions, QuizQuestion } from '@/lib/nonAiEngine';
import { useStudySpace } from '@/context/StudySpaceContext';
import { askAi, parseQuizJsonSafely } from '@/lib/aiClient';
import { 
  HelpCircle, 
  CheckCircle2, 
  XCircle, 
  FileText, 
  Award, 
  RotateCcw,
  Sparkles,
  ChevronDown,
  ChevronUp,
  BookmarkPlus
} from 'lucide-react';
import { MathRenderer } from '@/components/common/MathRenderer';

interface QuizTabProps {
  fullText: string;
  documentTitle: string;
  onCloseModal: () => void;
  isPaper?: boolean;
  targetPos?: { x: number; y: number };
  activePageText?: string;
}

export function QuizTab({ 
  fullText, 
  documentTitle, 
  onCloseModal, 
  isPaper, 
  targetPos,
  activePageText 
}: QuizTabProps) {
  const { addExamSheet, addStickyNote } = useStudySpace();

  const [questionCount, setQuestionCount] = useState<3 | 5 | 10>(5);
  const [difficulty, setDifficulty] = useState<'Dễ' | 'Vừa' | 'Khó'>('Vừa');
  const [scope, setScope] = useState<'Trang hiện tại' | 'Cả cuốn sách'>('Cả cuốn sách');
  const [useAi, setUseAi] = useState(false);
  const [loading, setLoading] = useState(false);
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [userAnswers, setUserAnswers] = useState<Record<string, number>>({});
  const [isGraded, setIsGraded] = useState(false);
  const [timeLimit, setTimeLimit] = useState<number>(15);
  const [savedNotice, setSavedNotice] = useState<string | null>(null);
  const [aiErrorNotice, setAiErrorNotice] = useState<string | null>(null);
  const [creationSource, setCreationSource] = useState<'ai' | 'offline' | null>(null);
  const [expandedExplanations, setExpandedExplanations] = useState<Record<string, boolean>>({});

  const textToUse = (scope === 'Trang hiện tại' && activePageText && activePageText.trim().length > 20) 
    ? activePageText 
    : fullText;

  const handleGenerateQuestions = async () => {
    if (!textToUse) return;
    setSavedNotice(null);
    setAiErrorNotice(null);

    if (!useAi) {
      const generated = generateClozeQuestions(textToUse, questionCount);
      setQuestions(generated);
      setCreationSource('offline');
      setUserAnswers({});
      setIsGraded(false);
      setExpandedExplanations({});
      return;
    }

    setLoading(true);
    try {
      const prompt = `Từ nội dung học tập sau đây (phạm vi: ${scope}), hãy tạo chính xác ${questionCount} câu hỏi trắc nghiệm ôn tập mức độ ${difficulty} (mỗi câu gồm 4 đáp án A, B, C, D, chỉ duy nhất 1 đáp án đúng). Hãy viết câu hỏi rõ ràng, bám sát kiến thức, công thức toán/lý định dạng LaTeX chuẩn \\(...\\) hoặc \\[...\\].
Trả về dạng JSON array hợp lệ, KHÔNG thêm bất kỳ văn bản nào khác ngoài JSON:
[
  {
    "question": "Câu hỏi...",
    "options": ["Đáp án A", "Đáp án B", "Đáp án C", "Đáp án D"],
    "correctIndex": 0,
    "explanation": "Giải thích chi tiết vì sao đáp án này đúng"
  }
]`;

      const estimatedTokens = Math.min(3800, questionCount * 320 + 400);

      const data = await askAi({
        prompt,
        context: textToUse.slice(0, 4500),
        maxTokens: estimatedTokens,
      });

      const rawText = data.reply || '';
      const parsedList = parseQuizJsonSafely(rawText);

      if (parsedList.length > 0) {
        setQuestions(parsedList.slice(0, questionCount).map((q: any, idx: number) => ({
          id: `ai-q-${idx}-${Date.now()}`,
          question: q.question,
          options: Array.isArray(q.options) ? q.options : ['A', 'B', 'C', 'D'],
          correctIndex: typeof q.correctIndex === 'number' ? q.correctIndex : 0,
          explanation: q.explanation || ''
        })));
        setCreationSource('ai');
        setUserAnswers({});
        setIsGraded(false);
        setExpandedExplanations({});
        return;
      }

      setAiErrorNotice('AI phản hồi chưa hoàn chỉnh. Bạn có thể bấm "Dùng bản Offline" bên dưới để tiếp tục.');
      const generated = generateClozeQuestions(textToUse, questionCount);
      setQuestions(generated);
      setCreationSource('offline');
    } catch (err: any) {
      console.warn('Lỗi AI Quiz:', err);
      setAiErrorNotice(err?.message || 'Không thể kết nối đến AI. Đã tự động chuyển sang bản Offline.');
      const generated = generateClozeQuestions(textToUse, questionCount);
      setQuestions(generated);
      setCreationSource('offline');
    } finally {
      setLoading(false);
      setUserAnswers({});
      setIsGraded(false);
      setExpandedExplanations({});
    }
  };

  const handleSelectOption = (questionId: string, optionIdx: number) => {
    if (isGraded) return;
    setUserAnswers(prev => ({ ...prev, [questionId]: optionIdx }));
  };

  const handleGradeNow = () => {
    setIsGraded(true);
    // Expand explanations for incorrect questions automatically
    const newExpanded: Record<string, boolean> = {};
    questions.forEach(q => {
      if (userAnswers[q.id] !== q.correctIndex) {
        newExpanded[q.id] = true;
      }
    });
    setExpandedExplanations(newExpanded);
  };

  const calculateScore = () => {
    let correct = 0;
    questions.forEach(q => {
      if (userAnswers[q.id] === q.correctIndex) correct++;
    });
    return Math.round((correct / (questions.length || 1)) * 100) / 10;
  };

  const getWrongQuestions = () => {
    return questions.filter(q => userAnswers[q.id] !== q.correctIndex);
  };

  const handleRetryWrongQuestions = () => {
    const wrong = getWrongQuestions();
    if (wrong.length === 0) return;
    setQuestions(wrong);
    const newAnswers: Record<string, number> = {};
    setUserAnswers(newAnswers);
    setIsGraded(false);
    setExpandedExplanations({});
  };

  const handleSaveWrongToFlashcards = () => {
    const wrong = getWrongQuestions();
    if (wrong.length === 0) return;

    const posX = targetPos?.x ?? 480;
    const posY = targetPos?.y ?? 260;

    const noteBody = wrong.map((q, idx) => {
      const correctOpt = q.options[q.correctIndex] || '';
      return `Câu ${idx + 1}: ${q.question}\nĐáp án đúng: ${correctOpt}${q.explanation ? `\nGiải thích: ${q.explanation}` : ''}`;
    }).join('\n\n---\n\n');

    addStickyNote(`[THẺ ÔN CÂU SAI: ${documentTitle}]\n\n${noteBody}`, posX, posY);
    setSavedNotice(`Đã lưu ${wrong.length} câu làm sai thành thẻ ghi nhớ trên bàn học!`);
    setTimeout(() => setSavedNotice(null), 4000);
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

    addExamSheet(`Đề thi: ${documentTitle}`, examQuestions, timeLimit, targetPos);
    onCloseModal();
  };

  const toggleExplanation = (questionId: string) => {
    setExpandedExplanations(prev => ({
      ...prev,
      [questionId]: !prev[questionId]
    }));
  };

  // Dedicated layout for PaperSheet (Tờ giấy đơn)
  if (isPaper) {
    return (
      <div className="flex-1 flex flex-col p-4 font-sans text-slate-900 bg-white overflow-hidden select-none">
        {/* Dòng 1: Tiêu đề sentence case không ngắt dòng */}
        <h4 className="text-xs font-bold text-slate-900 tracking-tight whitespace-nowrap mb-2">
          Tạo đề ôn tập trắc nghiệm
        </h4>

        {/* Dòng 2: Tùy chọn sử dụng AI */}
        <div className="mb-2.5">
          <label className={`flex items-center justify-between px-3 py-2 rounded-xl border transition-all cursor-pointer ${
            useAi 
              ? 'bg-gradient-to-r from-green-50 via-emerald-50 to-green-50 border-[#16A34A]/60 shadow-2xs ring-1 ring-[#16A34A]/20' 
              : 'bg-slate-50 border-slate-200 hover:border-slate-300'
          }`}>
            <div className="flex flex-col">
              <span className={`text-xs font-bold ${useAi ? 'text-[#16A34A]' : 'text-slate-700'}`}>
                Dùng AI chuyên sâu
              </span>
              <span className="text-[10px] text-slate-500">
                {useAi ? 'Phân tích logic, có lời giải · Miễn phí' : 'Nhanh, miễn phí'}
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

        {/* Dòng 3: Nút Sinh câu hỏi */}
        <div className="flex justify-end mb-3">
          <button
            onClick={handleGenerateQuestions}
            disabled={loading}
            className="px-4 py-2 bg-[#16A34A] hover:bg-[#15803D] active:scale-95 text-white rounded-xl text-xs font-bold whitespace-nowrap shadow-xs transition-all flex items-center justify-center cursor-pointer disabled:opacity-50"
          >
            <span>{loading ? 'Đang tạo đề...' : questions.length > 0 ? 'Tạo đề mới' : 'Sinh câu hỏi'}</span>
          </button>
        </div>

        {/* Quiz Content Body */}
        <div className="flex-1 min-h-[160px] max-h-[220px] flex flex-col overflow-y-auto no-scrollbar">
          {questions.length > 0 ? (
            <div className="space-y-3 pr-1">
              {questions.map((q, idx) => (
                <div key={q.id || idx} className="p-3 rounded-xl border border-slate-200 bg-slate-50 text-xs">
                  <p className="font-bold text-slate-900 mb-2 leading-snug">
                    <span className="mr-1">Câu {idx + 1}: </span>
                    <MathRenderer content={q.question} />
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
                          <span className="flex-1">
                            <MathRenderer content={opt} />
                          </span>
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
              <span>Nhấn "Sinh câu hỏi" để tạo đề ôn tập trắc nghiệm</span>
            </div>
          )}
        </div>

        {/* Footer */}
        {questions.length > 0 && (
          <div className="pt-2.5 border-t border-slate-100 flex items-center justify-between gap-2 mt-3">
            <button
              onClick={handleExportToExamSheet}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-[#16A34A] hover:bg-[#15803D] text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer whitespace-nowrap active:scale-95"
            >
              <FileText className="w-3.5 h-3.5 stroke-[2.4]" />
              <span>Xuất đề thi ra bàn</span>
            </button>

            {!isGraded ? (
              <button
                onClick={handleGradeNow}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 hover:bg-black text-white rounded-xl text-xs font-bold transition-colors shadow-xs cursor-pointer whitespace-nowrap"
              >
                <Award className="w-3.5 h-3.5 stroke-[2.4]" />
                <span>Chấm điểm ngay</span>
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

  // Full ergonomic layout for Books (In-situ Cockpit)
  const wrongQuestions = isGraded ? getWrongQuestions() : [];

  return (
    <div className="flex-1 flex flex-col p-5 overflow-y-auto no-scrollbar font-sans text-slate-900 bg-white">
      {/* HÀNG 1: Tiêu đề & Mô tả */}
      <div className="flex items-start justify-between pb-3 border-b border-slate-200">
        <div>
          <h4 className="text-sm font-bold text-slate-900">Trắc nghiệm ôn tập kiến thức</h4>
          <p className="text-xs text-slate-500 mt-0.5">
            {useAi 
              ? 'Mô hình AI phân tích câu hỏi logic kèm lời giải chi tiết công thức toán học'
              : 'Động cơ Non-AI bóc tách thuật ngữ sinh phương án lựa chọn, chạy 100% offline miễn phí'}
          </p>
        </div>
      </div>

      {/* HÀNG 2: Khu vực điều khiển rộng rãi, đầy đủ tùy chọn trước khi sinh */}
      <div className="py-2.5 px-3 flex flex-wrap items-center justify-between gap-3 border border-slate-200 bg-slate-50/80 rounded-xl mt-3 select-none">
        {/* Bên trái: 3 lựa chọn (Số câu, Độ khó, Phạm vi) */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Lựa chọn 1: Số câu */}
          <div className="flex items-center gap-1.5 text-xs">
            <span className="text-slate-500 font-medium">Số câu:</span>
            <div className="inline-flex rounded-lg border border-slate-200 bg-white p-0.5 shadow-2xs">
              {([3, 5, 10] as const).map((cnt) => (
                <button
                  key={cnt}
                  type="button"
                  onClick={() => setQuestionCount(cnt)}
                  className={`px-2.5 py-1 text-xs font-bold rounded-md transition-all cursor-pointer ${
                    questionCount === cnt
                      ? 'bg-slate-900 text-white shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  {cnt}
                </button>
              ))}
            </div>
          </div>

          {/* Lựa chọn 2: Độ khó */}
          <div className="flex items-center gap-1.5 text-xs">
            <span className="text-slate-500 font-medium">Độ khó:</span>
            <div className="inline-flex rounded-lg border border-slate-200 bg-white p-0.5 shadow-2xs">
              {(['Dễ', 'Vừa', 'Khó'] as const).map((diff) => (
                <button
                  key={diff}
                  type="button"
                  onClick={() => setDifficulty(diff)}
                  className={`px-2.5 py-1 text-xs font-bold rounded-md transition-all cursor-pointer ${
                    difficulty === diff
                      ? 'bg-slate-900 text-white shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  {diff}
                </button>
              ))}
            </div>
          </div>

          {/* Lựa chọn 3: Phạm vi */}
          {activePageText && (
            <div className="flex items-center gap-1.5 text-xs">
              <span className="text-slate-500 font-medium">Phạm vi:</span>
              <div className="inline-flex rounded-lg border border-slate-200 bg-white p-0.5 shadow-2xs">
                {(['Trang hiện tại', 'Cả cuốn sách'] as const).map((sc) => (
                  <button
                    key={sc}
                    type="button"
                    onClick={() => setScope(sc)}
                    className={`px-2.5 py-1 text-xs font-bold rounded-md transition-all cursor-pointer ${
                      scope === sc
                        ? 'bg-slate-900 text-white shadow-2xs'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                    }`}
                  >
                    {sc}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Bên phải: Tùy chọn AI + Nút hành động */}
        <div className="flex items-center gap-3">
          {/* Checkbox Dùng AI chuyên sâu */}
          <label className={`flex items-center gap-2.5 px-3 py-1.5 rounded-xl border transition-all cursor-pointer ${
            useAi 
              ? 'bg-green-50/80 border-[#16A34A]/60 text-slate-900 shadow-2xs' 
              : 'bg-white border-slate-200 hover:border-slate-300 text-slate-700'
          }`}>
            <input 
              type="checkbox"
              checked={useAi}
              onChange={(e) => setUseAi(e.target.checked)}
              className="w-4 h-4 rounded accent-[#16A34A] cursor-pointer"
            />
            <div className="flex flex-col text-left">
              <span className="text-xs font-bold leading-tight">Dùng AI chuyên sâu</span>
              <span className="text-[10px] text-slate-500 leading-tight">
                {useAi ? 'Có lời giải · Miễn phí' : 'Nhanh, miễn phí'}
              </span>
            </div>
          </label>

          {/* Nút Sinh câu hỏi */}
          <button
            onClick={handleGenerateQuestions}
            disabled={loading}
            className="px-4 py-2 bg-[#16A34A] hover:bg-[#15803D] active:scale-95 text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center justify-center cursor-pointer disabled:opacity-50 whitespace-nowrap"
          >
            <span>
              {loading 
                ? 'Đang tạo câu hỏi (~3-5s)...' 
                : questions.length > 0 
                ? `Tạo đề mới (${questionCount} câu)` 
                : `Sinh câu hỏi (${questionCount} câu)`}
            </span>
          </button>
        </div>
      </div>

      {/* Thông báo lỗi AI nếu có */}
      {aiErrorNotice && (
        <div className="mt-3 p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 flex items-center justify-between gap-2 animate-fade-in">
          <span className="flex-1">{aiErrorNotice}</span>
          <button
            type="button"
            onClick={() => {
              setAiErrorNotice(null);
              setUseAi(false);
              const generated = generateClozeQuestions(textToUse, questionCount);
              setQuestions(generated);
              setCreationSource('offline');
            }}
            className="px-2.5 py-1 bg-white border border-rose-300 hover:bg-rose-100 text-rose-900 rounded-lg text-xs font-bold cursor-pointer shrink-0"
          >
            Dùng bản Offline
          </button>
        </div>
      )}

      {/* Huy hiệu nguồn câu hỏi */}
      {questions.length > 0 && creationSource && (
        <div className="mt-3 flex items-center justify-between text-[11px] font-medium text-slate-500">
          <span className="flex items-center gap-1.5">
            <span className={`w-2 h-2 rounded-full ${creationSource === 'ai' ? 'bg-[#16A34A]' : 'bg-slate-400'}`} />
            <span>Nguồn đề: <strong className="text-slate-800">{creationSource === 'ai' ? 'Tạo bằng AI chuyên sâu' : 'Tạo bằng động cơ Offline'}</strong></span>
          </span>
          <span>Tổng số câu: <strong className="text-slate-800">{questions.length}</strong></span>
        </div>
      )}

      {/* Thông báo đã lưu thẻ ghi nhớ */}
      {savedNotice && (
        <div className="mt-3 p-2.5 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 font-semibold text-center animate-fade-in">
          {savedNotice}
        </div>
      )}

      {/* Thân bài kiểm tra (Quiz Body) */}
      <div className="flex-1 mt-4">
        {questions.length > 0 ? (
          <div className="space-y-4">
            {questions.map((q, qIdx) => {
              const selectedAns = userAnswers[q.id];
              const isCorrect = selectedAns === q.correctIndex;
              const isWrong = isGraded && selectedAns !== undefined && !isCorrect;
              const hasExpanded = Boolean(expandedExplanations[q.id]);

              return (
                <div key={q.id} className="p-4 rounded-xl border border-slate-200 bg-slate-50/60 shadow-2xs">
                  <div className="font-bold text-xs text-slate-900 mb-2.5 flex items-start justify-between gap-2">
                    <span className="flex-1 leading-snug">
                      <span className="font-bold mr-1.5 text-slate-700">Câu {qIdx + 1}:</span>
                      <MathRenderer content={q.question} />
                    </span>
                    {isGraded && (
                      isCorrect ? (
                        <div className="flex items-center gap-1 text-emerald-600 font-bold text-xs flex-shrink-0">
                          <CheckCircle2 className="w-4 h-4 stroke-[2.4]" />
                          <span>Đúng</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1 text-rose-600 font-bold text-xs flex-shrink-0">
                          <XCircle className="w-4 h-4 stroke-[2.4]" />
                          <span>Sai</span>
                        </div>
                      )
                    )}
                  </div>

                  {/* 4 Phương án A, B, C, D */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {q.options.map((opt, oIdx) => {
                      const isChosen = selectedAns === oIdx;
                      const isRight = isGraded && q.correctIndex === oIdx;
                      const isOptionWrong = isGraded && isChosen && !isRight;

                      return (
                        <button
                          key={oIdx}
                          disabled={isGraded}
                          onClick={() => handleSelectOption(q.id, oIdx)}
                          className={`flex items-center gap-2 p-2.5 rounded-lg text-left text-xs transition-colors border cursor-pointer ${
                            isRight 
                              ? 'bg-emerald-50 border-emerald-400 font-bold text-emerald-900'
                              : isOptionWrong
                              ? 'bg-rose-50 border-rose-400 text-rose-900'
                              : isChosen
                              ? 'bg-slate-900 text-white font-medium border-slate-900 shadow-2xs [&_.katex]:text-inherit'
                              : 'bg-white hover:bg-slate-100 border-slate-200 text-slate-800'
                          }`}
                        >
                          <span className={`w-5 h-5 rounded-md flex items-center justify-center text-[10px] font-bold flex-shrink-0 ${
                            isChosen ? 'bg-white text-slate-900' : 'bg-slate-200 text-slate-700'
                          }`}>
                            {String.fromCharCode(65 + oIdx)}
                          </span>
                          <span className="flex-1 leading-relaxed">
                            <MathRenderer content={opt} />
                          </span>
                        </button>
                      );
                    })}
                  </div>

                  {/* Giải thích câu hỏi khi đã chấm điểm */}
                  {isGraded && q.explanation && (
                    <div className="mt-3 pt-2.5 border-t border-slate-200">
                      <button
                        onClick={() => toggleExplanation(q.id)}
                        className="text-[11px] font-bold text-slate-700 hover:text-[#16A34A] flex items-center gap-1 cursor-pointer"
                      >
                        {hasExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                        <span>{hasExpanded ? 'Ẩn lời giải chi tiết' : 'Xem lời giải chi tiết'}</span>
                      </button>

                      {hasExpanded && (
                        <div className="mt-2 p-3 rounded-lg bg-white border border-slate-200 text-xs text-slate-700 leading-relaxed animate-fade-in">
                          <strong className="text-slate-900 mr-1">Lời giải:</strong>
                          <MathRenderer content={q.explanation} />
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          /* TRẠNG THÁI RỖNG: Hướng dẫn 3 bước thực tế */
          <div className="border border-slate-200 bg-slate-50/50 rounded-2xl p-6 text-slate-600 flex flex-col gap-5">
            <div>
              <h5 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">
                Quy trình tự ôn tập trắc nghiệm hiệu quả
              </h5>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs flex flex-col gap-1.5">
                  <div className="w-6 h-6 rounded-md bg-green-50 text-[#16A34A] font-bold text-xs flex items-center justify-center">
                    1
                  </div>
                  <strong className="text-xs text-slate-900 font-bold">Chọn số câu & độ khó</strong>
                  <p className="text-[11px] text-slate-500 leading-relaxed">
                    Điều chỉnh số lượng câu hỏi và mức độ phù hợp với mục tiêu ôn bài của bạn.
                  </p>
                </div>

                <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs flex flex-col gap-1.5">
                  <div className="w-6 h-6 rounded-md bg-green-50 text-[#16A34A] font-bold text-xs flex items-center justify-center">
                    2
                  </div>
                  <strong className="text-xs text-slate-900 font-bold">Bấm &ldquo;Sinh câu hỏi&rdquo;</strong>
                  <p className="text-[11px] text-slate-500 leading-relaxed">
                    Hệ thống trích xuất nội dung từ sách và sinh bộ câu hỏi trắc nghiệm ngay lập tức.
                  </p>
                </div>

                <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs flex flex-col gap-1.5">
                  <div className="w-6 h-6 rounded-md bg-green-50 text-[#16A34A] font-bold text-xs flex items-center justify-center">
                    3
                  </div>
                  <strong className="text-xs text-slate-900 font-bold">Chấm điểm & học câu sai</strong>
                  <p className="text-[11px] text-slate-500 leading-relaxed">
                    Nhận điểm số tức thì, xem lời giải công thức toán học và lưu câu sai thành thẻ ghi nhớ.
                  </p>
                </div>
              </div>
            </div>

            {/* Khung mô phỏng câu hỏi mẫu */}
            <div className="p-4 rounded-xl border border-slate-300 bg-white shadow-2xs opacity-75">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-[10px] font-bold uppercase tracking-wider bg-slate-100 text-slate-600 px-2 py-0.5 rounded">
                  Câu hỏi mẫu minh họa
                </span>
                <span className="text-xs font-bold text-slate-800">
                  Đạo hàm riêng của hàm số f(x, y) = x^2 + 3y theo biến x là:
                </span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="p-2 rounded-lg border border-slate-200 bg-slate-50 text-slate-700">
                  <span className="font-bold mr-1.5">A.</span> 2x
                </div>
                <div className="p-2 rounded-lg border border-slate-200 bg-slate-50 text-slate-700">
                  <span className="font-bold mr-1.5">B.</span> 2x + 3
                </div>
                <div className="p-2 rounded-lg border border-slate-200 bg-slate-50 text-slate-700">
                  <span className="font-bold mr-1.5">C.</span> 3
                </div>
                <div className="p-2 rounded-lg border border-slate-200 bg-slate-50 text-slate-700">
                  <span className="font-bold mr-1.5">D.</span> x^2
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* FOOTER ĐIỀU KHIỂN & CHẤM ĐIỂM */}
      {questions.length > 0 && (
        <div className="pt-4 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3 mt-4">
          <div className="text-xs text-slate-500">
            Đã trả lời: <strong className="text-slate-800">{Object.keys(userAnswers).length}</strong> / {questions.length} câu
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Xuất tờ đề thi ra bàn học */}
            <button
              onClick={handleExportToExamSheet}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-300 rounded-lg text-xs font-bold transition-all shadow-2xs cursor-pointer active:scale-95"
            >
              <FileText className="w-3.5 h-3.5 stroke-[2.2]" />
              <span>Xuất đề thi ra bàn</span>
            </button>

            {isGraded ? (
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs font-bold text-slate-900 bg-emerald-50 text-emerald-800 border border-emerald-300 px-3 py-1.5 rounded-lg">
                  Điểm số: {calculateScore()} / 10
                </span>

                {/* Nút Làm lại câu sai */}
                {wrongQuestions.length > 0 && (
                  <button
                    onClick={handleRetryWrongQuestions}
                    className="flex items-center gap-1 px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-800 border border-rose-300 rounded-lg text-xs font-bold cursor-pointer transition-colors"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Làm lại {wrongQuestions.length} câu sai</span>
                  </button>
                )}

                {/* Nút Lưu câu sai thành thẻ ghi nhớ */}
                {wrongQuestions.length > 0 && (
                  <button
                    onClick={handleSaveWrongToFlashcards}
                    className="flex items-center gap-1 px-3 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 rounded-lg text-xs font-bold cursor-pointer transition-colors"
                  >
                    <BookmarkPlus className="w-3.5 h-3.5 text-amber-700" />
                    <span>Lưu câu sai vào thẻ ghi nhớ</span>
                  </button>
                )}

                {/* Nút Làm lại tất cả */}
                <button
                  onClick={() => {
                    setIsGraded(false);
                    setUserAnswers({});
                    setExpandedExplanations({});
                  }}
                  className="flex items-center gap-1 px-3 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded-lg text-xs font-semibold cursor-pointer transition-colors"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Làm lại tất cả</span>
                </button>
              </div>
            ) : (
              <button
                onClick={handleGradeNow}
                disabled={Object.keys(userAnswers).length === 0}
                className="px-4 py-2 bg-slate-900 hover:bg-black text-white text-xs font-bold rounded-lg shadow-xs transition-colors flex items-center gap-1.5 disabled:opacity-50 cursor-pointer"
              >
                <Award className="w-3.5 h-3.5" />
                <span>Chấm điểm ngay</span>
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
