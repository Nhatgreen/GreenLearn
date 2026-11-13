'use client';

import React from 'react';
import katex from 'katex';
import 'katex/dist/katex.min.css';

interface MathRendererProps {
  content: string;
  className?: string;
}

/**
 * Bộ nhớ đệm toàn cục KaTeX (katexHtmlCache).
 * Lưu trữ chuỗi HTML đã biên dịch của các công thức LaTeX,
 * triệt tiêu hoàn toàn chi phí re-compile (0ms) khi di chuyển, phóng to thu nhỏ
 * hoặc render lại canvas 2.5D.
 */
export const katexHtmlCache = new Map<string, string>();

/**
 * Trả về kích thước hiện tại của bộ đệm KaTeX HTML
 */
export function getKatexCacheSize(): number {
  return katexHtmlCache.size;
}

/**
 * Xóa trắng bộ đệm KaTeX HTML
 */
export function clearKatexCache(): void {
  katexHtmlCache.clear();
}

export function renderKatexWithCache(math: string, displayMode: boolean): string {
  const cacheKey = `${displayMode ? 'D' : 'I'}:${math}`;
  if (katexHtmlCache.has(cacheKey)) {
    return katexHtmlCache.get(cacheKey)!;
  }

  try {
    const rendered = katex.renderToString(math, {
      displayMode,
      throwOnError: false,
      output: 'html',
    });
    katexHtmlCache.set(cacheKey, rendered);
    return rendered;
  } catch {
    return '';
  }
}

/**
 * Render inline elements (KaTeX math and Markdown bold) within a text span
 */
function renderInlineContent(text: string): React.ReactNode {
  if (!text) return null;

  // Split by inline math ($...$ or \(...\))
  const mathRegex = /(\\\([\s\S]+?\\\)|\$[^\$\n]+?\$)/g;
  const parts = text.split(mathRegex);

  return parts.map((part, index) => {
    if (!part) return null;

    // Inline Math: \(...\)
    if (part.startsWith('\\(') && part.endsWith('\\)')) {
      const rawMath = part.slice(2, -2).trim();
      const html = renderKatexWithCache(rawMath, false);
      if (html) {
        return (
          <span 
            key={index} 
            className="inline-block px-0.5 align-baseline"
            dangerouslySetInnerHTML={{ __html: html }} 
          />
        );
      }
      return <code key={index} className="font-mono text-xs">{rawMath}</code>;
    }

    // Inline Math: $...$
    if (part.startsWith('$') && part.endsWith('$')) {
      const rawMath = part.slice(1, -1).trim();
      const html = renderKatexWithCache(rawMath, false);
      if (html) {
        return (
          <span 
            key={index} 
            className="inline-block px-0.5 align-baseline"
            dangerouslySetInnerHTML={{ __html: html }} 
          />
        );
      }
      return <code key={index} className="font-mono text-xs">{rawMath}</code>;
    }

    // Bold text: **...**
    const boldRegex = /(\*\*[^*]+?\*\*)/g;
    const textSegments = part.split(boldRegex);

    return (
      <span key={index}>
        {textSegments.map((seg, sIdx) => {
          if (seg.startsWith('**') && seg.endsWith('**')) {
            return (
              <strong key={sIdx} className="font-bold text-slate-900">
                {seg.slice(2, -2)}
              </strong>
            );
          }
          return seg;
        })}
      </span>
    );
  });
}

/**
 * MathRenderer parses content containing Markdown headings (##, ###), lists (• / -),
 * and LaTeX math ($...$, $$...$$, \(...\), \[...\]).
 * Memoized with global compile cache to eliminate render lag.
 */
export const MathRenderer = React.memo(function MathRenderer({ content, className = '' }: MathRendererProps) {
  if (!content) return null;

  // 1. First split by Block Math ($$...$$ or \[...\])
  const blockMathRegex = /(\$\$[\s\S]+?\$\$|\\\[[\s\S]+?\\\])/g;
  const rawBlocks = content.split(blockMathRegex);

  return (
    <div className={`math-rendered-document leading-[1.6] text-justify ${className}`}>
      {rawBlocks.map((block, bIdx) => {
        if (!block) return null;

        // Block Display Math ($$...$$ or \[...\]) with minimum 16px vertical margins
        if ((block.startsWith('$$') && block.endsWith('$$')) || (block.startsWith('\\[') && block.endsWith('\\]'))) {
          const rawMath = block.slice(2, -2).trim();
          const html = renderKatexWithCache(rawMath, true);
          if (html) {
            return (
              <div 
                key={bIdx} 
                className="my-4 py-1.5 overflow-x-auto no-scrollbar text-center"
                dangerouslySetInnerHTML={{ __html: html }} 
              />
            );
          }
          return <code key={bIdx} className="block my-4 font-mono text-xs text-center">{rawMath}</code>;
        }

        // 2. Parse lines for Headings, Lists, and Paragraphs
        const lines = block.split('\n');
        const elements: React.ReactNode[] = [];
        let currentListItems: string[] = [];

        const flushList = () => {
          if (currentListItems.length > 0) {
            const listKey = `list-${elements.length}`;
            elements.push(
              <ul key={listKey} className="space-y-1.5 my-2.5 pl-1 not-italic">
                {currentListItems.map((itemText, iIdx) => (
                  <li key={iIdx} className="flex items-start gap-2 text-slate-800">
                    <span className="text-[#16A34A] font-bold leading-none mt-1 select-none shrink-0">•</span>
                    <span className="flex-1 leading-[1.6]">{renderInlineContent(itemText)}</span>
                  </li>
                ))}
              </ul>
            );
            currentListItems = [];
          }
        };

        for (let i = 0; i < lines.length; i++) {
          const line = lines[i].trim();
          if (!line) {
            flushList();
            continue;
          }

          // Heading 2: ## Title
          if (line.startsWith('## ')) {
            flushList();
            const headingText = line.replace(/^##\s+/, '');
            elements.push(
              <div 
                key={`h2-${i}`} 
                className="text-base md:text-lg font-bold text-slate-900 my-3.5 block border-b border-slate-200/70 pb-1"
              >
                {renderInlineContent(headingText)}
              </div>
            );
            continue;
          }

          // Heading 3: ### Title
          if (line.startsWith('### ')) {
            flushList();
            const headingText = line.replace(/^###\s+/, '');
            elements.push(
              <div 
                key={`h3-${i}`} 
                className="text-sm md:text-base font-bold text-slate-900 my-2.5 block"
              >
                {renderInlineContent(headingText)}
              </div>
            );
            continue;
          }

          // Bullet list items starting with • or - or *
          if (/^[•\-*]\s+/.test(line)) {
            const itemText = line.replace(/^[•\-*]\s+/, '');
            currentListItems.push(itemText);
            continue;
          }

          // If a line contains inline bullets like "Trong đó: • a ... • b ..."
          if (line.includes('•')) {
            const parts = line.split(/•\s*/);
            const prefix = parts[0]?.trim();
            if (prefix) {
              flushList();
              elements.push(
                <p key={`p-${i}`} className="my-1.5 text-slate-800 leading-[1.6]">
                  {renderInlineContent(prefix)}
                </p>
              );
            }
            for (let pIdx = 1; pIdx < parts.length; pIdx++) {
              const bulletText = parts[pIdx].trim();
              if (bulletText) {
                currentListItems.push(bulletText);
              }
            }
            continue;
          }

          // Normal Paragraph
          flushList();
          elements.push(
            <p key={`p-${i}`} className="my-2 text-slate-800 leading-[1.6]">
              {renderInlineContent(line)}
            </p>
          );
        }

        flushList();

        return <div key={bIdx}>{elements}</div>;
      })}
    </div>
  );
});
