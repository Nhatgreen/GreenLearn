'use client';

import React from 'react';
import katex from 'katex';

interface MathRendererProps {
  content: string;
  className?: string;
}

// Global cache for compiled KaTeX HTML to guarantee 0ms overhead on re-renders
const katexHtmlCache = new Map<string, string>();

function renderKatexWithCache(math: string, displayMode: boolean): string {
  const cacheKey = `${displayMode ? 'D:' : 'I:'}${math}`;
  const hit = katexHtmlCache.get(cacheKey);
  if (hit !== undefined) return hit;

  try {
    const html = katex.renderToString(math, { displayMode, throwOnError: false });
    katexHtmlCache.set(cacheKey, html);
    return html;
  } catch {
    return '';
  }
}

/**
 * MathRenderer parses content containing LaTeX math ($...$ or $$...$$)
 * or common mathematical expressions and renders them via KaTeX with fallback.
 * Memoized with global compile cache to eliminate render lag during zoom/pan.
 */
export const MathRenderer = React.memo(function MathRenderer({ content, className = '' }: MathRendererProps) {
  if (!content) return null;

  // Split content by inline $...$ or block $$...$$ math delimiters
  const mathRegex = /(\$\$[\s\S]+?\$\$|\$[^\$\n]+?\$)/g;
  const parts = content.split(mathRegex);

  return (
    <span className={`inline-math-container ${className}`}>
      {parts.map((part, index) => {
        if (!part) return null;

        if (part.startsWith('$$') && part.endsWith('$$')) {
          const rawMath = part.slice(2, -2).trim();
          const html = renderKatexWithCache(rawMath, true);
          if (html) {
            return (
              <span 
                key={index} 
                className="block my-2.5 overflow-x-auto no-scrollbar py-1"
                dangerouslySetInnerHTML={{ __html: html }} 
              />
            );
          }
          return <code key={index} className="block my-2 font-mono text-xs">{rawMath}</code>;
        }

        if (part.startsWith('$') && part.endsWith('$')) {
          const rawMath = part.slice(1, -1).trim();
          const html = renderKatexWithCache(rawMath, false);
          if (html) {
            return (
              <span 
                key={index} 
                className="inline-block px-0.5"
                dangerouslySetInnerHTML={{ __html: html }} 
              />
            );
          }
          return <code key={index} className="font-mono text-xs">{rawMath}</code>;
        }

        // Normal text: handle line breaks and bold markers
        return <span key={index}>{part}</span>;
      })}
    </span>
  );
});
