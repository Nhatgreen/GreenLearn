'use client';

import React, { useState, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Table2, Maximize2, Trash2, X, Search } from 'lucide-react';
import type { DeskItem } from '@/types/studyspace';
import { useStudySpace } from '@/context/StudySpaceContext';
import { ItemDrawingOverlay } from '@/components/canvas/ItemDrawingOverlay';

interface SpreadsheetItemProps {
  item: DeskItem;
  isSelected: boolean;
}

export const SpreadsheetItem = React.memo(function SpreadsheetItem({
  item,
  isSelected,
}: SpreadsheetItemProps) {
  const { updateDeskItem, removeDeskItem, selectItem, bringToFront, transform } = useStudySpace();
  const [isFullView, setIsFullView] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const dragRef = useRef<{ startX: number; startY: number; itemX: number; itemY: number } | null>(null);

  const sheets = item.spreadsheetData?.sheets?.length
    ? item.spreadsheetData.sheets
    : [{ name: 'Sheet1', rows: item.pages.map((p) => [p.title || '', p.text]) }];
  const activeSheetIndex = Math.min(
    Math.max(0, item.spreadsheetData?.activeSheetIndex ?? 0),
    sheets.length - 1
  );
  const activeSheet = sheets[activeSheetIndex];
  const rows = activeSheet?.rows || [];
  const headerRow = rows[0] || [];
  const bodyRows = rows.slice(1);
  const maxCols = Math.max(1, ...rows.slice(0, 50).map((r) => r.length));

  const w = item.width || 580;
  const h = item.height || 400;

  const handleHeaderPointerDown = (e: React.PointerEvent | React.MouseEvent) => {
    if ('button' in e && e.button !== 0) return;
    if ((e.target as HTMLElement).closest('button')) return;
    e.stopPropagation();
    selectItem(item.id);
    bringToFront(item.id);

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
      itemX: item.x,
      itemY: item.y,
    };

    const handleMove = (ev: PointerEvent | MouseEvent) => {
      if (!dragRef.current) return;
      if ('cancelable' in ev && ev.cancelable) {
        ev.preventDefault();
      }
      const dx = (ev.clientX - dragRef.current.startX) / transform.scale;
      const dy = (ev.clientY - dragRef.current.startY) / transform.scale;
      updateDeskItem(item.id, {
        x: Math.round(dragRef.current.itemX + dx),
        y: Math.round(dragRef.current.itemY + dy),
      });
    };

    const handleUp = () => {
      dragRef.current = null;
      if (pointerId !== null && targetEl && targetEl.releasePointerCapture) {
        try {
          targetEl.releasePointerCapture(pointerId);
        } catch (err) {}
      }
      window.removeEventListener('pointermove', handleMove);
      window.removeEventListener('pointerup', handleUp);
      window.removeEventListener('pointercancel', handleUp);
      window.removeEventListener('mousemove', handleMove);
      window.removeEventListener('mouseup', handleUp);
    };

    window.addEventListener('pointermove', handleMove, { passive: false });
    window.addEventListener('pointerup', handleUp);
    window.addEventListener('pointercancel', handleUp);
    window.addEventListener('mousemove', handleMove);
    window.addEventListener('mouseup', handleUp);
  };

  const handleSelectSheet = (idx: number) => {
    updateDeskItem(item.id, {
      spreadsheetData: {
        sheets,
        activeSheetIndex: idx,
        sourceUrl: item.spreadsheetData?.sourceUrl,
      },
    });
  };

  const renderTable = (displayRows: string[][], isModal = false) => {
    const head = displayRows[0] || [];
    const data = displayRows.slice(1);
    const filteredData =
      isModal && searchTerm.trim()
        ? data.filter((r) => r.some((c) => c.toLowerCase().includes(searchTerm.toLowerCase())))
        : data;

    return (
      <table className="w-full border-collapse text-left text-[11px] font-sans">
        <thead className="sticky top-0 z-10 bg-slate-100 text-slate-700 shadow-[0_1px_0_#cbd5e1]">
          <tr>
            <th className="w-9 px-2 py-1.5 text-center font-mono text-[10px] text-slate-400 border-r border-slate-200 bg-slate-100">
              #
            </th>
            {Array.from({ length: maxCols }).map((_, colIdx) => (
              <th
                key={colIdx}
                className="px-2.5 py-1.5 font-bold text-slate-800 border-r border-slate-200 whitespace-nowrap max-w-[220px] truncate"
                title={head[colIdx] || ''}
              >
                {head[colIdx] || `Cột ${colIdx + 1}`}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {filteredData.map((row, rIdx) => (
            <tr key={rIdx} className="hover:bg-green-50/50 border-b border-slate-100">
              <td className="px-2 py-1 text-center font-mono text-[10px] text-slate-400 border-r border-slate-200 bg-slate-50/70">
                {rIdx + 2}
              </td>
              {Array.from({ length: maxCols }).map((_, cIdx) => (
                <td
                  key={cIdx}
                  className="px-2.5 py-1 text-slate-700 border-r border-slate-100 whitespace-nowrap max-w-[240px] truncate"
                  title={row[cIdx] || ''}
                >
                  {row[cIdx] ?? ''}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    );
  };

  return (
    <>
      <div
        onPointerDown={(e) => {
          e.stopPropagation();
          selectItem(item.id);
        }}
        onMouseDown={(e) => {
          e.stopPropagation();
          selectItem(item.id);
        }}
        style={{
          position: 'absolute',
          left: item.x,
          top: item.y,
          width: w,
          height: h,
          transform: `rotate(${item.rotation || 0}deg) scale(${item.scale || 1})`,
          transformOrigin: 'top left',
          zIndex: item.zIndex,
        }}
        className={`bg-white rounded-xl border flex flex-col overflow-hidden shadow-lg transition-shadow select-text ${
          isSelected ? 'border-[#16A34A] ring-2 ring-[#16A34A]/25 shadow-xl' : 'border-slate-300'
        }`}
      >
        {/* Header Bar */}
        <div
          onPointerDown={handleHeaderPointerDown}
          onMouseDown={handleHeaderPointerDown}
          className="px-3 py-2 bg-slate-50 border-b border-slate-200 flex items-center justify-between gap-2 cursor-grab active:cursor-grabbing select-none touch-none"
        >
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-6 h-6 rounded-md bg-green-50 text-[#16A34A] border border-green-200 flex items-center justify-center flex-shrink-0">
              <Table2 className="w-3.5 h-3.5" />
            </div>
            <span className="text-xs font-bold text-slate-800 truncate">{item.title}</span>
            <span className="text-[10px] font-medium text-slate-500 bg-white border border-slate-200 px-1.5 py-0.5 rounded flex-shrink-0">
              {bodyRows.length + (headerRow.length ? 1 : 0)} dòng · {sheets.length} sheet
            </span>
          </div>

          <div className="flex items-center gap-1 flex-shrink-0">
            <button
              type="button"
              onClick={() => setIsFullView(true)}
              title="Mở toàn màn hình"
              className="p-1.5 rounded-lg text-slate-500 hover:text-[#16A34A] hover:bg-green-50 transition-colors cursor-pointer"
            >
              <Maximize2 className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => removeDeskItem(item.id)}
              title="Xóa bảng"
              className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Scrollable Table Body */}
        <div data-scrollable="true" className="flex-1 overflow-auto bg-white">
          {renderTable(rows, false)}
        </div>

        {/* Sheet Tabs Footer */}
        <div className="px-2 py-1.5 bg-slate-50 border-t border-slate-200 flex items-center gap-1 overflow-x-auto no-scrollbar select-none">
          {sheets.map((sheet, idx) => (
            <button
              key={`${sheet.name}-${idx}`}
              type="button"
              onClick={() => handleSelectSheet(idx)}
              className={`px-2.5 py-1 rounded-md text-[11px] font-semibold whitespace-nowrap transition-colors cursor-pointer ${
                idx === activeSheetIndex
                  ? 'bg-green-50 text-[#16A34A] border border-[#16A34A]'
                  : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
              }`}
            >
              {sheet.name}
            </button>
          ))}
        </div>

        <ItemDrawingOverlay itemId={item.id} />
      </div>

      {/* Fullscreen Spreadsheet Modal */}
      {isFullView &&
        typeof document !== 'undefined' &&
        createPortal(
          <div
            data-overlay="true"
            className="fixed inset-0 z-[9995] bg-slate-900/75 backdrop-blur-xs flex items-center justify-center p-4 md:p-8"
          >
            <div className="bg-white rounded-2xl border border-slate-300 w-full h-full max-w-6xl max-h-[90vh] flex flex-col overflow-hidden shadow-2xl">
              <div className="px-5 py-3.5 border-b border-slate-200 bg-slate-50 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2.5 min-w-0">
                  <Table2 className="w-5 h-5 text-[#16A34A] flex-shrink-0" />
                  <div className="min-w-0">
                    <h3 className="text-sm font-bold text-slate-900 truncate">{item.title}</h3>
                    <p className="text-[11px] text-slate-500">
                      Sheet: {activeSheet?.name} ({rows.length} dòng × {maxCols} cột)
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <div className="relative">
                    <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      placeholder="Lọc dữ liệu..."
                      className="pl-8 pr-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg outline-none focus:border-[#16A34A]"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsFullView(false)}
                    className="p-2 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-200 transition-colors cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div data-scrollable="true" className="flex-1 overflow-auto bg-white">
                {renderTable(rows, true)}
              </div>

              <div className="px-4 py-2.5 bg-slate-50 border-t border-slate-200 flex items-center gap-1.5 overflow-x-auto">
                {sheets.map((sheet, idx) => (
                  <button
                    key={`${sheet.name}-modal-${idx}`}
                    type="button"
                    onClick={() => handleSelectSheet(idx)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer ${
                      idx === activeSheetIndex
                        ? 'bg-green-50 text-[#16A34A] border border-[#16A34A]'
                        : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    {sheet.name}
                  </button>
                ))}
              </div>
            </div>
          </div>,
          document.body
        )}
    </>
  );
});
