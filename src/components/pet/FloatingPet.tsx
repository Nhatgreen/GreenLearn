'use client';

import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { usePetMascot } from '@/hooks/usePetMascot';
import { PetMascotModal } from './PetMascotModal';
import { PET_STAGES, PetStage } from '@/types/pet';
import { getPetAssetUrl } from '@/lib/petHelpers';
import './pet.css';

const STORAGE_KEY = 'greenlearn_pet_position';
const DRAG_THRESHOLD = 6; // Dưới 6px tính là Tap/Click, trên 6px tính là Kéo

export const FloatingPet: React.FC = () => {
  const {
    pet,
    info,
    isClaimedToday,
    claimToday,
  } = usePetMascot();

  const [position, setPosition] = useState<{ x: number; y: number } | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isWakingUp, setIsWakingUp] = useState(false);
  const [isMascotModalOpen, setIsMascotModalOpen] = useState(false);
  const [evolutionModalData, setEvolutionModalData] = useState<{ newStage: PetStage } | null>(null);
  const [mounted, setMounted] = useState(false);

  const dragStartRef = useRef<{ pointerX: number; pointerY: number; petX: number; petY: number } | null>(null);
  const hasMovedRef = useRef(false);
  const petSize = 84;

  // Khởi tạo vị trí ban đầu từ localStorage hoặc góc dưới bên phải màn hình
  useEffect(() => {
    setMounted(true);
    try {
      const saved = localStorage.getItem(STORAGE_KEY) || localStorage.getItem('vitudy_pet_position_v1');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (typeof parsed.x === 'number' && typeof parsed.y === 'number') {
          setPosition(parsed);
          return;
        }
      }
    } catch {}

    const defaultX = typeof window !== 'undefined' ? Math.max(16, window.innerWidth - petSize - 16) : 280;
    const defaultY = typeof window !== 'undefined' ? Math.max(80, window.innerHeight - 200) : 400;
    setPosition({ x: defaultX, y: defaultY });
  }, []);

  // Đảm bảo vị trí luôn nằm trong khung nhìn khi xoay/co giãn màn hình
  useEffect(() => {
    const handleResize = () => {
      setPosition((prev) => {
        if (!prev) return null;
        const maxX = window.innerWidth - petSize - 14;
        const maxY = window.innerHeight - petSize - 24;
        return {
          x: Math.min(Math.max(14, prev.x), Math.max(14, maxX)),
          y: Math.min(Math.max(24, prev.y), Math.max(24, maxY)),
        };
      });
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Kéo thả bằng Pointer Events (hỗ trợ cả chuột và màn hình cảm ứng)
  const handlePointerDown = (e: React.PointerEvent) => {
    if (!position) return;
    e.stopPropagation();
    try {
      (e.target as HTMLElement).setPointerCapture(e.pointerId);
    } catch {}

    dragStartRef.current = {
      pointerX: e.clientX,
      pointerY: e.clientY,
      petX: position.x,
      petY: position.y,
    };
    hasMovedRef.current = false;
    setIsDragging(true);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!dragStartRef.current) return;

    const dx = e.clientX - dragStartRef.current.pointerX;
    const dy = e.clientY - dragStartRef.current.pointerY;

    if (Math.hypot(dx, dy) > DRAG_THRESHOLD) {
      hasMovedRef.current = true;
    }

    const newX = dragStartRef.current.petX + dx;
    const newY = dragStartRef.current.petY + dy;

    setPosition({ x: newX, y: newY });
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    if (!dragStartRef.current || !position) return;
    try {
      (e.target as HTMLElement).releasePointerCapture(e.pointerId);
    } catch {}

    const wasJustTap = !hasMovedRef.current;
    dragStartRef.current = null;
    setIsDragging(false);

    // Snap vào mép trái hoặc mép phải màn hình gần nhất
    const screenWidth = window.innerWidth;
    const screenHeight = window.innerHeight;
    const paddingX = 14;
    const paddingY = 24;

    const snapX = position.x + petSize / 2 < screenWidth / 2 ? paddingX : screenWidth - petSize - paddingX;
    const clampedY = Math.min(Math.max(paddingY, position.y), screenHeight - petSize - paddingY);

    const finalPos = { x: snapX, y: clampedY };
    setPosition(finalPos);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(finalPos));
    } catch {}

    // Nếu chỉ là Tap (chạm mà không kéo di chuyển)
    if (wasJustTap) {
      handleTap();
    }
  };

  const handleTap = () => {
    if (!isClaimedToday) {
      // Đang ngủ -> Bừng tỉnh thức giấc, điểm danh tăng streak
      setIsWakingUp(true);
      const res = claimToday();
      if (res.stageChanged) {
        setEvolutionModalData({ newStage: pet.stage });
      }
      setTimeout(() => {
        setIsWakingUp(false);
      }, 700);
    } else {
      // Đã thức -> Mở hộp thoại Chi tiết / Bộ sưu tập Mầm Xanh
      setIsMascotModalOpen(true);
    }
  };

  if (!mounted || !position) {
    return null;
  }

  const isAsleep = !isClaimedToday;
  const currentImageSrc = getPetAssetUrl(pet.stage, isAsleep && !isWakingUp);

  return (
    <>
      {/* Vùng Pet nổi - wrapper có pointer-events-none để tuyệt đối không chặn click xung quanh */}
      <div
        className="fixed inset-0 pointer-events-none z-[9990] overflow-hidden select-none font-sans"
        aria-hidden="false"
        style={{
          background: 'transparent',
          WebkitTapHighlightColor: 'transparent',
        }}
      >
        <div
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
          style={{
            transform: `translate3d(${position.x}px, ${position.y}px, 0)`,
            transition: isDragging ? 'none' : 'transform 0.35s cubic-bezier(0.18, 0.89, 0.32, 1.28)',
            touchAction: 'none',
            background: 'transparent',
            boxShadow: 'none',
            border: 'none',
            outline: 'none',
            padding: 0,
            WebkitTapHighlightColor: 'transparent',
          }}
          className="absolute top-0 left-0 pointer-events-auto cursor-grab active:cursor-grabbing flex flex-col items-center group bg-transparent border-0 shadow-none outline-none p-0"
          title={isAsleep ? 'Bấm để đánh thức Mầm Xanh và điểm danh chuỗi học hôm nay' : 'Bấm để xem chi tiết Mầm Xanh'}
        >
          {/* Vỏ Pet & Animation Container — Giữ nguyên hình ảnh Mầm Xanh GreenLearn */}
          <div
            className={`relative w-[84px] h-[84px] flex items-center justify-center bg-transparent border-0 shadow-none outline-none p-0 ${
              isWakingUp
                ? 'pet-wake-animation'
                : isAsleep
                ? 'pet-idle-sleep'
                : 'pet-idle-awake'
            }`}
            style={{
              background: 'transparent',
              boxShadow: 'none',
              border: 'none',
              outline: 'none',
              padding: 0,
              WebkitTapHighlightColor: 'transparent',
            }}
          >
            <img
              src={currentImageSrc}
              alt={info.name}
              draggable={false}
              style={{
                background: 'transparent',
                boxShadow: 'none',
                border: 'none',
                outline: 'none',
                display: 'block',
                userSelect: 'none',
                WebkitUserSelect: 'none',
                filter: 'drop-shadow(0 4px 6px rgba(0, 0, 0, 0.15))',
                WebkitTapHighlightColor: 'transparent',
                ...({ WebkitUserDrag: 'none' } as any),
              }}
              className="w-full h-full object-contain pointer-events-none"
            />

            {/* Chữ Zzz bay lơ lửng khi Mầm Xanh đang ngủ */}
            {isAsleep && !isWakingUp && (
              <>
                <span className="pet-zzz-bubble pet-zzz-1">z</span>
                <span className="pet-zzz-bubble pet-zzz-2">Z</span>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Modal Chúc mừng Tiến Hóa (Evolution Modal) */}
      {evolutionModalData && typeof document !== 'undefined' && createPortal(
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-[99999] bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in font-sans"
          onClick={() => setEvolutionModalData(null)}
        >
          <div
            className="bg-white rounded-3xl p-6 max-w-sm w-full text-center shadow-2xl border border-green-200 relative overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-32 h-32 mx-auto my-2 flex items-center justify-center pet-evolve-animation">
              <img
                src={getPetAssetUrl(evolutionModalData.newStage, false)}
                alt="Tiến hóa thành công"
                className="w-full h-full object-contain"
              />
            </div>
            <h3 className="text-xl font-black text-slate-900 mt-2">Mầm Xanh Đã Lớn Lên!</h3>
            <p className="text-sm text-slate-600 mt-1">
              Thú cưng của Sếp đã tiến hóa thành <strong>{PET_STAGES[evolutionModalData.newStage]?.name}</strong>.
            </p>
            <button
              type="button"
              onClick={() => setEvolutionModalData(null)}
              className="mt-6 w-full py-3 bg-[#16A34A] hover:bg-[#15803D] text-white font-bold rounded-xl shadow-md transition-all active:scale-95 cursor-pointer"
            >
              Tuyệt vời!
            </button>
          </div>
        </div>,
        document.body
      )}

      {/* Modal Bộ Sưu Tập / Chi Tiết Mầm Xanh */}
      <PetMascotModal
        isOpen={isMascotModalOpen}
        onClose={() => setIsMascotModalOpen(false)}
      />
    </>
  );
};
