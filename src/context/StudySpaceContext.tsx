'use client';

import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import { DeskItem, StudySpace, CanvasTransform, PageContent, IntelineThread, DrawingStroke } from '@/types/studyspace';
import { INITIAL_SPACES } from '@/data/mockSpaces';
import { recognizeSmartShape } from '@/utils/smartShape';
import { useAuth } from '@/hooks/useAuth';
import { StudySpaceService } from '@/services/StudySpaceService';
import { OfflineQueue } from '@/services/OfflineQueue';
import { useRealtimeMultiplayer, PeerUser, DeskAction } from '@/hooks/useRealtimeMultiplayer';

export interface CreationPlacementTemplate {
  itemType?: import('@/types/studyspace').ItemType;
  text?: string;
  color?: string;
  width?: number;
  height?: number;
  typeLabel: string;
  codeSnippet?: string;
  codeLanguage?: string;
  mindMapColor?: string;
  mindMapParentId?: string;
  mindMapShape?: 'pill' | 'rectangle' | 'cloud';
  title?: string;
  coverColor?: string;
  pages?: { title?: string; text: string; image?: string }[];
  stickerData?: {
    type: 'emoji' | 'sticker' | 'gif';
    name: string;
    content: string;
    url?: string;
    isSvg?: boolean;
  };
}

interface StudySpaceContextType {
  spaces: StudySpace[];
  activeSpaceId: string;
  activeSpace: StudySpace;
  threads: IntelineThread[];
  transform: CanvasTransform;
  selectedItemId: string | null;
  searchQuery: string;
  isPanLocked: boolean;
  focusedItemId: string | null;
  isFocusNoticeVisible: boolean;
  enterFocusMode: (itemId: string, itemX: number, itemY: number, width: number, height: number) => void;
  exitFocusMode: () => void;
  triggerFocusNotice: () => void;
  switchSpace: (spaceId: string) => void;
  createSpace: (name: string, subject: string) => void;
  createSpaceFromTemplate?: (templateType: 'blank' | 'midterm' | 'curriculum_exam' | 'group_study', customName?: string) => string;
  setTransform: React.Dispatch<React.SetStateAction<CanvasTransform>>;
  panBy: (dx: number, dy: number) => void;
  zoomBy: (factor: number, originX?: number, originY?: number) => void;
  rotateDeskBy: (deltaDegrees: number, originX?: number, originY?: number) => void;
  resetDeskRotation: () => void;
  resetView: () => void;
  selectItem: (id: string | null) => void;
  updateItemPosition: (id: string, x: number, y: number) => void;
  updateItemDimensions?: (id: string, width: number, height: number) => void;
  updateItemRotation: (id: string, deltaAngle: number) => void;
  updateItemTitle?: (id: string, newTitle: string) => void;
  setItemRotation: (id: string, rotation: number) => void;
  bringToFront: (id: string) => void;
  turnBookPage: (id: string, direction: 'prev' | 'next', maxPages?: number) => void;
  setBookPage: (id: string, pageIndex: number) => void;
  combineIntoBinder: (targetId: string, draggedId: string) => boolean;
  detachPageFromBinder: (bookId: string, pageIndex: number) => void;
  convertPaperToBook?: (paperId: string, coverColor?: string) => void;
  addPageToBook: (bookId: string, pageData?: { title?: string; text?: string; image?: string }) => string;
  tidyUpDesk?: () => void;
  fitAllToScreen?: () => void;
  updateStickyNoteColor?: (id: string, color: string) => void;
  updateBookCoverColor?: (id: string, color: string) => void;
  updateStickyNoteText?: (id: string, text: string) => void;
  updateStickyNoteTextAlign?: (id: string, align: 'left' | 'center' | 'right') => void;
  updateStickyNoteIsBold?: (id: string, isBold: boolean) => void;
  addStickyNote: (text?: string, x?: number, y?: number, color?: string, width?: number, height?: number) => string;
  addBook: (title?: string, x?: number, y?: number, coverColor?: string, initialPages?: { title?: string; text: string; image?: string }[]) => string;
  addUploadedDocument: (title: string, pages: { title?: string; text: string; image?: string }[]) => void;
  addMarketItemToSpace: (spaceId: string, marketItem: any) => void;
  removeDeskItem: (id: string) => void;
  setSearchQuery: (query: string) => void;
  togglePanLock: () => void;
  // Drawing & Note creation tools
  activeTool: import('@/types/studyspace').ActiveToolType;
  setActiveTool: (tool: import('@/types/studyspace').ActiveToolType) => void;
  penColor: string;
  setPenColor: (color: string) => void;
  penWidthLevel: 'small' | 'medium' | 'large';
  setPenWidthLevel: (level: 'small' | 'medium' | 'large') => void;
  stickyCreationColor: string | null;
  setStickyCreationColor: (color: string | null) => void;
  stickyCreationTemplate: CreationPlacementTemplate | null;
  setStickyCreationTemplate: (template: CreationPlacementTemplate | null) => void;
  addCodeBlock: (snippet?: string, x?: number, y?: number, language?: string) => string;
  addMindMapNode: (text?: string, x?: number, y?: number, parentId?: string, color?: string) => string;
  addSticker: (
    sticker: { type: 'emoji' | 'sticker' | 'gif'; name: string; content: string; url?: string; isSvg?: boolean; width?: number; height?: number },
    x?: number,
    y?: number,
    customWidth?: number,
    customHeight?: number
  ) => string;
  updateCodeBlock: (id: string, snippet: string, language?: string) => void;
  updateMindMapNode: (id: string, text: string, color?: string, shape?: 'pill' | 'rectangle' | 'cloud') => void;
  strokes: import('@/types/studyspace').DrawingStroke[];
  currentStroke: import('@/types/studyspace').DrawingStroke | null;
  startStroke: (point: { x: number; y: number }, color: string, width: number, isHighlighter: boolean) => void;
  appendPoint: (point: { x: number; y: number }) => void;
  finishStroke: () => void;
  cancelStroke: () => void;
  isFingerDrawingEnabled: boolean;
  setIsFingerDrawingEnabled: (enabled: boolean) => void;
  addStroke: (stroke: import('@/types/studyspace').DrawingStroke) => void;
  undoStroke: () => void;
  redoStroke: () => void;
  redoStack: import('@/types/studyspace').DrawingStroke[];
  clearStrokes: () => void;
  removeStrokeById: (id: string) => void;
  removeStrokesInBox: (box: { x1: number; y1: number; x2: number; y2: number }) => void;
  updateThreadSourceOffset: (threadId: string, offset: { x: number; y: number }) => void;
  addIntelineThread: (params: {
    sourceItemId: string;
    sourcePageNumber: number;
    selectedText: string;
    question: string;
    answer: string;
    sourceOffset?: { x: number; y: number };
  }) => string;
  isViewRotateMode: boolean;
  setIsViewRotateMode: React.Dispatch<React.SetStateAction<boolean>>;
  addExamSheet: (
    title: string, 
    questions: import('@/types/studyspace').ExamQuestion[], 
    timeLimitMinutes?: number,
    pos?: { x: number; y: number }
  ) => string;
  updateExamAnswer: (itemId: string, questionId: string, answerIdx: number) => void;
  gradeExam: (itemId: string) => void;
  resetExam: (itemId: string) => void;
  saveStatus?: 'idle' | 'saving' | 'saved' | 'error';
  saveCurrentSpaceImmediately: () => Promise<boolean>;
  // Multiplayer Realtime Synchronized State
  multiplayerPeers: PeerUser[];
  isMultiplayerConnected: boolean;
  multiplayerRoomId: string | null;
  isMultiplayerHost: boolean;
  multiplayerPermission: 'view_only' | 'edit';
  setMultiplayerPermission: (perm: 'view_only' | 'edit') => void;
  startHostingRoom: (customRoomId?: string, permission?: 'view_only' | 'edit') => string;
  joinMultiplayerRoom: (roomId: string, permission?: 'view_only' | 'edit') => void;
  leaveMultiplayerRoom: () => void;
  broadcastDeskAction: (action: DeskAction) => void;
  isFollowPresenter: boolean;
  setIsFollowPresenter: (follow: boolean) => void;
}

const DEFAULT_TRANSFORM: CanvasTransform = {
  x: 0,
  y: 0,
  scale: 1,
  rotation: 0
};

const StudySpaceContext = createContext<StudySpaceContextType | null>(null);

export function StudySpaceProvider({ children }: { children: React.ReactNode }) {
  const { user, status, profile } = useAuth();
  const [activeSpaceId, setActiveSpaceId] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const room = params.get('room');
      if (room) return room;
      const space = params.get('space');
      if (space) return space;
      const savedActive = localStorage.getItem('greenlearn_active_space_id') || localStorage.getItem('vitudy_active_space_id');
      if (savedActive) return savedActive;
    }
    return INITIAL_SPACES[0].id;
  });

  const [spaces, setSpaces] = useState<StudySpace[]>(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const room = params.get('room');
      if (room) {
        const roomSpace: StudySpace = {
          id: room,
          name: `Bàn học nhóm (${room.slice(-6).toUpperCase()})`,
          subject: 'Học nhóm trực tuyến',
          description: `Bàn học đồng bộ cùng bạn qua phòng ${room}`,
          items: [],
          threads: [],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
        return [roomSpace, ...INITIAL_SPACES];
      }
    }
    return INITIAL_SPACES;
  });
  const syncedRemoteSpaceRef = useRef<{ items: DeskItem[]; strokes: DrawingStroke[]; spaceName?: string } | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [transform, setTransform] = useState<CanvasTransform>(DEFAULT_TRANSFORM);
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isPanLocked, setIsPanLocked] = useState(false);
  const [maxZIndex, setMaxZIndex] = useState(20);
  const [isViewRotateMode, setIsViewRotateMode] = useState(false);

  // Focus Reading Mode state
  const [focusedItemId, setFocusedItemId] = useState<string | null>(null);
  const [preFocusTransform, setPreFocusTransform] = useState<CanvasTransform | null>(null);
  const [isFocusNoticeVisible, setIsFocusNoticeVisible] = useState(false);
  const focusNoticeTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const triggerFocusNotice = () => {
    setIsFocusNoticeVisible(true);
    if (focusNoticeTimeoutRef.current) {
      clearTimeout(focusNoticeTimeoutRef.current);
    }
    focusNoticeTimeoutRef.current = setTimeout(() => {
      setIsFocusNoticeVisible(false);
    }, 3200);
  };

  const enterFocusMode = (itemId: string, itemX: number, itemY: number, width: number, height: number) => {
    setPreFocusTransform({ ...transform });
    setFocusedItemId(itemId);
    setIsFocusNoticeVisible(false);

    if (typeof window !== 'undefined') {
      const screenW = window.innerWidth;
      const screenH = window.innerHeight;
      // Top margin of ~22px so top edge of book/document sits just slightly below browser top edge
      const topGap = 22;
      const bottomGap = 26;
      const availableH = screenH - (topGap + bottomGap);
      const availableW = screenW - 48; // 24px each side

      // Scale to fit screen height to the maximum extent
      const targetScale = Math.min(availableH / height, availableW / width);
      const scaledW = width * targetScale;

      const targetX = (screenW - scaledW) / 2 - itemX * targetScale;
      const targetY = topGap - itemY * targetScale;

      setTransform({
        x: Math.round(targetX),
        y: Math.round(targetY),
        scale: Number(targetScale.toFixed(3)),
        rotation: 0
      });
    }
  };

  const exitFocusMode = () => {
    setFocusedItemId(null);
    setIsFocusNoticeVisible(false);
    if (preFocusTransform) {
      setTransform(preFocusTransform);
    }
  };

  // Drawing & Note creation tools state
  const [activeTool, setActiveTool] = useState<import('@/types/studyspace').ActiveToolType>('cursor');
  const [penColor, setPenColor] = useState<string>('#2563eb');
  const [penWidthLevel, setPenWidthLevel] = useState<'small' | 'medium' | 'large'>('medium');
  const [stickyCreationColor, setStickyCreationColor] = useState<string | null>(null);
  const [stickyCreationTemplate, setStickyCreationTemplate] = useState<CreationPlacementTemplate | null>(null);
  const [strokes, setStrokes] = useState<import('@/types/studyspace').DrawingStroke[]>([]);
  const [currentStroke, setCurrentStroke] = useState<import('@/types/studyspace').DrawingStroke | null>(null);

  // Multiplayer Realtime Synchronized State & Dispatcher
  const isApplyingRemoteAction = useRef(false);
  const spacesRef = useRef(spaces);
  useEffect(() => {
    spacesRef.current = spaces;
  }, [spaces]);
  const strokesRef = useRef(strokes);
  useEffect(() => {
    strokesRef.current = strokes;
  }, [strokes]);
  const activeSpaceIdRef = useRef(activeSpaceId);
  useEffect(() => {
    activeSpaceIdRef.current = activeSpaceId;
  }, [activeSpaceId]);

  const broadcastDeskActionRef = useRef<(action: DeskAction) => void>(() => {});

  const currentUserName = profile?.display_name 
    || (typeof window !== 'undefined' ? (localStorage.getItem('greenlearn_nickname') || localStorage.getItem('vitudy_nickname')) : '') 
    || (user?.email ? user.email.split('@')[0] : 'Bạn học');

  const handleRemoteDeskAction = useCallback((action: DeskAction) => {
    isApplyingRemoteAction.current = true;
    try {
      const curSpaceId = activeSpaceIdRef.current;
      switch (action.type) {
        case 'ITEM_MOVE': {
          const { id, x, y } = action.payload;
          setSpaces(prev => prev.map(s => {
            if (s.id !== curSpaceId) return s;
            return {
              ...s,
              items: s.items.map(it => it.id === id ? { ...it, x, y } : it)
            };
          }));
          break;
        }
        case 'ITEM_ROTATE': {
          const { id, rotation } = action.payload;
          setSpaces(prev => prev.map(s => {
            if (s.id !== curSpaceId) return s;
            return {
              ...s,
              items: s.items.map(it => it.id === id ? { ...it, rotation } : it)
            };
          }));
          break;
        }
        case 'PAGE_TURN': {
          const { id, pageIndex } = action.payload;
          setSpaces(prev => prev.map(s => {
            if (s.id !== curSpaceId) return s;
            return {
              ...s,
              items: s.items.map(it => it.id === id ? { ...it, currentPageIndex: pageIndex } : it)
            };
          }));
          break;
        }
        case 'ADD_ITEM': {
          const { item } = action.payload;
          setSpaces(prev => prev.map(s => {
            if (s.id !== curSpaceId) return s;
            if (s.items.some(it => it.id === item.id)) return s;
            return {
              ...s,
              items: [...s.items, item]
            };
          }));
          break;
        }
        case 'DELETE_ITEM': {
          const { id } = action.payload;
          setSpaces(prev => prev.map(s => {
            if (s.id !== curSpaceId) return s;
            return {
              ...s,
              items: s.items.filter(it => it.id !== id)
            };
          }));
          break;
        }
        case 'UPDATE_ITEM_TEXT': {
          const { id, text } = action.payload;
          setSpaces(prev => prev.map(s => {
            if (s.id !== curSpaceId) return s;
            return {
              ...s,
              items: s.items.map(it => it.id === id ? { ...it, stickyText: text } : it)
            };
          }));
          break;
        }
        case 'DRAW_STROKE': {
          const { stroke } = action.payload;
          setStrokes(prev => {
            if (prev.some(st => st.id === stroke.id)) return prev;
            return [...prev, stroke];
          });
          break;
        }
        case 'CLEAR_STROKES': {
          setStrokes([]);
          break;
        }
        case 'REMOVE_STROKE': {
          const { id } = action.payload;
          setStrokes(prev => prev.filter(st => st.id !== id));
          break;
        }
        case 'SYNC_SPACE_ITEMS': {
          const { items, spaceName, spaceId: remoteSpaceId } = action.payload as any;
          const targetId = activeSpaceIdRef.current;
          
          if (Array.isArray(items)) {
            syncedRemoteSpaceRef.current = {
              ...(syncedRemoteSpaceRef.current || { strokes: [] }),
              items: [...items],
              spaceName: spaceName || syncedRemoteSpaceRef.current?.spaceName
            };
            setSpaces(prev => {
              const exists = prev.some(s => s.id === targetId);
              const friendlyName = spaceName ? (spaceName.startsWith('Bàn học nhóm') ? spaceName : `Bàn học cùng bạn: ${spaceName}`) : undefined;
              if (exists) {
                return prev.map(s => {
                  if (s.id !== targetId) return s;
                  return {
                    ...s,
                    name: friendlyName || s.name,
                    items: [...items]
                  };
                });
              } else {
                const newSharedSpace: StudySpace = {
                  id: targetId,
                  name: friendlyName || `Bàn học nhóm (${targetId.slice(-6).toUpperCase()})`,
                  subject: 'Học nhóm trực tuyến',
                  description: 'Bàn học được chia sẻ trực tuyến cùng bạn học',
                  items: [...items],
                  threads: [],
                  createdAt: new Date().toISOString(),
                  updatedAt: new Date().toISOString()
                };
                return [newSharedSpace, ...prev];
              }
            });
          }
          break;
        }
        case 'SYNC_SPACE_STROKES': {
          const { strokes: chunkStrokes, isChunk, isFirstChunk } = action.payload as any;
          if (Array.isArray(chunkStrokes)) {
            if (isChunk && !isFirstChunk) {
              setStrokes(prev => {
                const existingIds = new Set(prev.map(s => s.id));
                const newOnly = chunkStrokes.filter(s => !existingIds.has(s.id));
                const merged = [...prev, ...newOnly];
                if (syncedRemoteSpaceRef.current) {
                  syncedRemoteSpaceRef.current.strokes = merged;
                }
                return merged;
              });
            } else {
              setStrokes([...chunkStrokes]);
              if (syncedRemoteSpaceRef.current) {
                syncedRemoteSpaceRef.current.strokes = [...chunkStrokes];
              }
            }
          }
          break;
        }
        case 'SYNC_SPACE_STATE': {
          const { items, strokes: remoteStrokes, spaceName, spaceId: remoteSpaceId } = action.payload as any;
          const targetId = activeSpaceIdRef.current;
          
          if (Array.isArray(items)) {
            syncedRemoteSpaceRef.current = {
              items: [...items],
              strokes: Array.isArray(remoteStrokes) ? [...remoteStrokes] : [],
              spaceName: spaceName || syncedRemoteSpaceRef.current?.spaceName
            };
            setSpaces(prev => {
              const exists = prev.some(s => s.id === targetId);
              const friendlyName = spaceName ? (spaceName.startsWith('Bàn học nhóm') ? spaceName : `Bàn học cùng bạn: ${spaceName}`) : undefined;
              if (exists) {
                return prev.map(s => {
                  if (s.id !== targetId) return s;
                  return {
                    ...s,
                    name: friendlyName || s.name,
                    items: [...items]
                  };
                });
              } else {
                const newSharedSpace: StudySpace = {
                  id: targetId,
                  name: friendlyName || `Bàn học nhóm (${targetId.slice(-6).toUpperCase()})`,
                  subject: 'Học nhóm trực tuyến',
                  description: 'Bàn học được chia sẻ trực tuyến cùng bạn học',
                  items: [...items],
                  threads: [],
                  createdAt: new Date().toISOString(),
                  updatedAt: new Date().toISOString()
                };
                return [newSharedSpace, ...prev];
              }
            });
          }
          if (Array.isArray(remoteStrokes)) {
            setStrokes([...remoteStrokes]);
          }
          break;
        }
      }
    } finally {
      isApplyingRemoteAction.current = false;
    }
  }, []);

  const handleRequestSpaceState = useCallback((requesterId?: string) => {
    const curSpace = spacesRef.current.find(s => s.id === activeSpaceIdRef.current) || spacesRef.current[0];
    const items = curSpace?.items || [];
    const strokes = strokesRef.current || [];
    const spaceName = curSpace?.name || 'Bàn học';
    const spaceId = activeSpaceIdRef.current;

    // 1. Gửi vật thể mặt bàn (luôn nhỏ < 10KB, 100% đến đích ngay lập tức)
    broadcastDeskActionRef.current({
      type: 'SYNC_SPACE_ITEMS',
      payload: {
        targetId: requesterId || 'all',
        spaceId,
        spaceName,
        items
      }
    });

    // 2. Gửi các nét vẽ chia nhỏ (chunked) để không vượt giới hạn 256KB của Supabase Realtime
    if (strokes.length === 0) {
      broadcastDeskActionRef.current({
        type: 'SYNC_SPACE_STROKES',
        payload: {
          targetId: requesterId || 'all',
          strokes: [],
          isChunk: false
        }
      });
    } else {
      const CHUNK_SIZE = 15;
      for (let i = 0; i < strokes.length; i += CHUNK_SIZE) {
        const chunk = strokes.slice(i, i + CHUNK_SIZE);
        const isFirstChunk = i === 0;
        broadcastDeskActionRef.current({
          type: 'SYNC_SPACE_STROKES',
          payload: {
            targetId: requesterId || 'all',
            strokes: chunk,
            isChunk: true,
            isFirstChunk,
            chunkIndex: Math.floor(i / CHUNK_SIZE),
            totalChunks: Math.ceil(strokes.length / CHUNK_SIZE)
          }
        });
      }
    }

    // 3. Gửi SYNC_SPACE_STATE dự phòng cho các client cũ
    broadcastDeskActionRef.current({
      type: 'SYNC_SPACE_STATE',
      payload: {
        targetId: requesterId || 'all',
        spaceId,
        spaceName,
        items,
        strokes: strokes.slice(0, 30)
      }
    });
  }, []);

  const realtimeMultiplayer = useRealtimeMultiplayer({
    spaceId: activeSpaceId,
    currentUserName,
    transform,
    onDeskAction: handleRemoteDeskAction,
    onRequestSpaceState: handleRequestSpaceState
  });

  const {
    peers: multiplayerPeers,
    isConnected: isMultiplayerConnected,
    roomId: multiplayerRoomId,
    isHost: isMultiplayerHost,
    roomPermission: multiplayerPermission,
    setRoomPermission: setMultiplayerPermission,
    startHostingRoom,
    joinRoom: rawJoinMultiplayerRoom,
    leaveRoom: leaveMultiplayerRoom,
    broadcastDeskAction,
    isFollowPresenter,
    setIsFollowPresenter
  } = realtimeMultiplayer;

  const joinMultiplayerRoom = useCallback((roomId: string, permission: 'view_only' | 'edit' = 'view_only') => {
    rawJoinMultiplayerRoom(roomId, permission);
    setActiveSpaceId(roomId);
    setSpaces(prev => {
      const exists = prev.some(s => s.id === roomId);
      if (exists) return prev;
      const roomSpace: StudySpace = {
        id: roomId,
        name: `Bàn học nhóm (${roomId.slice(-6).toUpperCase()})`,
        subject: 'Học nhóm trực tuyến',
        description: `Bàn học đồng bộ cùng bạn qua phòng ${roomId}`,
        items: [],
        threads: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      return [roomSpace, ...prev];
    });
  }, [rawJoinMultiplayerRoom]);

  useEffect(() => {
    broadcastDeskActionRef.current = broadcastDeskAction;
  }, [broadcastDeskAction]);

  // Auto-flush offline queue when back online
  useEffect(() => {
    return OfflineQueue.initAutoFlush();
  }, []);

  const startStroke = (point: { x: number; y: number }, color: string, width: number, isHighlighter: boolean) => {
    setCurrentStroke({
      id: `stroke-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      points: [point],
      color,
      width,
      isHighlighter
    });
  };

  const appendPoint = (point: { x: number; y: number }) => {
    setCurrentStroke(prev => {
      if (!prev) return null;
      return {
        ...prev,
        points: [...prev.points, point]
      };
    });
  };

  const finishStroke = () => {
    setCurrentStroke(prev => {
      if (prev && prev.points.length > 1) {
        let finalPoints = prev.points;
        if (activeTool === 'smart_shape') {
          finalPoints = recognizeSmartShape(prev.points);
        }

        // Check if stroke started over a desk document (book, paper, or sticky note)
        const curSpace = spaces.find(s => s.id === activeSpaceId) || spaces[0];
        const sortedItems = [...(curSpace?.items || [])].sort((a, b) => b.zIndex - a.zIndex);
        const p0 = finalPoints[0];

        let targetItem: import('@/types/studyspace').DeskItem | null = null;
        let localPoints = finalPoints;

        for (const item of sortedItems) {
          const w = item.type === 'book' ? 980 : item.type === 'paper' ? (item.isExamSheet ? 380 : 360) : (item.width || 220);
          const h = item.type === 'book' ? 640 : item.type === 'paper' ? (item.isExamSheet ? 490 : 500) : (item.height || 200);

          const dx = p0.x - item.x;
          const dy = p0.y - item.y;
          const rad = (-item.rotation * Math.PI) / 180;
          const localX = dx * Math.cos(rad) - dy * Math.sin(rad);
          const localY = dx * Math.sin(rad) + dy * Math.cos(rad);

          if (localX >= -10 && localX <= w + 10 && localY >= -10 && localY <= h + 10) {
            targetItem = item;
            localPoints = finalPoints.map(p => {
              const pdx = p.x - item.x;
              const pdy = p.y - item.y;
              return {
                x: Math.round((pdx * Math.cos(rad) - pdy * Math.sin(rad)) * 10) / 10,
                y: Math.round((pdx * Math.sin(rad) + pdy * Math.cos(rad)) * 10) / 10
              };
            });
            break;
          }
        }

        const completedStroke: import('@/types/studyspace').DrawingStroke = targetItem
          ? { ...prev, points: localPoints, attachedToItemId: targetItem.id }
          : { ...prev, points: finalPoints, attachedToItemId: undefined };

        setStrokes(s => [...s, completedStroke]);
        if (!isApplyingRemoteAction.current) {
          broadcastDeskActionRef.current({ type: 'DRAW_STROKE', payload: { stroke: completedStroke } });
        }
      }
      return null;
    });
  };

  const cancelStroke = () => {
    setCurrentStroke(null);
  };

  const [isFingerDrawingEnabled, setIsFingerDrawingEnabledState] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('greenlearn_finger_drawing_enabled');
      if (saved !== null) return saved === 'true';
    }
    return true;
  });

  const setIsFingerDrawingEnabled = (enabled: boolean) => {
    setIsFingerDrawingEnabledState(enabled);
    if (typeof window !== 'undefined') {
      localStorage.setItem('greenlearn_finger_drawing_enabled', String(enabled));
    }
  };

  const [redoStack, setRedoStack] = useState<import('@/types/studyspace').DrawingStroke[]>([]);

  const addStroke = (stroke: import('@/types/studyspace').DrawingStroke) => {
    setStrokes(prev => [...prev, stroke]);
    setRedoStack([]); // reset redo on new stroke
    if (!isApplyingRemoteAction.current) {
      broadcastDeskActionRef.current({ type: 'DRAW_STROKE', payload: { stroke } });
    }
  };

  const undoStroke = () => {
    setStrokes(prev => {
      if (prev.length === 0) return prev;
      const last = prev[prev.length - 1];
      setRedoStack(r => [...r, last]);
      return prev.slice(0, -1);
    });
  };

  const redoStroke = () => {
    setRedoStack(prev => {
      if (prev.length === 0) return prev;
      const nextStroke = prev[prev.length - 1];
      setStrokes(s => [...s, nextStroke]);
      return prev.slice(0, -1);
    });
  };

  const clearStrokes = () => {
    setStrokes([]);
    setRedoStack([]);
    if (!isApplyingRemoteAction.current) {
      broadcastDeskActionRef.current({ type: 'CLEAR_STROKES' });
    }
  };

  const removeStrokeById = (id: string) => {
    setStrokes(prev => prev.filter(s => s.id !== id));
    if (!isApplyingRemoteAction.current) {
      broadcastDeskActionRef.current({ type: 'REMOVE_STROKE', payload: { id } });
    }
  };

  const removeStrokesInBox = (box: { x1: number; y1: number; x2: number; y2: number }) => {
    const minX = Math.min(box.x1, box.x2);
    const maxX = Math.max(box.x1, box.x2);
    const minY = Math.min(box.y1, box.y2);
    const maxY = Math.max(box.y1, box.y2);

    const curSpace = spaces.find(s => s.id === activeSpaceId) || spaces[0];

    setStrokes(prev => prev.filter(stroke => {
      if (stroke.attachedToItemId) {
        const item = curSpace?.items.find(i => i.id === stroke.attachedToItemId);
        if (item) {
          const rad = (item.rotation * Math.PI) / 180;
          const isInside = stroke.points.some(p => {
            const wx = item.x + p.x * Math.cos(rad) - p.y * Math.sin(rad);
            const wy = item.y + p.x * Math.sin(rad) + p.y * Math.cos(rad);
            return wx >= minX && wx <= maxX && wy >= minY && wy <= maxY;
          });
          return !isInside;
        }
      }
      const isInside = stroke.points.some(p => p.x >= minX && p.x <= maxX && p.y >= minY && p.y <= maxY);
      return !isInside;
    }));
  };

  const updateThreadSourceOffset = (threadId: string, offset: { x: number; y: number }) => {
    setSpaces(sList =>
      sList.map(s => {
        if (s.id !== activeSpaceId) return s;
        return {
          ...s,
          threads: (s.threads || []).map(t =>
            t.id === threadId ? { ...t, sourceOffset: offset } : t
          )
        };
      })
    );
  };

  // Deep NFC normalization & Zero-Emoji sanitizer for persistent storage safety (preserving all spaces, tabs & newlines)
  const removeEmojis = (str: string) => str.replace(/([\uD83C-\uDBFF\uDC00-\uDFFF]+|[\u2600-\u27BF])/g, '');
  const normalizeNFC = (text: string) => (text ? removeEmojis(text.normalize('NFC')) : '');

  // Load spaces on startup from Supabase Cloud (when authenticated) or localStorage (guest)
  useEffect(() => {
    // 1. Đọc không gian đã lưu từ localStorage trước để đảm bảo dữ liệu không bị mất khi reload
    let localSpaces: StudySpace[] | null = null;
    let localActiveId: string | null = null;

    try {
      const saved = localStorage.getItem('greenlearn_spaces') || localStorage.getItem('vitudy_spaces');
      localActiveId = localStorage.getItem('greenlearn_active_space_id') || localStorage.getItem('vitudy_active_space_id');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const deepNormalize = (data: any): any => {
            if (typeof data === 'string') return normalizeNFC(data);
            if (Array.isArray(data)) return data.map(deepNormalize);
            if (data && typeof data === 'object') {
              const res: any = {};
              for (const k of Object.keys(data)) {
                res[k] = deepNormalize(data[k]);
              }
              return res;
            }
            return data;
          };
          localSpaces = deepNormalize(parsed);
        }
      }
    } catch {
      // fallback
    }

    // Đọc URL param ?space=XYZ và ?room=XYZ nếu có
    let urlSpaceId: string | null = null;
    let urlRoomId: string | null = null;
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      urlSpaceId = params.get('space');
      urlRoomId = params.get('room');
    }

    const resolveTargetSpaceId = (spaceList: StudySpace[]) => {
      if (urlSpaceId && spaceList.some(s => s.id === urlSpaceId)) return urlSpaceId;
      if (urlRoomId) {
        const found = spaceList.find(s => s.id === urlRoomId || s.id === `shared-${urlRoomId}`);
        const cached = syncedRemoteSpaceRef.current;
        const currentRoomSpace = spacesRef.current.find(s => s.id === urlRoomId);

        if (found) {
          if (cached?.items && cached.items.length > 0) {
            found.items = cached.items;
          }
          if (cached?.spaceName) {
            found.name = `Bàn học cùng bạn: ${cached.spaceName}`;
          }
          return found.id;
        }

        // Nếu chưa có, giữ lại không gian bàn học nhóm đã được sync từ Host
        const newSharedSpace: StudySpace = {
          id: urlRoomId,
          name: cached?.spaceName ? `Bàn học cùng bạn: ${cached.spaceName}` : (currentRoomSpace?.name || `Bàn học nhóm (${urlRoomId.slice(-6).toUpperCase()})`),
          subject: 'Học nhóm trực tuyến',
          description: `Bàn học đồng bộ cùng bạn qua phòng ${urlRoomId}`,
          items: cached?.items || currentRoomSpace?.items || [],
          threads: [],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
        spaceList.unshift(newSharedSpace);
        return newSharedSpace.id;
      }
      if (localActiveId && spaceList.some(s => s.id === localActiveId)) return localActiveId;
      return spaceList[0]?.id || 'default';
    };

    if (status === 'authenticated' && user?.id) {
      StudySpaceService.loadSpaces(user.id).then((cloudSpaces) => {
        const list = (cloudSpaces && cloudSpaces.length > 0) 
          ? [...cloudSpaces] 
          : ((localSpaces && localSpaces.length > 0) ? [...localSpaces] : []);

        if (list.length > 0) {
          const targetId = resolveTargetSpaceId(list);
          setSpaces([...list]);
          setActiveSpaceId(targetId);
          if (localSpaces && localSpaces.length > 0 && (!cloudSpaces || cloudSpaces.length === 0)) {
            localSpaces.forEach(s => StudySpaceService.saveSpace(s, user.id).catch(() => {}));
          }
        } else {
          // Tài khoản mới chưa có bàn học -> Khởi tạo bàn học mẫu Demo
          import('@/data/demoSpace').then(({ createDemoStudySpace }) => {
            const demoSpace = createDemoStudySpace(user.id);
            const demoList = [demoSpace];
            const targetId = resolveTargetSpaceId(demoList);
            setSpaces([...demoList]);
            setActiveSpaceId(targetId);
            StudySpaceService.saveSpace(demoSpace, user.id).catch(() => {});
          });
        }
        if (syncedRemoteSpaceRef.current?.strokes && syncedRemoteSpaceRef.current.strokes.length > 0) {
          setStrokes(syncedRemoteSpaceRef.current.strokes);
        }
        setIsLoaded(true);
      });
      return;
    }

    // Khi là khách (Guest)
    const guestList = (localSpaces && localSpaces.length > 0) ? [...localSpaces] : [...INITIAL_SPACES];
    const targetId = resolveTargetSpaceId(guestList);
    setSpaces([...guestList]);
    setActiveSpaceId(targetId);
    if (syncedRemoteSpaceRef.current?.strokes && syncedRemoteSpaceRef.current.strokes.length > 0) {
      setStrokes(syncedRemoteSpaceRef.current.strokes);
    }
    setIsLoaded(true);
  }, [status, user?.id]);

  // Kiểm tra liên tục nếu URL thay đổi ?space=XYZ
  useEffect(() => {
    if (typeof window !== 'undefined' && isLoaded) {
      const params = new URLSearchParams(window.location.search);
      const urlSpaceId = params.get('space');
      if (urlSpaceId && spaces.some(s => s.id === urlSpaceId) && activeSpaceId !== urlSpaceId) {
        setActiveSpaceId(urlSpaceId);
      }
    }
  }, [isLoaded, spaces, activeSpaceId]);

  // Kiểm tra nếu có tài liệu Chợ vừa thêm cần mở trên bàn học
  useEffect(() => {
    if (isLoaded && activeSpaceId) {
      try {
        const pendingDocStr = localStorage.getItem('greenlearn_pending_market_item') || localStorage.getItem('vitudy_pending_market_item');
        if (pendingDocStr) {
          const pendingItem = JSON.parse(pendingDocStr);
          localStorage.removeItem('greenlearn_pending_market_item');
          localStorage.removeItem('vitudy_pending_market_item');
          if (pendingItem.type === 'exam' && pendingItem.examQuestions) {
            addExamSheet(pendingItem.title, pendingItem.examQuestions, 20);
          } else {
            addUploadedDocument(pendingItem.title, pendingItem.pages || [{ title: pendingItem.title, text: pendingItem.summary }]);
          }
        }
      } catch {
        // ignore
      }
    }
  }, [isLoaded, activeSpaceId]);

  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');

  const saveCurrentSpaceImmediately = useCallback(async (): Promise<boolean> => {
    if (!isLoaded) return false;
    const curSpace = spaces.find(s => s.id === activeSpaceId) || spaces[0];
    if (!curSpace) return false;

    try {
      localStorage.setItem('greenlearn_spaces', JSON.stringify(spaces));
      localStorage.setItem('greenlearn_active_space_id', activeSpaceId);
      localStorage.setItem(`greenlearn_strokes_${activeSpaceId}`, JSON.stringify(strokes));
    } catch {}

    if (status === 'authenticated' && user?.id) {
      setSaveStatus('saving');
      try {
        await Promise.all([
          StudySpaceService.saveSpace(curSpace, user.id),
          StudySpaceService.upsertItems(curSpace.id, curSpace.items),
          curSpace.threads && curSpace.threads.length > 0 
            ? StudySpaceService.saveThreads(curSpace.id, curSpace.threads) 
            : Promise.resolve(),
          StudySpaceService.saveStrokes(curSpace.id, strokes, user.id)
        ]);
        setSaveStatus('saved');
        setTimeout(() => setSaveStatus('idle'), 2500);
        return true;
      } catch (err) {
        console.warn('Lỗi lưu cloud:', err);
        setSaveStatus('error');
        setTimeout(() => setSaveStatus('idle'), 3500);
        return false;
      }
    } else {
      setSaveStatus('saved');
      setTimeout(() => setSaveStatus('idle'), 2000);
      return true;
    }
  }, [isLoaded, spaces, activeSpaceId, strokes, status, user?.id]);

  // Save spaces to localStorage & Supabase Cloud (chỉ lưu sau khi isLoaded === true để tránh ghi đè)
  useEffect(() => {
    if (!isLoaded) return;
    const timer = setTimeout(() => {
      saveCurrentSpaceImmediately();
    }, 600);
    return () => clearTimeout(timer);
  }, [spaces, strokes, saveCurrentSpaceImmediately, isLoaded]);

  const activeSpace = spaces.find(s => s.id === activeSpaceId) || spaces[0];

  const switchSpace = (spaceId: string) => {
    if (spaces.some(s => s.id === spaceId)) {
      setActiveSpaceId(spaceId);
      setSelectedItemId(null);
      resetView();
    }
  };

  const createSpace = (name: string, subject: string) => {
    const newSpaceId = typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `space-${Date.now()}`;
    const newSpace: StudySpace = {
      id: newSpaceId,
      name,
      subject,
      description: `Không gian học tập bộ môn ${subject}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      items: []
    };
    if (status === 'authenticated' && user?.id) {
      StudySpaceService.saveSpace(newSpace, user.id);
    }
    setSpaces(prev => [...prev, newSpace]);
    setActiveSpaceId(newSpace.id);
  };

  const createSpaceFromTemplate = (templateType: 'blank' | 'midterm' | 'curriculum_exam' | 'group_study', customName?: string): string => {
    const newSpaceId = typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `space-${Date.now()}`;
    let name = customName || 'Bàn học mới';
    let subject = 'Học tập';
    let items: DeskItem[] = [];

    if (templateType === 'blank') {
      name = customName || 'Bàn học trống';
      subject = 'Tự do';
      items = [];
    } else if (templateType === 'midterm') {
      name = customName || 'Ôn thi giữa kỳ';
      subject = 'Ôn tập';
      items = [
        {
          id: `book-${Date.now()}`,
          type: 'book',
          title: 'Giáo trình Ôn Thi Giữa Kỳ',
          x: 160,
          y: 80,
          rotation: 0,
          scale: 1,
          zIndex: 10,
          pageCount: 4,
          currentPageIndex: 0,
          colorTheme: '#5c3920',
          isBinder: false,
          pages: [
            {
              id: 'p-mid-1',
              pageNumber: 1,
              title: 'Chương 1: Trọng tâm lý thuyết',
              text: 'Tổng hợp các định lý, công thức và bài toán điển hình trong đề thi giữa kỳ.\n\n• Định nghĩa và điều kiện áp dụng\n• Các bước biến đổi và ví dụ minh họa'
            },
            {
              id: 'p-mid-2',
              pageNumber: 2,
              title: 'Chương 2: Dạng bài tập tính toán',
              text: 'Phương pháp giải nhanh trắc nghiệm và tự luận các dạng bài thường gặp.'
            }
          ]
        },
        {
          id: `note-${Date.now()}`,
          type: 'sticky_note',
          title: 'Ghi chú ôn thi',
          x: 1120,
          y: 100,
          rotation: 0,
          scale: 1,
          zIndex: 15,
          pageCount: 1,
          currentPageIndex: 0,
          stickyColor: '#fef08a',
          stickyText: 'Lưu ý ôn kỹ: Nhớ giải lại các bài tập trắc nghiệm mẫu trước ngày thi!',
          pages: []
        }
      ];
    } else if (templateType === 'curriculum_exam') {
      name = customName || 'Giáo trình + đề thi';
      subject = 'Luyện đề';
      items = [
        {
          id: `paper-theory-${Date.now()}`,
          type: 'paper',
          title: 'Tờ Tóm Tắt Giáo Trình',
          x: 140,
          y: 80,
          rotation: 0,
          scale: 1,
          zIndex: 11,
          pageCount: 1,
          currentPageIndex: 0,
          colorTheme: '#047857',
          isBinder: false,
          pages: [
            {
              id: 'p-theory-1',
              pageNumber: 1,
              title: 'Tóm Tắt Giáo Trình',
              text: 'Các công thức cốt lõi và định nghĩa trọng tâm cần tra cứu nhanh khi giải đề.'
            }
          ]
        },
        {
          id: `paper-exam-${Date.now()}`,
          type: 'paper',
          title: 'Đề Thi Thử Tốt Nghiệp & Học Phần',
          x: 640,
          y: 80,
          rotation: 0,
          scale: 1,
          zIndex: 12,
          pageCount: 1,
          currentPageIndex: 0,
          colorTheme: '#0284c7',
          isBinder: false,
          pages: [
            {
              id: 'p-exam-1',
              pageNumber: 1,
              title: 'Đề Thi Thử',
              text: 'Câu 1: Cho hàm số f(x). Khẳng định nào sau đây đúng?\nA. Đạo hàm bằng 0 tại cực trị\nB. f(x) luôn đồng biến\nC. f(x) không liên tục'
            }
          ]
        },
        {
          id: `note-${Date.now()}`,
          type: 'sticky_note',
          title: 'Nháp làm bài',
          x: 1100,
          y: 120,
          rotation: 0,
          scale: 1,
          zIndex: 15,
          pageCount: 1,
          currentPageIndex: 0,
          stickyColor: '#fef08a',
          stickyText: 'Bấm nút STudy trên tờ đề thi để tự động chấm điểm và xem lời giải chi tiết!',
          pages: []
        }
      ];
    } else if (templateType === 'group_study') {
      name = customName || 'Học nhóm';
      subject = 'Học nhóm';
      items = [
        {
          id: `book-group-${Date.now()}`,
          type: 'book',
          title: 'Tài Liệu Thảo Luận Nhóm',
          x: 160,
          y: 80,
          rotation: 0,
          scale: 1,
          zIndex: 10,
          pageCount: 4,
          currentPageIndex: 0,
          colorTheme: '#5c3920',
          isBinder: false,
          pages: [
            {
              id: 'p-group-1',
              pageNumber: 1,
              title: 'Chương 1: Đề tài nghiên cứu nhóm',
              text: 'Phân công nhiệm vụ nhóm:\n• Bạn 1: Đọc và tóm tắt lý thuyết\n• Bạn 2: Thu thập dữ liệu và lập trình mô hình\n• Bạn 3: Thiết kế slide thuyết trình'
            }
          ]
        },
        {
          id: `note-group-1-${Date.now()}`,
          type: 'sticky_note',
          title: 'Ý kiến bạn A',
          x: 1120,
          y: 100,
          rotation: 0,
          scale: 1,
          zIndex: 15,
          pageCount: 1,
          currentPageIndex: 0,
          stickyColor: '#fed7aa',
          stickyText: 'Đã hoàn thành phần phân tích dữ liệu, mọi người xem lại nhé!',
          pages: []
        }
      ];
    }

    const newSpace: StudySpace = {
      id: newSpaceId,
      name,
      subject,
      description: `Bàn học ${name}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      items
    };

    if (status === 'authenticated' && user?.id) {
      StudySpaceService.saveSpace(newSpace, user.id);
    }
    try {
      const updatedSpaces = [...spaces, newSpace];
      localStorage.setItem('greenlearn_spaces', JSON.stringify(updatedSpaces));
      localStorage.setItem('greenlearn_active_space_id', newSpaceId);
    } catch {
      // ignore
    }
    setSpaces(prev => [...prev, newSpace]);
    setActiveSpaceId(newSpace.id);
    resetView();
    return newSpaceId;
  };

  const panBy = (dx: number, dy: number) => {
    if (focusedItemId) {
      triggerFocusNotice();
      return;
    }
    if (isPanLocked) return;
    setTransform(prev => ({
      ...prev,
      x: Math.round(prev.x + dx),
      y: Math.round(prev.y + dy)
    }));
  };

  const zoomBy = (factor: number, originX?: number, originY?: number) => {
    setTransform(prev => {
      const newScale = Math.min(Math.max(Number((prev.scale * factor).toFixed(3)), 0.4), 2.5);
      if (Math.abs(newScale - prev.scale) < 0.0005) return prev;
      if (originX === undefined || originY === undefined) {
        return { ...prev, scale: newScale };
      }
      // Zoom centered on pointer with pixel-grid integer snapping
      const scaleChange = newScale / prev.scale;
      const newX = Math.round(originX - (originX - prev.x) * scaleChange);
      const newY = Math.round(originY - (originY - prev.y) * scaleChange);
      return { x: newX, y: newY, scale: newScale };
    });
  };

  const rotateDeskBy = (deltaDegrees: number, originX?: number, originY?: number) => {
    if (focusedItemId) {
      triggerFocusNotice();
      return;
    }
    if (isPanLocked) return;
    setTransform(prev => {
      const curRot = prev.rotation || 0;
      let newRot = curRot + deltaDegrees;

      // Normalize to (-180, 180]
      while (newRot > 180) newRot -= 360;
      while (newRot <= -180) newRot += 360;

      // Magnetic snap to 0 if within +/- 2.5 degrees
      if (Math.abs(newRot) < 2.5) {
        newRot = 0;
      }

      const effectiveDelta = newRot - curRot;
      if (Math.abs(effectiveDelta) < 0.0001) {
        return { ...prev, rotation: newRot };
      }

      // Pivot around given origin or window center
      const cx = originX !== undefined ? originX : (typeof window !== 'undefined' ? window.innerWidth / 2 : 0);
      const cy = originY !== undefined ? originY : (typeof window !== 'undefined' ? window.innerHeight / 2 : 0);

      const vx = cx - prev.x;
      const vy = cy - prev.y;
      const rad = (effectiveDelta * Math.PI) / 180;

      const unrotVx = vx * Math.cos(rad) - vy * Math.sin(rad);
      const unrotVy = vx * Math.sin(rad) + vy * Math.cos(rad);

      const newX = Math.round(cx - unrotVx);
      const newY = Math.round(cy - unrotVy);

      return {
        ...prev,
        x: newX,
        y: newY,
        rotation: Number(newRot.toFixed(2))
      };
    });
  };

  const resetDeskRotation = () => {
    setTransform(prev => {
      if (!prev.rotation) return prev;
      const curRot = prev.rotation;
      const effectiveDelta = -curRot;
      const cx = typeof window !== 'undefined' ? window.innerWidth / 2 : 0;
      const cy = typeof window !== 'undefined' ? window.innerHeight / 2 : 0;
      const vx = cx - prev.x;
      const vy = cy - prev.y;
      const rad = (effectiveDelta * Math.PI) / 180;
      const unrotVx = vx * Math.cos(rad) - vy * Math.sin(rad);
      const unrotVy = vx * Math.sin(rad) + vy * Math.cos(rad);
      return {
        ...prev,
        x: Math.round(cx - unrotVx),
        y: Math.round(cy - unrotVy),
        rotation: 0
      };
    });
  };

  const resetView = () => {
    setTransform(DEFAULT_TRANSFORM);
  };

  const selectItem = (id: string | null) => {
    setSelectedItemId(id);
    if (id) bringToFront(id);
  };

  const bringToFront = (id: string) => {
    setMaxZIndex(prev => {
      const nextZ = prev + 1;
      setSpaces(sList =>
        sList.map(s => {
          if (s.id !== activeSpaceId) return s;
          return {
            ...s,
            items: s.items.map(item => (item.id === id ? { ...item, zIndex: nextZ } : item))
          };
        })
      );
      return nextZ;
    });
  };

  const updateItemPosition = (id: string, x: number, y: number) => {
    setSpaces(sList =>
      sList.map(s => {
        if (s.id !== activeSpaceId) return s;
        return {
          ...s,
          items: s.items.map(item => (item.id === id ? { ...item, x, y } : item))
        };
      })
    );
    if (!isApplyingRemoteAction.current) {
      broadcastDeskActionRef.current({ type: 'ITEM_MOVE', payload: { id, x, y } });
    }
  };

  const updateItemDimensions = (id: string, width: number, height: number) => {
    setSpaces(sList =>
      sList.map(s => {
        if (s.id !== activeSpaceId) return s;
        return {
          ...s,
          items: s.items.map(item => (item.id === id ? { ...item, width, height } : item))
        };
      })
    );
  };

  const updateItemTitle = (id: string, newTitle: string) => {
    setSpaces(sList =>
      sList.map(s => {
        if (s.id !== activeSpaceId) return s;
        return {
          ...s,
          items: s.items.map(item =>
            item.id === id ? { ...item, title: normalizeNFC(newTitle) } : item
          )
        };
      })
    );
  };

  const updateStickyNoteText = (id: string, text: string) => {
    const normalized = text.normalize('NFC');
    setSpaces(sList =>
      sList.map(s => {
        if (s.id !== activeSpaceId) return s;
        return {
          ...s,
          items: s.items.map(item =>
            item.id === id ? { ...item, stickyText: normalized } : item
          )
        };
      })
    );
    if (!isApplyingRemoteAction.current) {
      broadcastDeskActionRef.current({
        type: 'UPDATE_ITEM_TEXT',
        payload: { id, text: normalized }
      });
    }
  };

  const updateStickyNoteColor = (id: string, color: string) => {
    setSpaces(sList =>
      sList.map(s => {
        if (s.id !== activeSpaceId) return s;
        return {
          ...s,
          items: s.items.map(item =>
            item.id === id ? { ...item, stickyColor: color } : item
          )
        };
      })
    );
  };

  const updateBookCoverColor = (id: string, color: string) => {
    setSpaces(sList =>
      sList.map(s => {
        if (s.id !== activeSpaceId) return s;
        return {
          ...s,
          items: s.items.map(item =>
            item.id === id ? { ...item, coverColor: color } : item
          )
        };
      })
    );
  };

  const updateStickyNoteTextAlign = (id: string, align: 'left' | 'center' | 'right') => {
    setSpaces(sList =>
      sList.map(s => {
        if (s.id !== activeSpaceId) return s;
        return {
          ...s,
          items: s.items.map(item =>
            item.id === id ? { ...item, textAlign: align } : item
          )
        };
      })
    );
  };

  const updateStickyNoteIsBold = (id: string, isBold: boolean) => {
    setSpaces(sList =>
      sList.map(s => {
        if (s.id !== activeSpaceId) return s;
        return {
          ...s,
          items: s.items.map(item =>
            item.id === id ? { ...item, isBold } : item
          )
        };
      })
    );
  };

  // Convert a loose paper sheet into a bound book with a leather cover
  const convertPaperToBook = (paperId: string, coverColor = 'brown') => {
    setSpaces(sList =>
      sList.map(s => {
        if (s.id !== activeSpaceId) return s;
        return {
          ...s,
          items: s.items.map(item => {
            if (item.id !== paperId) return item;
            return {
              ...item,
              type: 'book' as const,
              coverColor,
              colorTheme: coverColor
            };
          })
        };
      })
    );
  };

  const addMarketItemToSpace = (spaceId: string, marketItem: any) => {
    let newItem: DeskItem;
    if (marketItem.type === 'exam' && marketItem.examQuestions && marketItem.examQuestions.length > 0) {
      newItem = {
        id: `exam-${Date.now()}`,
        type: 'paper',
        title: normalizeNFC(marketItem.title),
        x: 380 + Math.random() * 40,
        y: 160 + Math.random() * 40,
        rotation: 0,
        scale: 1,
        zIndex: maxZIndex + 2,
        pageCount: 1,
        currentPageIndex: 0,
        isExamSheet: true,
        stickyColor: '#bae6fd',
        width: 380,
        height: 490,
        examData: {
          timeLimitMinutes: 20,
          remainingSeconds: 20 * 60,
          questions: marketItem.examQuestions,
          userAnswers: {},
          isGraded: false,
          totalQuestions: marketItem.examQuestions.length
        },
        pages: [
          {
            id: `p-exam-market-${Date.now()}`,
            pageNumber: 1,
            title: normalizeNFC(marketItem.title),
            text: normalizeNFC(`${marketItem.summary || ''}\n\n${marketItem.previewText || ''}`)
          }
        ]
      };
    } else {
      const isBook = marketItem.type === 'book';
      const rawPages = marketItem.pages && marketItem.pages.length > 0
        ? marketItem.pages
        : [
            {
              title: marketItem.title,
              text: `${marketItem.summary || ''}\n\n${marketItem.previewText || ''}\n\n[Tài liệu đã mở từ tác giả ${marketItem.author || 'GreenLearn'}]`
            }
          ];
      
      const pages: PageContent[] = rawPages.map((p: any, idx: number) => ({
        id: `p-${Date.now()}-${idx}`,
        pageNumber: idx + 1,
        title: normalizeNFC(p.title || `Trang ${idx + 1}`),
        text: normalizeNFC(p.text || ''),
        image: p.image
      }));

      newItem = {
        id: `doc-${Date.now()}`,
        type: isBook ? 'book' : 'paper',
        title: normalizeNFC(marketItem.title),
        x: 320 + Math.random() * 60,
        y: 180 + Math.random() * 40,
        rotation: 0,
        scale: 1,
        zIndex: maxZIndex + 1,
        pageCount: pages.length,
        currentPageIndex: 0,
        pages,
        colorTheme: isBook ? '#15803D' : '#16A34A'
      };
    }

    setSpaces(sList =>
      sList.map(s => {
        if (s.id !== spaceId) return s;
        return {
          ...s,
          lastOpenedAt: new Date().toISOString(),
          items: [...s.items, newItem]
        };
      })
    );

    setActiveSpaceId(spaceId);
  };

  const tidyUpDesk = () => {
    setSpaces(sList =>
      sList.map(s => {
        if (s.id !== activeSpaceId) return s;

        const books = s.items.filter(i => i.type === 'book');
        const papers = s.items.filter(i => i.type === 'paper');
        const notes = s.items.filter(i => i.type === 'sticky_note');
        const others = s.items.filter(i => i.type !== 'book' && i.type !== 'paper' && i.type !== 'sticky_note');

        // Central Book(s)
        let bookOffset = 0;
        const arrangedBooks = books.map(b => {
          const item = { ...b, x: 120 + bookOffset, y: 80, rotation: 0 };
          bookOffset += 1020;
          return item;
        });

        // Papers on the right
        let paperOffsetY = 80;
        const arrangedPapers = papers.map(p => {
          const item = { ...p, x: 1160, y: paperOffsetY, rotation: 0 };
          paperOffsetY += 520;
          return item;
        });

        // Sticky Notes placed neatly on the left in a 2-column grid
        let noteOffsetY = 80;
        const arrangedNotes = notes.map((n, idx) => {
          const col = idx % 2;
          const row = Math.floor(idx / 2);
          const item = {
            ...n,
            x: -160 - (col * 240),
            y: noteOffsetY + (row * 220),
            rotation: 0
          };
          return item;
        });

        return {
          ...s,
          items: [...arrangedBooks, ...arrangedPapers, ...arrangedNotes, ...others]
        };
      })
    );

    // Center camera comfortably
    setTransform({
      x: 350,
      y: 120,
      scale: 0.72
    });
  };

  const fitAllToScreen = () => {
    const items = activeSpace.items;
    const winW = typeof window !== 'undefined' ? window.innerWidth : 1200;
    const winH = typeof window !== 'undefined' ? (window.visualViewport ? window.visualViewport.height : window.innerHeight) : 800;

    if (items.length === 0) {
      setTransform({
        x: Math.round(winW / 2),
        y: Math.round(winH / 2),
        scale: 1,
        rotation: 0
      });
      return;
    }

    const minX = Math.min(...items.map(i => i.x));
    const maxX = Math.max(...items.map(i => i.x + (i.type === 'book' ? (i.width || 980) : i.type === 'paper' ? (i.width || 480) : (i.width || 240))));
    const minY = Math.min(...items.map(i => i.y));
    const maxY = Math.max(...items.map(i => i.y + (i.type === 'book' ? (i.height || 640) : i.type === 'paper' ? (i.height || 640) : (i.height || 220))));

    const contentW = Math.max(maxX - minX, 320);
    const contentH = Math.max(maxY - minY, 240);

    // Responsive padding based on viewport dimensions
    const padX = winW < 640 ? 20 : winW < 1024 ? 40 : 100;
    const padY = winH < 640 ? 30 : winH < 1024 ? 50 : 100;

    const availW = Math.max(winW - padX * 2, 200);
    const availH = Math.max(winH - padY * 2, 200);

    const scale = Math.min(availW / contentW, availH / contentH, 1.0);
    const clampedScale = Math.max(0.25, Math.min(scale, 1.0));

    const cx = (minX + maxX) / 2;
    const cy = (minY + maxY) / 2;

    setTransform({
      x: Math.round(winW / 2 - cx * clampedScale),
      y: Math.round(winH / 2 - cy * clampedScale),
      scale: clampedScale,
      rotation: 0
    });
  };

  const updateItemRotation = (id: string, deltaAngle: number) => {
    setSpaces(sList =>
      sList.map(s => {
        if (s.id !== activeSpaceId) return s;
        return {
          ...s,
          items: s.items.map(item =>
            item.id === id ? { ...item, rotation: (item.rotation + deltaAngle) % 360 } : item
          )
        };
      })
    );
  };

  const setItemRotation = (id: string, rotation: number) => {
    const normalized = ((rotation % 360) + 360) % 360;
    const finalRot = normalized > 180 ? normalized - 360 : normalized;
    setSpaces(sList =>
      sList.map(s => {
        if (s.id !== activeSpaceId) return s;
        return {
          ...s,
          items: s.items.map(item =>
            item.id === id ? { ...item, rotation: finalRot } : item
          )
        };
      })
    );
    if (!isApplyingRemoteAction.current) {
      broadcastDeskActionRef.current({ type: 'ITEM_ROTATE', payload: { id, rotation: finalRot } });
    }
  };

  const turnBookPage = (id: string, direction: 'prev' | 'next', maxPages?: number) => {
    let nextIndex = 0;
    setSpaces(sList =>
      sList.map(s => {
        if (s.id !== activeSpaceId) return s;
        return {
          ...s,
          items: s.items.map(item => {
            if (item.id !== id) return item;
            // For a book spread, turn 2 pages at a time (0, 2, 4, ...)
            const step = item.type === 'book' ? 2 : 1;
            const total = maxPages !== undefined ? maxPages : item.pageCount;
            const limit = Math.max(0, total - 1);
            nextIndex = direction === 'next' 
              ? Math.min(item.currentPageIndex + step, limit)
              : Math.max(item.currentPageIndex - step, 0);
            return { ...item, currentPageIndex: nextIndex };
          })
        };
      })
    );
    if (!isApplyingRemoteAction.current) {
      broadcastDeskActionRef.current({ type: 'PAGE_TURN', payload: { id, pageIndex: nextIndex } });
    }
  };

  const setBookPage = (id: string, pageIndex: number) => {
    setSpaces(sList =>
      sList.map(s => {
        if (s.id !== activeSpaceId) return s;
        return {
          ...s,
          items: s.items.map(item => {
            if (item.id !== id) return item;
            const targetPage = Math.min(Math.max(0, pageIndex), (item.pageCount || 1) - 1);
            return { ...item, currentPageIndex: targetPage };
          })
        };
      })
    );
    if (!isApplyingRemoteAction.current) {
      broadcastDeskActionRef.current({ type: 'PAGE_TURN', payload: { id, pageIndex } });
    }
  };

  // Combine non-destructive binder merging
  const combineIntoBinder = (targetId: string, draggedId: string): boolean => {
    if (targetId === draggedId) return false;

    const targetItem = activeSpace.items.find(i => i.id === targetId);
    const draggedItem = activeSpace.items.find(i => i.id === draggedId);
    if (!targetItem || !draggedItem) return false;

    // Convert dragged item's pages into target item's pages
    const newPages: PageContent[] = [
      ...targetItem.pages,
      ...draggedItem.pages.map((p, idx) => ({
        ...p,
        id: `p-${Date.now()}-${idx}`,
        pageNumber: targetItem.pages.length + idx + 1
      }))
    ];

    const totalPages = newPages.length;
    // CRITICAL: A book with coverColor or item.type === 'book' ALWAYS remains a book!
    const isCoverBook = targetItem.type === 'book' || !!targetItem.coverColor;
    const newType = isCoverBook ? ('book' as const) : (totalPages >= 5 ? ('book' as const) : targetItem.type);

    setSpaces(sList =>
      sList.map(s => {
        if (s.id !== activeSpaceId) return s;
        return {
          ...s,
          items: s.items
            .filter(i => i.id !== draggedId)
            .map(i => {
              if (i.id !== targetId) return i;
              return {
                ...i,
                type: newType,
                title: isCoverBook ? i.title : (i.isBinder ? i.title : `Sổ tổng hợp: ${i.title}`),
                isBinder: true,
                pageCount: totalPages,
                pages: newPages,
                width: isCoverBook || newType === 'book' ? 980 : (i.width || 480),
                height: isCoverBook || newType === 'book' ? 640 : (i.height || 640),
                sourceDocuments: [
                  ...(i.sourceDocuments || [{ id: i.id, title: i.title, pageCount: i.pageCount }]),
                  { id: draggedItem.id, title: draggedItem.title, pageCount: draggedItem.pageCount }
                ]
              };
            })
        };
      })
    );
    return true;
  };

  // Detach a page from a book/binder and place it as a single paper sheet on the desk
  const detachPageFromBinder = (bookId: string, pageIndex: number) => {
    const book = activeSpace.items.find(i => i.id === bookId);
    if (!book || book.pages.length === 0) return;

    const actualIndex = Math.min(Math.max(0, pageIndex), book.pages.length - 1);
    const detachedPage = book.pages[actualIndex];
    if (!detachedPage) return;

    // Remaining pages re-indexed
    const remainingPages = book.pages
      .filter((_, idx) => idx !== actualIndex)
      .map((p, idx) => ({ ...p, pageNumber: idx + 1 }));

    const newPaperSheet: DeskItem = {
      id: `paper-detached-${Date.now()}`,
      type: 'paper',
      title: detachedPage.title || `Trích từ: ${book.title} (Trang ${detachedPage.pageNumber})`,
      x: book.x + 380,
      y: book.y + 20,
      rotation: 0,
      scale: 1,
      zIndex: maxZIndex + 2,
      pageCount: 1,
      currentPageIndex: 0,
      colorTheme: book.colorTheme,
      pages: [{ ...detachedPage, pageNumber: 1 }]
    };

    setSpaces(sList =>
      sList.map(s => {
        if (s.id !== activeSpaceId) return s;
        return {
          ...s,
          items: [
            ...s.items.map(item => {
              if (item.id !== bookId) return item;
              const nextCount = remainingPages.length;
              // CRITICAL FIX: A book with coverColor or item.type === 'book' ALWAYS remains a book!
              // NEVER downgrade to 'paper' when pages are detached!
              const isCoverBook = item.type === 'book' || !!item.coverColor;
              return {
                ...item,
                type: isCoverBook ? ('book' as const) : (nextCount < 5 ? ('paper' as const) : ('book' as const)),
                pageCount: nextCount,
                currentPageIndex: Math.min(item.currentPageIndex, Math.max(0, nextCount - 1)),
                pages: remainingPages
              };
            }),
            newPaperSheet
          ]
        };
      })
    );
  };

  const addPageToBook = (bookId: string, pageData?: { title?: string; text?: string; image?: string }): string => {
    const pageId = `p-${Date.now()}`;
    setSpaces(sList =>
      sList.map(s => {
        if (s.id !== activeSpaceId) return s;
        return {
          ...s,
          items: s.items.map(item => {
            if (item.id !== bookId) return item;
            const newIndex = item.pages.length + 1;
            const newPage: PageContent = {
              id: pageId,
              pageNumber: newIndex,
              title: normalizeNFC(pageData?.title || `Trang ${newIndex}`),
              text: normalizeNFC(pageData?.text || '')
            };
            const updatedPages = [...item.pages, newPage];
            return {
              ...item,
              pageCount: updatedPages.length,
              pages: updatedPages
            };
          })
        };
      })
    );
    return pageId;
  };

  const addStickyNote = (text = '', x?: number, y?: number, color = '#fef08a', width?: number, height?: number): string => {
    const noteId = `sticky-${Date.now()}`;
    const w = width || 220;
    const h = height || 200;

    let targetX = x;
    let targetY = y;

    if (targetX === undefined || targetY === undefined) {
      const viewW = typeof window !== 'undefined' ? window.innerWidth : 1280;
      const viewH = typeof window !== 'undefined' ? window.innerHeight : 800;
      const curScale = transform.scale || 1;
      const centerX = (-transform.x + (viewW / 2)) / curScale - (w / 2);
      const centerY = (-transform.y + (viewH / 2)) / curScale - (h / 2);
      const jitterX = Math.round(Math.random() * 40 - 20);
      const jitterY = Math.round(Math.random() * 40 - 20);
      targetX = Math.round(centerX + jitterX);
      targetY = Math.round(centerY + jitterY);
    }

    const newNote: DeskItem = {
      id: noteId,
      type: 'sticky_note',
      title: 'Ghi chú',
      x: targetX,
      y: targetY,
      rotation: 0,
      scale: 1,
      zIndex: maxZIndex + 1,
      pageCount: 1,
      currentPageIndex: 0,
      stickyColor: color,
      stickyText: normalizeNFC(text),
      pages: [],
      width: w,
      height: h
    };

    setSpaces(sList =>
      sList.map(s => {
        if (s.id !== activeSpaceId) return s;
        return { ...s, items: [...s.items, newNote] };
      })
    );
    setSelectedItemId(noteId);
    if (!isApplyingRemoteAction.current) {
      broadcastDeskActionRef.current({ type: 'ADD_ITEM', payload: { item: newNote } });
    }
    return noteId;
  };

  const addCodeBlock = (snippet = '', x?: number, y?: number, language = 'javascript'): string => {
    const codeId = `code-${Date.now()}`;
    const w = 480;
    const h = 200;

    let targetX = x;
    let targetY = y;
    if (targetX === undefined || targetY === undefined) {
      const viewW = typeof window !== 'undefined' ? window.innerWidth : 1280;
      const viewH = typeof window !== 'undefined' ? window.innerHeight : 800;
      const curScale = transform.scale || 1;
      targetX = Math.round((-transform.x + (viewW / 2)) / curScale - (w / 2));
      targetY = Math.round((-transform.y + (viewH / 2)) / curScale - (h / 2));
    }

    const defaultCode = snippet || 'print screen\nhello;';
    const newCodeItem: DeskItem = {
      id: codeId,
      type: 'code_block',
      title: 'Code block',
      x: targetX,
      y: targetY,
      rotation: 0,
      scale: 1,
      zIndex: maxZIndex + 1,
      pageCount: 1,
      currentPageIndex: 0,
      pages: [],
      codeSnippet: defaultCode,
      codeLanguage: language,
      width: w,
      height: h
    };

    setSpaces(sList =>
      sList.map(s => {
        if (s.id !== activeSpaceId) return s;
        return { ...s, items: [...s.items, newCodeItem] };
      })
    );
    setSelectedItemId(codeId);
    if (!isApplyingRemoteAction.current) {
      broadcastDeskActionRef.current({ type: 'ADD_ITEM', payload: { item: newCodeItem } });
    }
    return codeId;
  };

  const addMindMapNode = (text = '', x?: number, y?: number, parentId?: string, color = '#a855f7'): string => {
    const mindId = `mind-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const w = 240;
    const h = 64;

    let targetX = x;
    let targetY = y;
    if (targetX === undefined || targetY === undefined) {
      const viewW = typeof window !== 'undefined' ? window.innerWidth : 1280;
      const viewH = typeof window !== 'undefined' ? window.innerHeight : 800;
      const curScale = transform.scale || 1;
      targetX = Math.round((-transform.x + (viewW / 2)) / curScale - (w / 2));
      targetY = Math.round((-transform.y + (viewH / 2)) / curScale - (h / 2));
    }

    const newNode: DeskItem = {
      id: mindId,
      type: 'mind_map',
      title: 'Ý tưởng',
      x: targetX,
      y: targetY,
      rotation: 0,
      scale: 1,
      zIndex: maxZIndex + 1,
      pageCount: 1,
      currentPageIndex: 0,
      pages: [],
      stickyText: normalizeNFC(text),
      mindMapParentId: parentId,
      mindMapColor: color,
      mindMapShape: 'pill',
      width: w,
      height: h
    };

    setSpaces(sList =>
      sList.map(s => {
        if (s.id !== activeSpaceId) return s;
        return { ...s, items: [...s.items, newNode] };
      })
    );
    setSelectedItemId(mindId);
    if (!isApplyingRemoteAction.current) {
      broadcastDeskActionRef.current({ type: 'ADD_ITEM', payload: { item: newNode } });
    }
    return mindId;
  };

  const addSticker = (
    sticker: { type: 'emoji' | 'sticker' | 'gif'; name: string; content: string; url?: string; isSvg?: boolean; width?: number; height?: number },
    x?: number,
    y?: number,
    customWidth?: number,
    customHeight?: number
  ): string => {
    const stickerId = `sticker-${Date.now()}`;
    const w = customWidth || sticker.width || (sticker.type === 'gif' ? 260 : sticker.type === 'sticker' ? 140 : 100);
    const h = customHeight || sticker.height || (sticker.type === 'gif' ? 200 : sticker.type === 'sticker' ? 140 : 100);

    let targetX = x;
    let targetY = y;
    if (targetX === undefined || targetY === undefined) {
      const viewW = typeof window !== 'undefined' ? window.innerWidth : 1280;
      const viewH = typeof window !== 'undefined' ? window.innerHeight : 800;
      const curScale = transform.scale || 1;
      targetX = Math.round((-transform.x + (viewW / 2)) / curScale - (w / 2));
      targetY = Math.round((-transform.y + (viewH / 2)) / curScale - (h / 2));
    }

    const newSticker: DeskItem = {
      id: stickerId,
      type: 'sticker',
      title: sticker.name,
      x: targetX,
      y: targetY,
      rotation: 0,
      scale: 1,
      zIndex: maxZIndex + 1,
      pageCount: 1,
      currentPageIndex: 0,
      pages: [],
      stickerData: sticker,
      width: w,
      height: h
    };

    setSpaces(sList =>
      sList.map(s => {
        if (s.id !== activeSpaceId) return s;
        return { ...s, items: [...s.items, newSticker] };
      })
    );
    setSelectedItemId(stickerId);
    if (!isApplyingRemoteAction.current) {
      broadcastDeskActionRef.current({ type: 'ADD_ITEM', payload: { item: newSticker } });
    }
    return stickerId;
  };

  const updateCodeBlock = (id: string, snippet: string, language?: string) => {
    setSpaces(sList =>
      sList.map(s => {
        if (s.id !== activeSpaceId) return s;
        return {
          ...s,
          items: s.items.map(item =>
            item.id === id
              ? { ...item, codeSnippet: snippet, codeLanguage: language ?? item.codeLanguage }
              : item
          )
        };
      })
    );
  };

  const updateMindMapNode = (id: string, text: string, color?: string, shape?: 'pill' | 'rectangle' | 'cloud') => {
    const normalized = text.normalize('NFC');
    setSpaces(sList =>
      sList.map(s => {
        if (s.id !== activeSpaceId) return s;
        return {
          ...s,
          items: s.items.map(item =>
            item.id === id
              ? {
                  ...item,
                  stickyText: normalized,
                  mindMapColor: color ?? item.mindMapColor,
                  mindMapShape: shape ?? item.mindMapShape
                }
              : item
          )
        };
      })
    );
  };

  const addIntelineThread = (params: {
    sourceItemId: string;
    sourcePageNumber: number;
    selectedText: string;
    question: string;
    answer: string;
    sourceOffset?: { x: number; y: number };
  }): string => {
    const sourceItem = activeSpace.items.find(i => i.id === params.sourceItemId);
    const placeX = sourceItem ? sourceItem.x + (sourceItem.type === 'book' ? 750 : 390) : 500;
    const placeY = sourceItem ? sourceItem.y + 30 : 300;

    const stickyId = `sticky-inteline-${Date.now()}`;
    const stickyText = `[INTELINE TRÍ TUỆ TỪNG DÒNG]\n"${params.selectedText.slice(0, 90)}..."\n\nTrả lời:\n${params.answer}`;

    const newSticky: DeskItem = {
      id: stickyId,
      type: 'sticky_note',
      title: 'Inteline Note',
      x: placeX,
      y: placeY,
      rotation: Math.floor(Math.random() * 6) - 3,
      scale: 1,
      zIndex: maxZIndex + 3,
      pageCount: 1,
      currentPageIndex: 0,
      stickyColor: '#fed7aa',
      stickyText,
      pages: []
    };

    const threadId = `thread-${Date.now()}`;
    const newThread: IntelineThread = {
      id: threadId,
      sourceItemId: params.sourceItemId,
      sourcePageNumber: params.sourcePageNumber,
      selectedText: params.selectedText,
      sourceOffset: params.sourceOffset || { x: 200, y: 150 },
      targetStickyId: stickyId,
      question: params.question,
      answer: params.answer,
      createdAt: new Date().toISOString()
    };

    setSpaces(sList =>
      sList.map(s => {
        if (s.id !== activeSpaceId) return s;
        return {
          ...s,
          items: [...s.items, newSticky],
          threads: [...(s.threads || []), newThread]
        };
      })
    );

    return stickyId;
  };

  const addBook = (
    title = 'Sổ tay bài học',
    x?: number,
    y?: number,
    coverColor = 'brown',
    initialPages?: { title?: string; text: string; image?: string }[]
  ): string => {
    const bookId = `doc-book-${Date.now()}`;
    const w = 980;
    const h = 640;

    let targetX = x;
    let targetY = y;
    if (targetX === undefined || targetY === undefined) {
      const viewW = typeof window !== 'undefined' ? window.innerWidth : 1280;
      const viewH = typeof window !== 'undefined' ? window.innerHeight : 800;
      const curScale = transform.scale || 1;
      targetX = Math.round((-transform.x + (viewW / 2)) / curScale - (w / 2));
      targetY = Math.round((-transform.y + (viewH / 2)) / curScale - (h / 2));
    }

    const defaultPages = [
      {
        id: `p-${Date.now()}-1`,
        pageNumber: 1,
        title: 'Mục lục & Giới thiệu',
        text: `# ${title}\n\nChào mừng bạn đến với cuốn sổ tay học tập trên GreenLearn.\n\n### Hướng dẫn sử dụng:\n- Sử dụng các tab bookmark bên cạnh phải để lật nhanh giữa các trang.\n- Bấm công cụ STudy hoặc Inteline để trò chuyện hỏi đáp sâu với AI.\n- Ghi chú hoặc vẽ tự do trực tiếp lên mặt sách.`
      },
      {
        id: `p-${Date.now()}-2`,
        pageNumber: 2,
        title: 'Phần 1: Kiến thức trọng tâm',
        text: `### 1. Khái niệm cốt lõi\n\nGhi chú các định nghĩa, định lý và công thức then chốt tại đây.\n\n$$\\int_{-\\infty}^{\\infty} e^{-x^2} dx = \\sqrt{\\pi}$$\n\n### 2. Điểm cần lưu ý\n- Nắm vững bản chất trước khi giải bài tập mẫu.\n- Liên kết với các sơ đồ tư duy liên quan trên bàn học.`
      },
      {
        id: `p-${Date.now()}-3`,
        pageNumber: 3,
        title: 'Phần 2: Ví dụ minh họa & Ứng dụng',
        text: `### Ví dụ áp dụng thực tế:\n\nCho hàm mục tiêu tối ưu hóa:\n$$\\min_{x} f(x) \\quad \\text{với ràng buộc} \\quad g(x) \\le 0$$\n\nCác bước giải chi tiết:\n1. Xác định hàm mục tiêu và tập ràng buộc khả thi.\n2. Lập hàm Lagrange tương ứng.\n3. Giải hệ phương trình điều kiện KKT.`
      },
      {
        id: `p-${Date.now()}-4`,
        pageNumber: 4,
        title: 'Phần 3: Bài tập rèn luyện & Tổng kết',
        text: `### Câu hỏi tự kiểm tra:\n1. Nêu sự khác biệt giữa hai phương pháp tiếp cận chính.\n2. Phân tích độ phức tạp thuật toán và đánh giá hiệu năng.\n\n*Ghi chú ôn tập:* Hoàn thành bộ thẻ ghi nhớ flashcards và bài kiểm tra AI tương ứng.`
      }
    ];

    const pages: PageContent[] = initialPages !== undefined
      ? initialPages.map((p, idx) => ({
          id: `p-${Date.now()}-${idx + 1}`,
          pageNumber: idx + 1,
          title: normalizeNFC(p.title || `Trang ${idx + 1}`),
          text: normalizeNFC(p.text),
          image: p.image
        }))
      : defaultPages.map(p => ({
          ...p,
          title: normalizeNFC(p.title),
          text: normalizeNFC(p.text)
        }));

    const colorThemeMap: Record<string, string> = {
      brown: '#5c3920',
      burgundy: '#6b1d28',
      navy: '#1e3a5f',
      forest: '#1b4d3e',
      plum: '#5b2149'
    };

    const newBook: DeskItem = {
      id: bookId,
      type: 'book',
      title: normalizeNFC(title),
      x: targetX,
      y: targetY,
      rotation: 0,
      scale: 1,
      zIndex: maxZIndex + 1,
      pageCount: pages.length,
      currentPageIndex: 0,
      pages,
      coverColor,
      colorTheme: colorThemeMap[coverColor] || '#5c3920',
      isBinder: false,
      width: w,
      height: h
    };

    setSpaces(sList =>
      sList.map(s => {
        if (s.id !== activeSpaceId) return s;
        return { ...s, items: [...s.items, newBook] };
      })
    );
    setMaxZIndex(prev => prev + 1);
    setSelectedItemId(bookId);
    if (!isApplyingRemoteAction.current) {
      broadcastDeskActionRef.current({ type: 'ADD_ITEM', payload: { item: newBook } });
    }
    return bookId;
  };

  const addUploadedDocument = (title: string, rawPages: { title?: string; text: string; image?: string }[]) => {
    const pageCount = rawPages.length;
    const type: 'paper' | 'book' = pageCount <= 1 ? 'paper' : 'book';

    const pages: PageContent[] = rawPages.map((p, idx) => ({
      id: `p-${Date.now()}-${idx}`,
      pageNumber: idx + 1,
      title: normalizeNFC(p.title || `Trang ${idx + 1}`),
      text: normalizeNFC(p.text),
      image: p.image
    }));

    const newItem: DeskItem = {
      id: `doc-${Date.now()}`,
      type,
      title: normalizeNFC(title),
      x: 320 + Math.random() * 80,
      y: 200 + Math.random() * 60,
      rotation: Math.floor(Math.random() * 6) - 3,
      scale: 1,
      zIndex: maxZIndex + 1,
      pageCount,
      currentPageIndex: 0,
      pages,
      colorTheme: type === 'book' ? '#1e3a8a' : '#047857'
    };

    setSpaces(sList =>
      sList.map(s => {
        if (s.id !== activeSpaceId) return s;
        return { ...s, items: [...s.items, newItem] };
      })
    );
    if (!isApplyingRemoteAction.current) {
      broadcastDeskActionRef.current({ type: 'ADD_ITEM', payload: { item: newItem } });
    }
  };

  const addExamSheet = (
    title: string, 
    questions: import('@/types/studyspace').ExamQuestion[], 
    timeLimitMinutes = 15,
    pos?: { x: number; y: number }
  ): string => {
    const sheetId = `exam-${Date.now()}`;
    const NOTE_COLORS = ['#fef08a', '#fed7aa', '#bbf7d0', '#bae6fd', '#fbcfe8'];
    const randomColor = NOTE_COLORS[Math.floor(Math.random() * NOTE_COLORS.length)];

    const examItem: DeskItem = {
      id: sheetId,
      type: 'paper',
      title: normalizeNFC(title),
      x: pos ? pos.x : (380 + Math.random() * 40),
      y: pos ? pos.y : (160 + Math.random() * 40),
      rotation: 0,
      scale: 1,
      zIndex: maxZIndex + 2,
      pageCount: 1,
      currentPageIndex: 0,
      isExamSheet: true,
      stickyColor: randomColor,
      width: 380,
      height: 490,
      examData: {
        timeLimitMinutes,
        remainingSeconds: timeLimitMinutes * 60,
        questions,
        userAnswers: {},
        isGraded: false,
        totalQuestions: questions.length
      },
      pages: [{
        id: `p-exam-${sheetId}`,
        pageNumber: 1,
        title: normalizeNFC(title),
        text: questions.map((q, idx) => `Câu ${idx + 1}: ${q.question}`).join('\n\n')
      }]
    };

    setSpaces(sList =>
      sList.map(s => {
        if (s.id !== activeSpaceId) return s;
        return { ...s, items: [...s.items, examItem] };
      })
    );
    if (!isApplyingRemoteAction.current) {
      broadcastDeskActionRef.current({ type: 'ADD_ITEM', payload: { item: examItem } });
    }

    return sheetId;
  };

  const updateExamAnswer = (itemId: string, questionId: string, answerIdx: number) => {
    setSpaces(sList =>
      sList.map(s => {
        if (s.id !== activeSpaceId) return s;
        return {
          ...s,
          items: s.items.map(item => {
            if (item.id !== itemId || !item.examData) return item;
            return {
              ...item,
              examData: {
                ...item.examData,
                userAnswers: {
                  ...item.examData.userAnswers,
                  [questionId]: answerIdx
                }
              }
            };
          })
        };
      })
    );
  };

  const gradeExam = (itemId: string) => {
    setSpaces(sList =>
      sList.map(s => {
        if (s.id !== activeSpaceId) return s;
        return {
          ...s,
          items: s.items.map(item => {
            if (item.id !== itemId || !item.examData) return item;
            const { questions, userAnswers } = item.examData;
            let correct = 0;
            questions.forEach(q => {
              if (userAnswers[q.id] === q.correctAnswer) {
                correct++;
              }
            });
            const score = Math.round((correct / (questions.length || 1)) * 100) / 10;
            let teacherNote = 'Cần cố gắng thêm ở các câu lý thuyết!';
            if (score >= 9) teacherNote = 'Xuất sắc! Nắm rất vững toàn bộ trọng tâm bài học.';
            else if (score >= 7) teacherNote = 'Khá tốt! Đã nắm được các khái niệm cốt lõi.';
            else if (score >= 5) teacherNote = 'Đạt yêu cầu cơ bản. Hãy xem lại các câu sai.';

            return {
              ...item,
              examData: {
                ...item.examData,
                isGraded: true,
                score,
                teacherNote
              }
            };
          })
        };
      })
    );
  };

  const resetExam = (itemId: string) => {
    setSpaces(sList =>
      sList.map(s => {
        if (s.id !== activeSpaceId) return s;
        return {
          ...s,
          items: s.items.map(item => {
            if (item.id !== itemId || !item.examData) return item;
            return {
              ...item,
              examData: {
                ...item.examData,
                isGraded: false,
                userAnswers: {},
                score: undefined,
                teacherNote: undefined
              }
            };
          })
        };
      })
    );
  };

  const removeDeskItem = (id: string) => {
    if (status === 'authenticated') {
      StudySpaceService.deleteItem(id);
    }
    setSpaces(sList =>
      sList.map(s => {
        if (s.id !== activeSpaceId) return s;
        return { ...s, items: s.items.filter(item => item.id !== id) };
      })
    );
    setStrokes(prev => prev.filter(s => s.attachedToItemId !== id));
    if (selectedItemId === id) setSelectedItemId(null);
    if (!isApplyingRemoteAction.current) {
      broadcastDeskActionRef.current({ type: 'DELETE_ITEM', payload: { id } });
    }
  };

  const togglePanLock = () => {
    setIsPanLocked(prev => !prev);
  };

  return (
    <StudySpaceContext.Provider
      value={{
        spaces,
        activeSpaceId,
        activeSpace,
        transform,
        selectedItemId,
        searchQuery,
        isPanLocked,
        focusedItemId,
        isFocusNoticeVisible,
        enterFocusMode,
        exitFocusMode,
        triggerFocusNotice,
        switchSpace,
        createSpace,
        createSpaceFromTemplate,
        setTransform,
        panBy,
        zoomBy,
        rotateDeskBy,
        resetDeskRotation,
        resetView,
        selectItem,
        updateItemPosition,
        updateItemDimensions,
        updateItemRotation,
        updateItemTitle,
        setItemRotation,
        bringToFront,
        turnBookPage,
        setBookPage,
        combineIntoBinder,
        detachPageFromBinder,
        addPageToBook,
        updateStickyNoteText,
        updateStickyNoteColor,
        updateBookCoverColor,
        updateStickyNoteTextAlign,
        updateStickyNoteIsBold,
        tidyUpDesk,
        fitAllToScreen,
        addStickyNote,
        addBook,
        addCodeBlock,
        addMindMapNode,
        addSticker,
        updateCodeBlock,
        updateMindMapNode,
        addUploadedDocument,
        addMarketItemToSpace,
        convertPaperToBook,
        addExamSheet,
        updateExamAnswer,
        gradeExam,
        resetExam,
        removeDeskItem,
        setSearchQuery,
        togglePanLock,
        activeTool,
        setActiveTool,
        penColor,
        setPenColor,
        penWidthLevel,
        setPenWidthLevel,
        stickyCreationColor,
        setStickyCreationColor,
        stickyCreationTemplate,
        setStickyCreationTemplate,
        strokes,
        currentStroke,
        startStroke,
        appendPoint,
        finishStroke,
        cancelStroke,
        isFingerDrawingEnabled,
        setIsFingerDrawingEnabled,
        addStroke,
        undoStroke,
        redoStroke,
        redoStack,
        clearStrokes,
        removeStrokeById,
        removeStrokesInBox,
        updateThreadSourceOffset,
        threads: activeSpace.threads || [],
        addIntelineThread,
        isViewRotateMode,
        setIsViewRotateMode,
        // Multiplayer Realtime Synchronized State & Dispatchers
        multiplayerPeers,
        isMultiplayerConnected,
        multiplayerRoomId,
        isMultiplayerHost,
        multiplayerPermission,
        setMultiplayerPermission,
        startHostingRoom,
        joinMultiplayerRoom,
        leaveMultiplayerRoom,
        broadcastDeskAction,
        isFollowPresenter,
        setIsFollowPresenter,
        saveStatus,
        saveCurrentSpaceImmediately
      }}
    >
      {children}
    </StudySpaceContext.Provider>
  );
}

export function useStudySpace() {
  const context = useContext(StudySpaceContext);
  if (!context) {
    throw new Error('useStudySpace must be used within a StudySpaceProvider');
  }
  return context;
}
