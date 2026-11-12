/**
 * ViTudy Non-AI Processing Engine
 * Hoàn toàn miễn phí, chạy cục bộ phía Client / Server nhẹ không cần gọi LLM
 * - Thuật toán TextRank & TF-IDF tóm tắt văn bản
 * - Thuật toán Cloze Deletion đục lỗ từ khoá tạo câu hỏi trắc nghiệm
 * - Heuristic Heading Parser trích lục mục lục & lộ trình học
 * - Quy tắc nhận diện mẫu câu định nghĩa để tạo Flashcard
 */

// Bảng stop words thông dụng tiếng Việt và tiếng Anh để lọc từ vô nghĩa
const STOP_WORDS = new Set([
  'và', 'là', 'của', 'có', 'trong', 'được', 'cho', 'với', 'về', 'các', 'những',
  'này', 'đó', 'khi', 'đã', 'sẽ', 'từ', 'đến', 'theo', 'như', 'để', 'một',
  'hai', 'ba', 'thì', 'mà', 'ra', 'vào', 'lại', 'bằng', 'do', 'nếu', 'nhưng',
  'the', 'is', 'at', 'which', 'on', 'in', 'of', 'and', 'a', 'an', 'to', 'for',
  'with', 'as', 'by', 'that', 'this', 'from', 'or', 'are', 'be', 'it'
]);

export interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
  sourceSnippet?: string;
}

export interface Flashcard {
  id: string;
  front: string;
  back: string;
  category?: string;
}

export interface RoadmapStep {
  id: string;
  stepNumber: number;
  title: string;
  estimatedMinutes: number;
  description: string;
  pageIndex: number;
  isCompleted: boolean;
}

export interface DocumentOutlineNode {
  id: string;
  level: number;
  title: string;
  rawText: string;
  estimatedMinutes: number;
}

const LATEX_COMMAND_BLACKLIST = new Set([
  'nabla', 'partial', 'frac', 'theta', 'sigma', 'sigma_i', 'alpha', 'beta', 'gamma',
  'delta', 'lambda', 'mu', 'pi', 'rho', 'tau', 'omega', 'phi', 'psi', 'sum', 'prod',
  'int', 'sqrt', 'left', 'right', 'mathbf', 'mathit', 'mathbb', 'mathcal', 'text',
  'infty', 'approx', 'times', 'cdot', 'leq', 'geq', 'neq', 'forall', 'exists', 'in',
  'subset', 'cap', 'cup', 'begin', 'end', 'matrix', 'bmatrix', 'pmatrix', 'array'
]);

/**
 * 1. Tách văn bản thành các câu hoàn chỉnh
 */
export function splitSentences(text: string): string[] {
  return text
    .replace(/\r\n/g, '\n')
    // Tách theo dấu chấm, chấm than, hỏi chấm, xuống dòng, hoặc đầu dòng bullet • / -
    .split(/(?<=[.!?。])\s+|\n\n+|(?=\n\s*[•\-*]\s+)/)
    .map(s => s.replace(/^[•\-*]\s+/, '').replace(/^#{1,4}\s+/, '').trim())
    .filter(s => s.length > 20 && !s.startsWith('#')); // Bỏ câu quá ngắn hoặc tiêu đề thuần
}

/**
 * 2. Tokenize và tính tần suất từ (TF-IDF nhẹ)
 */
function tokenize(sentence: string): string[] {
  // Thay thế các công thức toán LaTeX trước khi tokenize để không tách từ khóa toán
  const clean = sentence
    .replace(/(\$\$[\s\S]+?\$\$|\\\[[\s\S]+?\\\]|\$[^\$\n]+?\$|\\\([\s\S]+?\\\))/g, ' ')
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s_]/gu, ' ');

  return clean
    .split(/\s+/)
    .filter(w => w.length > 2 && !STOP_WORDS.has(w) && !LATEX_COMMAND_BLACKLIST.has(w));
}

/**
 * 3. Tóm tắt trích xuất thống kê (TextRank Algorithm)
 * Chấm điểm câu bằng mật độ từ khoá và mối tương đồng từ vựng
 */
export function summarizeWithTextRank(text: string, topN = 4): string[] {
  const sentences = splitSentences(text);
  if (sentences.length <= topN) return sentences;

  // Tính tần suất từ toàn văn bản
  const wordFreq: Record<string, number> = {};
  const tokenizedSentences = sentences.map(s => {
    const tokens = tokenize(s);
    for (const t of tokens) {
      wordFreq[t] = (wordFreq[t] || 0) + 1;
    }
    return tokens;
  });

  // Chấm điểm mỗi câu dựa trên trọng số từ khoá và vị trí (câu đầu đoạn có ưu thế)
  const scores = sentences.map((sentence, idx) => {
    const tokens = tokenizedSentences[idx];
    if (tokens.length === 0) return { idx, score: 0, sentence };

    let score = 0;
    for (const t of tokens) {
      score += wordFreq[t] || 0;
    }
    // Chuẩn hoá theo độ dài để tránh thiên vị câu quá dài
    score = score / Math.sqrt(tokens.length);

    // Ưu thế vị trí câu đầu chương/đoạn
    if (idx === 0) score *= 1.35;
    if (sentence.includes(':') || sentence.includes('=')) score *= 1.15;

    return { idx, score, sentence };
  });

  // Lấy top N câu có điểm cao nhất
  const topSentences = [...scores]
    .sort((a, b) => b.score - a.score)
    .slice(0, topN)
    .sort((a, b) => a.idx - b.idx) // Xếp lại theo thứ tự thời gian xuất hiện trong bài
    .map(item => item.sentence);

  return topSentences;
}

/**
 * 4. Thuật toán Cloze Deletion: Tự sinh câu hỏi trắc nghiệm không cần AI
 */
export function generateClozeQuestions(text: string, count = 5): QuizQuestion[] {
  const sentences = splitSentences(text);
  if (sentences.length === 0) return [];

  // Thu thập danh sách từ khoá/thuật ngữ trong bài
  const wordFreq: Record<string, number> = {};
  const allTokens: string[] = [];

  for (const s of sentences) {
    const tokens = tokenize(s);
    for (const t of tokens) {
      if (t.length >= 3) {
        wordFreq[t] = (wordFreq[t] || 0) + 1;
        allTokens.push(t);
      }
    }
  }

  // Lọc từ khoá tiềm năng (tần suất từ 2 đến 15)
  const candidateKeywords = Object.entries(wordFreq)
    .filter(([_, freq]) => freq >= 2 && freq <= 15)
    .map(([word]) => word);

  const fallbackKeywords = Object.keys(wordFreq).slice(0, 20);
  const keywordPool = candidateKeywords.length >= 4 ? candidateKeywords : fallbackKeywords;

  const questions: QuizQuestion[] = [];
  const usedSentences = new Set<number>();

  for (let i = 0; i < sentences.length && questions.length < count; i++) {
    const s = sentences[i];
    // Tìm các câu có chứa từ khoá quan trọng hoặc dấu hiệu định nghĩa
    const hasPattern = s.includes(' là ') || s.includes(':') || s.includes(' gọi là ') || s.includes(' bao gồm ');
    if (!hasPattern && Math.random() > 0.4) continue;

    const tokens = tokenize(s);
    // Chọn từ khoá trong câu này có tần suất cao nhất
    let targetWord = '';
    let maxWeight = -1;

    for (const t of tokens) {
      if (keywordPool.includes(t) && (wordFreq[t] || 0) > maxWeight) {
        maxWeight = wordFreq[t] || 0;
        targetWord = t;
      }
    }

    if (!targetWord) continue;

    // Che các khối công thức toán bằng token giữ chỗ trước khi đục lỗ để không làm rách công thức
    const mathTokens: string[] = [];
    const protectedSentence = s.replace(/(\$\$[\s\S]+?\$\$|\\\[[\s\S]+?\\\]|\$[^\$\n]+?\$|\\\([\s\S]+?\\\))/g, (m) => {
      mathTokens.push(m);
      return `__MATH_PLACEHOLDER_${mathTokens.length - 1}__`;
    });

    // Tạo câu hỏi đục lỗ trên phần văn bản an toàn
    const regex = new RegExp(`\\b${targetWord}\\b`, 'i');
    if (!regex.test(protectedSentence)) continue;

    let maskedQuestion = protectedSentence.replace(regex, '[ __________ ]');

    // Khôi phục lại các khối công thức toán vào câu hỏi
    mathTokens.forEach((mStr, mIdx) => {
      maskedQuestion = maskedQuestion.replace(`__MATH_PLACEHOLDER_${mIdx}__`, mStr);
    });

    // Tạo 3 đáp án nhiễu (Distractors) từ keywordPool
    const otherWords = keywordPool.filter(w => w.toLowerCase() !== targetWord.toLowerCase());
    const shuffledOthers = [...otherWords].sort(() => 0.5 - Math.random()).slice(0, 3);

    // Bổ sung từ thay thế nếu thiếu
    while (shuffledOthers.length < 3) {
      shuffledOthers.push(`Khái niệm ${shuffledOthers.length + 1}`);
    }

    // Trộn ngẫu nhiên vị trí đáp án đúng (0 đến 3)
    const correctIndex = Math.floor(Math.random() * 4);
    const options = [...shuffledOthers];
    options.splice(correctIndex, 0, targetWord);

    questions.push({
      id: `q-cloze-${Date.now()}-${questions.length}`,
      question: `Điền thuật ngữ chính xác vào chỗ trống:\n"${maskedQuestion}"`,
      options: options.map(opt => opt.charAt(0).toUpperCase() + opt.slice(1)),
      correctIndex,
      explanation: `Trích từ tài liệu gốc: "${s}"`,
      sourceSnippet: s
    });

    usedSentences.add(i);
  }

  return questions;
}

/**
 * 5. Tự động sinh Flashcard dựa trên mẫu câu định nghĩa
 */
export function generateFlashcardsFromRules(text: string, count = 6): Flashcard[] {
  const sentences = splitSentences(text);
  const flashcards: Flashcard[] = [];

  // Mẫu nhận diện khái niệm: "X là Y", "X: Y", "X bao gồm Y"
  const patterns = [
    { regex: /^(.*?)\s+là\s+(.*)$/i, split: 'là' },
    { regex: /^(.*?):\s+(.*)$/, split: ':' },
    { regex: /^(.*?)\s+được định nghĩa là\s+(.*)$/i, split: 'được định nghĩa là' },
    { regex: /^(.*?)\s+tập trung vào\s+(.*)$/i, split: 'tập trung vào' }
  ];

  for (const s of sentences) {
    if (flashcards.length >= count) break;

    for (const pat of patterns) {
      const match = s.match(pat.regex);
      if (match && match[1] && match[2]) {
        const term = match[1].trim();
        const definition = match[2].trim();

        // Độ dài hợp lý cho thẻ Flashcard
        if (term.length >= 3 && term.length <= 60 && definition.length >= 15) {
          flashcards.push({
            id: `fc-${Date.now()}-${flashcards.length}`,
            front: term,
            back: definition,
            category: 'Định nghĩa trọng tâm'
          });
          break;
        }
      }
    }
  }

  // Nếu không đủ mẫu, dùng thuật toán rút gọn câu đầu tiên của từng đoạn
  if (flashcards.length < 3) {
    const paragraphs = text.split('\n\n').filter(p => p.trim().length > 30);
    for (let i = 0; i < paragraphs.length && flashcards.length < count; i++) {
      const lines = paragraphs[i].trim().split('\n');
      const header = lines[0].replace(/[#*-]/g, '').trim();
      const body = lines.slice(1).join(' ').trim() || lines[0];

      if (header.length > 5 && header.length < 60) {
        flashcards.push({
          id: `fc-fallback-${i}`,
          front: header,
          back: body.slice(0, 250) + (body.length > 250 ? '...' : ''),
          category: 'Trọng tâm bài học'
        });
      }
    }
  }

  return flashcards;
}

/**
 * 6. Trích lục mục lục & Lộ trình học tương tác (Outline & Roadmap)
 */
export function extractOutlineAndRoadmap(pages: { title?: string; text: string }[]): RoadmapStep[] {
  const steps: RoadmapStep[] = [];

  pages.forEach((page, pageIdx) => {
    // Tìm tiêu đề chương/mục trong trang
    const lines = page.text.split('\n').map(l => l.trim()).filter(l => l.length > 0);
    const headingCandidate = lines.find(line => 
      /^(Chương|Phần|Bài|Mục|\d+\.|\#)/i.test(line)
    ) || page.title || `Chương ${pageIdx + 1}`;

    const wordCount = page.text.split(/\s+/).length;
    // Tốc độ đọc ước tính: 200 từ/phút, tối thiểu 2 phút
    const estimatedMinutes = Math.max(2, Math.round(wordCount / 180));

    steps.push({
      id: `step-${pageIdx}`,
      stepNumber: pageIdx + 1,
      title: headingCandidate.replace(/^#+\s*/, ''),
      estimatedMinutes,
      description: lines.slice(1, 3).join(' ') || 'Nghiên cứu nội dung và làm bài tập củng cố.',
      pageIndex: pageIdx,
      isCompleted: false
    });
  });

  return steps;
}
