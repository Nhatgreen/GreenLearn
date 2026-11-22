'use client';

import React, { useRef, useState, useCallback } from 'react';
import { useStudySpace } from '@/context/StudySpaceContext';

interface UseDeskItemInteractionProps {
  itemId: string;
  itemX: number;
  itemY: number;
  rotation: number;
  width: number;
  height: number;
  onDropCheck?: (latestX: number, latestY: number) => void;
}

export function useDeskItemInteraction({
  itemId,
  itemX,
  itemY,
  rotation,
  width,
  height,
  onDropCheck,
}: UseDeskItemInteractionProps) {
  const { 
    transform, 
    updateItemPosition, 
    setItemRotation, 
    selectItem, 
    bringToFront 
  } = useStudySpace();

  const [isDragging, setIsDragging] = useState(false);
  const dragRef = useRef<{
    startX: number;
    startY: number;
    initialItemX: number;
    initialItemY: number;
    latestX: number;
    latestY: number;
  }>({
    startX: 0,
    startY: 0,
    initialItemX: itemX,
    initialItemY: itemY,
    latestX: itemX,
    latestY: itemY,
  });

  const lastTapTimeRef = useRef<number>(0);

  // Unified drag-and-move handle (Pointer & Mouse & Touch)
  const handlePointerDown = useCallback((e: React.PointerEvent | React.MouseEvent) => {
    // Left click only for mouse
    if ('button' in e && e.button !== 0) return;
    
    // Ignore interactive element clicks
    const target = e.target as HTMLElement;
    if (
      target.closest('button') || 
      target.closest('input') || 
      target.closest('textarea') || 
      target.closest('a') ||
      target.closest('.interactive-control')
    ) {
      return;
    }

    e.stopPropagation();
    bringToFront(itemId);
    selectItem(itemId);
    setIsDragging(true);

    const pointerId = 'pointerId' in e ? (e as React.PointerEvent).pointerId : null;
    const targetEl = e.currentTarget as HTMLElement;
    if (pointerId !== null && targetEl && targetEl.setPointerCapture) {
      try {
        targetEl.setPointerCapture(pointerId);
      } catch (err) {}
    }

    dragRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      initialItemX: itemX,
      initialItemY: itemY,
      latestX: itemX,
      latestY: itemY,
    };

    let rafId: number | null = null;

    const updateMove = (clientX: number, clientY: number) => {
      const deltaScreenX = clientX - dragRef.current.startX;
      const deltaScreenY = clientY - dragRef.current.startY;

      const deskRad = (-(transform.rotation || 0) * Math.PI) / 180;
      const unrotDx = deltaScreenX * Math.cos(deskRad) - deltaScreenY * Math.sin(deskRad);
      const unrotDy = deltaScreenX * Math.sin(deskRad) + deltaScreenY * Math.cos(deskRad);

      const deltaCanvasX = unrotDx / transform.scale;
      const deltaCanvasY = unrotDy / transform.scale;

      const newX = Math.round(dragRef.current.initialItemX + deltaCanvasX);
      const newY = Math.round(dragRef.current.initialItemY + deltaCanvasY);

      dragRef.current.latestX = newX;
      dragRef.current.latestY = newY;

      if (!rafId) {
        rafId = requestAnimationFrame(() => {
          updateItemPosition(itemId, newX, newY);
          rafId = null;
        });
      }
    };

    const handlePointerMove = (moveEvent: PointerEvent | MouseEvent) => {
      updateMove(moveEvent.clientX, moveEvent.clientY);
    };

    const handleTouchMove = (touchEvent: TouchEvent) => {
      if (touchEvent.touches.length > 0) {
        updateMove(touchEvent.touches[0].clientX, touchEvent.touches[0].clientY);
      }
    };

    const handlePointerUp = () => {
      if (rafId) {
        cancelAnimationFrame(rafId);
        rafId = null;
      }
      if (pointerId !== null && targetEl && targetEl.releasePointerCapture) {
        try {
          targetEl.releasePointerCapture(pointerId);
        } catch (err) {}
      }
      setIsDragging(false);
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
      window.removeEventListener('pointercancel', handlePointerUp);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', handlePointerUp);
      window.removeEventListener('mousemove', handlePointerMove);
      window.removeEventListener('mouseup', handlePointerUp);

      updateItemPosition(itemId, dragRef.current.latestX, dragRef.current.latestY);
      if (onDropCheck) {
        onDropCheck(dragRef.current.latestX, dragRef.current.latestY);
      }
    };

    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);
    window.addEventListener('pointercancel', handlePointerUp);
    window.addEventListener('touchmove', handleTouchMove);
    window.addEventListener('touchend', handlePointerUp);
    window.addEventListener('mousemove', handlePointerMove);
    window.addEventListener('mouseup', handlePointerUp);
  }, [itemId, itemX, itemY, transform.scale, transform.rotation, bringToFront, selectItem, updateItemPosition, onDropCheck]);

  // Continuous 360 rotation handle (Mobile Touch & Pointer & Mouse Unified)
  const handleRotatePointerDown = useCallback((e: React.PointerEvent | React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();

    // Mobile double tap detection (within 320ms) -> reset rotation to 0°
    const now = Date.now();
    if (now - lastTapTimeRef.current < 320) {
      setItemRotation(itemId, 0);
      lastTapTimeRef.current = 0;
      return;
    }
    lastTapTimeRef.current = now;

    bringToFront(itemId);
    selectItem(itemId);

    const pointerId = 'pointerId' in e ? (e as React.PointerEvent).pointerId : null;
    const targetEl = e.currentTarget as HTMLElement;
    if (pointerId !== null && targetEl && targetEl.setPointerCapture) {
      try {
        targetEl.setPointerCapture(pointerId);
      } catch (err) {}
    }

    const itemWorldCenterX = itemX + width / 2;
    const itemWorldCenterY = itemY + height / 2;
    const deskRad = ((transform.rotation || 0) * Math.PI) / 180;
    const scaledX = itemWorldCenterX * transform.scale;
    const scaledY = itemWorldCenterY * transform.scale;
    const rotScaledX = scaledX * Math.cos(deskRad) - scaledY * Math.sin(deskRad);
    const rotScaledY = scaledX * Math.sin(deskRad) + scaledY * Math.cos(deskRad);
    const itemCenterX = rotScaledX + transform.x;
    const itemCenterY = rotScaledY + transform.y;

    const startPointerAngle = Math.atan2(e.clientY - itemCenterY, e.clientX - itemCenterX) * (180 / Math.PI);
    const startItemRotation = rotation;

    let rafId: number | null = null;

    const updateRotation = (clientX: number, clientY: number) => {
      const currentPointerAngle = Math.atan2(clientY - itemCenterY, clientX - itemCenterX) * (180 / Math.PI);
      const deltaAngle = currentPointerAngle - startPointerAngle;
      let rawRot = Math.round(startItemRotation + deltaAngle);
      // Magnetic snap to 0° within ±2.5° for crisp reading alignment
      const normalizedMod = ((rawRot % 360) + 360) % 360;
      if (normalizedMod <= 2.5 || normalizedMod >= 357.5) {
        rawRot = 0;
      }
      if (!rafId) {
        rafId = requestAnimationFrame(() => {
          setItemRotation(itemId, rawRot);
          rafId = null;
        });
      }
    };

    const handlePointerMove = (moveEvent: PointerEvent | MouseEvent) => {
      moveEvent.preventDefault();
      moveEvent.stopPropagation();
      updateRotation(moveEvent.clientX, moveEvent.clientY);
    };

    const handleTouchMove = (touchEvent: TouchEvent) => {
      if (touchEvent.touches.length > 0) {
        touchEvent.preventDefault();
        touchEvent.stopPropagation();
        updateRotation(touchEvent.touches[0].clientX, touchEvent.touches[0].clientY);
      }
    };

    const handlePointerUp = () => {
      if (rafId) {
        cancelAnimationFrame(rafId);
        rafId = null;
      }
      if (pointerId !== null && targetEl && targetEl.releasePointerCapture) {
        try {
          targetEl.releasePointerCapture(pointerId);
        } catch (err) {}
      }
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
      window.removeEventListener('pointercancel', handlePointerUp);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', handlePointerUp);
      window.removeEventListener('mousemove', handlePointerMove);
      window.removeEventListener('mouseup', handlePointerUp);
    };

    window.addEventListener('pointermove', handlePointerMove, { passive: false });
    window.addEventListener('pointerup', handlePointerUp);
    window.addEventListener('pointercancel', handlePointerUp);
    window.addEventListener('touchmove', handleTouchMove, { passive: false });
    window.addEventListener('touchend', handlePointerUp);
    window.addEventListener('mousemove', handlePointerMove);
    window.addEventListener('mouseup', handlePointerUp);
  }, [itemId, itemX, itemY, width, height, rotation, transform.scale, transform.rotation, transform.x, transform.y, bringToFront, selectItem, setItemRotation]);

  const handleRotateDoubleClick = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    e.stopPropagation();
    e.preventDefault();
    setItemRotation(itemId, 0);
  }, [itemId, setItemRotation]);

  return {
    isDragging,
    handleMouseDown: handlePointerDown, // Backward compatibility
    handlePointerDown,
    handleRotateMouseDown: handleRotatePointerDown, // Backward compatibility
    handleRotatePointerDown,
    handleRotateDoubleClick,
  };
}
