'use client';

import React from 'react';
import { useStudySpace } from '@/context/StudySpaceContext';

export const DeskDrawingCanvas = React.memo(function DeskDrawingCanvas() {
  const { strokes, currentStroke } = useStudySpace();

  // Helper to convert points to SVG Path data
  // For geometric polygons (triangle, square, rectangle <= 8 points): renders crisp straight lines L and sharp corners
  // For freehand drawing & circles (many points): renders smooth midpoint quadratic curves Q
  const pointsToSvgPath = (points: { x: number; y: number }[]) => {
    if (points.length < 2) return '';
    if (points.length === 2) {
      return `M ${points[0].x} ${points[0].y} L ${points[1].x} ${points[1].y}`;
    }

    const first = points[0];
    const last = points[points.length - 1];
    const isClosedPolygon = points.length <= 8 && Math.hypot(first.x - last.x, first.y - last.y) < 10;

    // Polygons: straight lines between vertices (triangles, squares, rectangles)
    if (isClosedPolygon) {
      let d = `M ${points[0].x} ${points[0].y}`;
      for (let i = 1; i < points.length; i++) {
        d += ` L ${points[i].x} ${points[i].y}`;
      }
      d += ' Z';
      return d;
    }

    // Freehand strokes & smooth circles: midpoint quadratic bezier curves
    let d = `M ${points[0].x} ${points[0].y}`;
    for (let i = 1; i < points.length - 1; i++) {
      const p1 = points[i];
      const p2 = points[i + 1];
      const midX = (p1.x + p2.x) / 2;
      const midY = (p1.y + p2.y) / 2;
      d += ` Q ${p1.x} ${p1.y}, ${midX} ${midY}`;
    }
    const lastPt = points[points.length - 1];
    d += ` L ${lastPt.x} ${lastPt.y}`;
    if (Math.hypot(first.x - lastPt.x, first.y - lastPt.y) < 10) {
      d += ' Z';
    }
    return d;
  };

  const renderStrokeElement = (stroke: import('@/types/studyspace').DrawingStroke) => {
    const isHigh = stroke.isHighlighter;
    const strokeWidth = isHigh ? (stroke.width || 14) : (stroke.width || 2.5);
    const opacity = isHigh ? 0.65 : 0.9;
    const blendMode = isHigh ? ('multiply' as const) : ('normal' as const);

    if (stroke.points.length === 1) {
      return (
        <circle
          key={stroke.id}
          cx={stroke.points[0].x}
          cy={stroke.points[0].y}
          r={strokeWidth / 2}
          fill={stroke.color}
          opacity={opacity}
          style={{ mixBlendMode: blendMode }}
        />
      );
    }

    const pathData = pointsToSvgPath(stroke.points);
    if (!pathData) return null;

    return (
      <path
        key={stroke.id}
        d={pathData}
        stroke={stroke.color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeOpacity={opacity}
        style={{ mixBlendMode: blendMode }}
        fill="none"
      />
    );
  };

  return (
    <>
      {/* Completed Desk Strokes (not attached to any document) */}
      <svg 
        className="absolute inset-0 pointer-events-none z-10 overflow-visible"
        style={{ width: 10000, height: 10000, left: -5000, top: -5000 }}
      >
        <g transform="translate(5000, 5000)">
          {strokes.filter(s => !s.attachedToItemId).map(renderStrokeElement)}
        </g>
      </svg>

      {/* Current Active Stroke (Topmost layer z-[1000] visible directly under cursor across all books and documents in real time) */}
      {currentStroke && currentStroke.points.length > 0 && (
        <svg 
          className="absolute inset-0 pointer-events-none overflow-visible"
          style={{ width: 10000, height: 10000, left: -5000, top: -5000, zIndex: 1000 }}
        >
          <g transform="translate(5000, 5000)">
            {renderStrokeElement(currentStroke)}
          </g>
        </svg>
      )}
    </>
  );
});
