'use client';

import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import Image from 'next/image';
import { 
  X, 
  Flame, 
  Sparkles, 
  Check, 
  Lock, 
  Pencil, 
  Moon, 
  Sun, 
  CheckCircle2, 
  Bell, 
  ChevronRight,
  RotateCcw
} from 'lucide-react';
import { PetStage, PET_STAGES } from '@/types/pet';
import { usePetMascot } from '@/hooks/usePetMascot';
import { getPetAssetUrl } from '@/lib/petHelpers';

interface PetMascotModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function PetMascotModal({ isOpen, onClose }: PetMascotModalProps) {
  const [mounted, setMounted] = useState(false);
  const {
    pet,
    info,
    isClaimedToday,
    nextStageProgress,
    claimToday,
    renamePet,
  } = usePetMascot();

  // State xem trước trong modal (người dùng có thể nhấp vào các cấp đã mở khóa để xem)
  const [previewStage, setPreviewStage] = useState<PetStage>(pet.stage);
  const [previewSleeping, setPreviewSleeping] = useState<boolean>(pet.isSleeping);

  // State đổi tên thú cưng
  const [isEditingName, setIsEditingName] = useState(false);
  const [tempName, setTempName] = useState(pet.name);

  // Phản hồi điểm danh
  const [claimFeedback, setClaimFeedback] = useState<string | null>(null);

  // Thông báo nhắc nhở
  const [dailyReminder, setDailyReminder] = useState(true);

  useEffect(() => {
    setMounted(true);
    try {
      const savedReminder = localStorage.getItem('greenlearn_daily_reminder');
      if (savedReminder !== null) setDailyReminder(savedReminder === 'true');
    } catch {}
  }, []);

  // Đồng bộ preview stage khi pet stage thay đổi
  useEffect(() => {
    setPreviewStage(pet.stage);
    setPreviewSleeping(pet.isSleeping);
    setTempName(pet.name);
  }, [pet.stage, pet.isSleeping, pet.name]);

  // Phím Esc để đóng modal
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !mounted) return null;

  const currentPreviewInfo = PET_STAGES[previewStage] || info;
  const currentImageUrl = getPetAssetUrl(previewStage, previewSleeping);

  const handleSaveName = () => {
    if (tempName.trim()) {
      renamePet(tempName.trim());
      setIsEditingName(false);
    }
  };

  const handleClaim = () => {
    const res = processClaim();
    if (res.success) {
      setPreviewSleeping(false);
      setPreviewStage(calculatePetStageFromStreak(res.newStreak));
      setClaimFeedback(`Tuyệt vời! Bạn đã duy trì chuỗi học tập ${res.newStreak} ngày liên tiếp.`);
      setTimeout(() => setClaimFeedback(null), 4000);
    }
  };

  const processClaim = () => {
    return claimToday();
  };

  function calculatePetStageFromStreak(streak: number): PetStage {
    if (streak >= 30) return 5;
    if (streak >= 14) return 4;
    if (streak >= 7) return 3;
    if (streak >= 3) return 2;
    return 1;
  }

  return createPortal(
    <div
      id="pet-modal-backdrop"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      className="fixed inset-0 bg-black/60 backdrop-blur-xs z-[9990] flex items-center justify-center p-3 sm:p-4 overflow-y-auto"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-white border border-slate-200 rounded-3xl w-full max-w-2xl shadow-2xl relative text-slate-900 animate-fade-in font-sans overflow-hidden my-auto"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 sm:px-6 pt-5 pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-green-50 border border-green-200 flex items-center justify-center text-[#16A34A]">
              <Sparkles className="w-4.5 h-4.5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                {isEditingName ? (
                  <div className="flex items-center gap-1.5">
                    <input
                      type="text"
                      value={tempName}
                      onChange={(e) => setTempName(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleSaveName()}
                      maxLength={24}
                      autoFocus
                      className="text-base font-black text-slate-900 border border-green-400 rounded-lg px-2 py-0.5 outline-hidden focus:ring-2 focus:ring-green-400"
                    />
                    <button
                      type="button"
                      onClick={handleSaveName}
                      className="p-1 rounded-md bg-[#16A34A] text-white hover:bg-[#15803D] cursor-pointer"
                      title="Lưu tên mới"
                    >
                      <Check className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setTempName(pet.name);
                        setIsEditingName(false);
                      }}
                      className="p-1 rounded-md bg-slate-100 text-slate-500 hover:bg-slate-200 cursor-pointer"
                      title="Hủy"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center gap-1.5">
                    <h3 className="text-base sm:text-lg font-black text-slate-900">
                      {pet.name}
                    </h3>
                    <button
                      type="button"
                      onClick={() => setIsEditingName(true)}
                      className="text-slate-400 hover:text-slate-700 p-1 rounded-md hover:bg-slate-100 cursor-pointer transition-colors"
                      title="Đổi tên thú cưng"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
                <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-green-100 text-[#166534]">
                  Cấp {pet.stage}
                </span>
              </div>
              <p className="text-xs text-slate-500">
                Thú cưng đồng hành phát triển theo chuỗi ngày học tập GreenLearn
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            aria-label="Đóng bảng thú cưng"
            className="w-9 h-9 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-800 hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <X className="w-4.5 h-4.5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 sm:p-6 grid grid-cols-1 md:grid-cols-12 gap-5">
          {/* Cột Trái: Trưng Bày Thú Cưng (5 cols) */}
          <div className="md:col-span-5 flex flex-col items-center justify-between bg-gradient-to-b from-green-50/60 to-slate-50/70 border border-slate-200 rounded-2xl p-4 relative">
            {/* Trạng thái Thức / Ngủ */}
            <div className="w-full flex items-center justify-between mb-2">
              <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold ${
                previewSleeping 
                  ? 'bg-slate-200/80 text-slate-700' 
                  : 'bg-green-100 text-[#166534] ring-1 ring-green-300'
              }`}>
                {previewSleeping ? (
                  <>
                    <Moon className="w-3 h-3 text-slate-600" />
                    <span>Đang say giấc</span>
                  </>
                ) : (
                  <>
                    <Sun className="w-3 h-3 text-[#16A34A]" />
                    <span>Đang thức & tràn đầy năng lượng</span>
                  </>
                )}
              </span>

              {/* Toggle chế độ xem Dáng Thức / Dáng Ngủ */}
              <div className="flex items-center bg-white border border-slate-200 rounded-lg p-0.5 shadow-2xs">
                <button
                  type="button"
                  onClick={() => setPreviewSleeping(false)}
                  className={`p-1 rounded-md transition-colors cursor-pointer ${
                    !previewSleeping ? 'bg-[#16A34A] text-white' : 'text-slate-400 hover:text-slate-700'
                  }`}
                  title="Xem dáng tỉnh táo"
                >
                  <Sun className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => setPreviewSleeping(true)}
                  className={`p-1 rounded-md transition-colors cursor-pointer ${
                    previewSleeping ? 'bg-slate-700 text-white' : 'text-slate-400 hover:text-slate-700'
                  }`}
                  title="Xem dáng ngủ say"
                >
                  <Moon className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Khung Ảnh Thú Cưng với hiệu ứng chuyển động nhịp thở */}
            <div className="relative w-40 h-40 sm:w-48 sm:h-48 flex items-center justify-center my-1">
              <div className="absolute inset-0 bg-green-200/30 rounded-full blur-xl scale-90 pointer-events-none" />
              <img
                src={currentImageUrl}
                alt={`${currentPreviewInfo.name} - Cấp ${previewStage}`}
                className="w-full h-full object-contain relative z-10 drop-shadow-sm select-none transition-transform duration-500 hover:scale-105"
                style={{
                  maxHeight: '180px',
                  maxWidth: '180px',
                  animation: previewSleeping ? 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite' : 'none',
                }}
              />
            </div>

            {/* Lời thoại / Trạng thái */}
            <div className="w-full mt-3 bg-white/90 border border-slate-200 rounded-xl p-2.5 text-center shadow-2xs">
              <p className="text-[11.5px] italic text-slate-700 leading-snug">
                "{previewSleeping ? currentPreviewInfo.sleepingQuote : currentPreviewInfo.activeQuote}"
              </p>
            </div>

            {previewStage !== pet.stage && (
              <button
                type="button"
                onClick={() => {
                  setPreviewStage(pet.stage);
                  setPreviewSleeping(pet.isSleeping);
                }}
                className="mt-2 text-[11px] font-bold text-slate-500 hover:text-[#16A34A] flex items-center gap-1 cursor-pointer"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Về cấp độ thực tế (Cấp {pet.stage})</span>
              </button>
            )}
          </div>

          {/* Cột Phải: Tiến Trình & Bản Đồ Tiến Hóa 5 Cấp (7 cols) */}
          <div className="md:col-span-7 flex flex-col justify-between space-y-4">
            {/* Thẻ Cấp Độ Hiện Tại */}
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3.5">
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center gap-1.5">
                  <Flame className="w-4 h-4 text-[#16A34A] fill-[#16A34A]" />
                  <span className="text-xs font-bold text-slate-900">
                    Chuỗi học tập hiện tại: {pet.streakDays} ngày liên tiếp
                  </span>
                </div>
                <span className="text-[11px] font-bold text-[#16A34A]">
                  {info.title}
                </span>
              </div>

              {/* 7 Ngày Trong Tuần */}
              <div className="grid grid-cols-7 gap-1 my-2.5">
                {['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'].map((dayLabel, idx) => {
                  const currentDayIdx = (new Date().getDay() + 6) % 7;
                  const isToday = idx === currentDayIdx;
                  const isPast = idx < currentDayIdx;
                  const isClaimedTodaySlot = isToday && isClaimedToday;
                  const isPastClaimed = isPast && (pet.streakDays >= (currentDayIdx - idx));
                  const isClaimed = isClaimedTodaySlot || isPastClaimed;
                  const isMissed = isPast && !isClaimed;

                  return (
                    <div key={dayLabel} className="flex flex-col items-center">
                      <div
                        className={`w-7 h-7 rounded-lg flex items-center justify-center text-[10px] font-bold transition-all border select-none ${
                          isClaimed
                            ? 'bg-[#16A34A] border-green-600 text-white'
                            : isToday && !isClaimedToday
                            ? 'bg-[#F0FDF4] border-[#16A34A] text-[#166534] ring-2 ring-[#16A34A]/40'
                            : isMissed
                            ? 'bg-slate-100 border-dashed border-slate-300 text-slate-400'
                            : 'bg-white border-slate-200 text-slate-700'
                        }`}
                      >
                        {isClaimed ? (
                          <Check className="w-3.5 h-3.5 stroke-[3]" />
                        ) : (
                          dayLabel
                        )}
                      </div>
                      <span className={`text-[9.5px] mt-0.5 ${isToday ? 'font-black text-[#16A34A]' : 'text-slate-400'}`}>
                        {dayLabel}
                      </span>
                    </div>
                  );
                })}
              </div>

              {/* Thanh Tiến Độ Tiến Hóa */}
              {nextStageProgress.nextStage ? (
                <div>
                  <div className="flex items-center justify-between text-[11px] text-slate-500 mb-1">
                    <span>Tiến hóa Cấp {nextStageProgress.nextStage}</span>
                    <span className="font-bold text-slate-700">
                      Cần thêm {nextStageProgress.daysNeeded} ngày liên tục
                    </span>
                  </div>
                  <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                    <div
                      className="bg-[#16A34A] h-full rounded-full transition-all duration-500"
                      style={{ width: `${Math.max(8, nextStageProgress.progressPercent)}%` }}
                    />
                  </div>
                </div>
              ) : (
                <div className="p-2 bg-green-100/70 border border-green-200 rounded-xl text-center">
                  <span className="text-xs font-black text-[#166534]">
                    Đã đạt cấp tiến hóa tối thượng: Vị Thần Cổ Thụ!
                  </span>
                </div>
              )}

              <p className="text-[11px] text-slate-500 mt-2 leading-relaxed">
                {currentPreviewInfo.description}
              </p>
            </div>

            {/* Thư Viện 5 Cấp Tiến Hóa */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-slate-700">
                  Hành trình 5 cấp tiến hóa
                </span>
                <span className="text-[10.5px] text-slate-400">
                  (Nhấp vào cấp đã mở để xem trước)
                </span>
              </div>

              <div className="grid grid-cols-5 gap-1.5">
                {([1, 2, 3, 4, 5] as PetStage[]).map((stg) => {
                  const stageInfo = PET_STAGES[stg];
                  const isUnlocked = pet.unlockedStages.includes(stg);
                  const isCurrent = pet.stage === stg;
                  const isSelected = previewStage === stg;

                  return (
                    <button
                      key={stg}
                      type="button"
                      disabled={!isUnlocked}
                      onClick={() => {
                        if (isUnlocked) {
                          setPreviewStage(stg);
                        }
                      }}
                      className={`relative flex flex-col items-center p-1.5 rounded-xl border text-center transition-all cursor-pointer ${
                        isSelected
                          ? 'border-[#16A34A] bg-[#F0FDF4] ring-2 ring-[#16A34A]/30'
                          : isUnlocked
                          ? 'border-slate-200 bg-white hover:border-green-300 hover:bg-slate-50'
                          : 'border-slate-200 bg-slate-100 opacity-60 cursor-not-allowed'
                      }`}
                    >
                      {/* Badge hiện tại */}
                      {isCurrent && (
                        <div className="absolute -top-1.5 -right-1 w-3.5 h-3.5 rounded-full bg-[#16A34A] text-white flex items-center justify-center text-[8px] font-black">
                          ✓
                        </div>
                      )}

                      {/* Mini Thumbnail */}
                      <div className="w-10 h-10 flex items-center justify-center my-0.5">
                        {isUnlocked ? (
                          <img
                            src={getPetAssetUrl(stg, false)}
                            alt={stageInfo.name}
                            className="w-full h-full object-contain"
                          />
                        ) : (
                          <Lock className="w-4 h-4 text-slate-400" />
                        )}
                      </div>

                      <span className="text-[10px] font-bold text-slate-800 line-clamp-1">
                        Cấp {stg}
                      </span>
                      <span className="text-[9px] text-slate-400 font-mono">
                        {stageInfo.minDays}d+
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Thông báo kết quả điểm danh */}
            {claimFeedback && (
              <div className="p-2.5 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-xs font-semibold flex items-center justify-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                <span>{claimFeedback}</span>
              </div>
            )}

            {/* Hành động Điểm Danh Hằng Ngày */}
            <div className="pt-1">
              {isClaimedToday ? (
                <div className="w-full py-2.5 px-3 bg-slate-100 border border-slate-200 rounded-xl flex items-center justify-center gap-2 text-xs font-bold text-slate-600">
                  <Check className="w-4 h-4 text-emerald-600 stroke-[3]" />
                  <span>Đã điểm danh hôm nay • Thú cưng đang vui vẻ đồng hành!</span>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={handleClaim}
                  className="w-full py-2.5 px-4 bg-[#16A34A] hover:bg-[#15803D] text-white font-bold rounded-xl text-xs transition-all shadow-md active:scale-98 cursor-pointer flex items-center justify-center gap-2 group"
                >
                  <Sparkles className="w-4 h-4 transition-transform group-hover:rotate-12" />
                  <span>Điểm danh hôm nay (Đánh thức {pet.name})</span>
                </button>
              )}
            </div>

            {/* Toggle thông báo nhắc nhở */}
            <label className="flex items-center justify-center gap-2 text-[11px] text-slate-500 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={dailyReminder}
                onChange={(e) => {
                  const checked = e.target.checked;
                  setDailyReminder(checked);
                  if (checked && typeof window !== 'undefined' && 'Notification' in window) {
                    Notification.requestPermission();
                  }
                  try {
                    localStorage.setItem('greenlearn_daily_reminder', String(checked));
                  } catch {}
                }}
                className="w-3.5 h-3.5 accent-[#16A34A] rounded cursor-pointer"
              />
              <span className="flex items-center gap-1 text-slate-600">
                <Bell className="w-3 h-3 text-slate-400" />
                <span>Nhắc nhở qua thông báo trình duyệt mỗi ngày</span>
              </span>
            </label>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}
