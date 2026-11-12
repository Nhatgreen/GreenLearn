export type ItemType = 'paper' | 'book' | 'sticky_note' | 'roadmap' | 'exam_sheet' | 'code_block' | 'mind_map' | 'sticker';

export interface PageContent {
  id: string;
  pageNumber: number;
  title?: string;
  text: string;
  image?: string;
  notes?: string;
  highlights?: {
    id: string;
    text: string;
    color: string;
  }[];
}

export interface ExamQuestion {
  id: string;
  question: string;
  options: string[];
  correctAnswer: number;
  explanation?: string;
  type?: 'mcq' | 'true_false' | 'short_answer';
}

export interface ExamSheetData {
  timeLimitMinutes?: number;
  remainingSeconds?: number;
  questions: ExamQuestion[];
  userAnswers: Record<string, number>;
  isGraded?: boolean;
  score?: number;
  totalQuestions?: number;
  teacherNote?: string;
}

export interface DeskItem {
  id: string;
  type: ItemType;
  title: string;
  x: number;
  y: number;
  rotation: number; // in degrees
  scale: number;
  zIndex: number;
  pageCount: number;
  currentPageIndex: number; // for book spread, points to left or current page
  pages: PageContent[];
  colorTheme?: string;
  isBinder?: boolean; // Combined notebook
  sourceDocuments?: { id: string; title: string; pageCount: number }[];
  stickyText?: string;
  stickyColor?: string;
  coverColor?: string; // Rich leather hardcover color preset
  textAlign?: 'left' | 'center' | 'right';
  isBold?: boolean;
  isExamSheet?: boolean;
  examData?: ExamSheetData;
  width?: number;
  height?: number;
  codeLanguage?: string;
  codeSnippet?: string;
  mindMapParentId?: string;
  mindMapColor?: string;
  mindMapShape?: 'pill' | 'rectangle' | 'cloud';
  stickerData?: {
    type: 'emoji' | 'sticker' | 'gif';
    name: string;
    content: string;
    url?: string;
    isSvg?: boolean;
  };
}

export interface IntelineThread {
  id: string;
  sourceItemId: string;
  sourcePageNumber: number;
  selectedText: string;
  sourceOffset?: { x: number; y: number };
  targetStickyId: string;
  question: string;
  answer: string;
  createdAt: string;
}

export interface StudySpace {
  id: string;
  name: string;
  subject: string;
  description: string;
  createdAt: string;
  updatedAt: string;
  lastOpenedAt?: string;
  starred?: boolean;
  items: DeskItem[];
  threads?: IntelineThread[];
}

export type ActiveToolType = 
  | 'cursor' 
  | 'pen' 
  | 'highlighter' 
  | 'smart_shape' 
  | 'eraser' 
  | 'area_eraser' 
  | 'create_note';

export interface DrawingStroke {
  id: string;
  points: { x: number; y: number }[];
  color: string;
  width: number;
  isHighlighter?: boolean;
  attachedToItemId?: string;
}

export interface CanvasTransform {
  x: number;
  y: number;
  scale: number;
  rotation?: number;
}
