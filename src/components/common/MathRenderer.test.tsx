import { describe, it, expect, beforeEach } from 'vitest';
import { 
  katexHtmlCache, 
  renderKatexWithCache, 
  clearKatexCache, 
  getKatexCacheSize 
} from './MathRenderer';

describe('MathRenderer - katexHtmlCache', () => {
  beforeEach(() => {
    clearKatexCache();
  });

  it('compiles math and stores in katexHtmlCache on first run', () => {
    expect(getKatexCacheSize()).toBe(0);

    const equation = 'E = mc^2';
    const html1 = renderKatexWithCache(equation, false);
    expect(html1).toContain('katex');
    expect(getKatexCacheSize()).toBe(1);

    // Second run should read directly from katexHtmlCache with 0ms compilation
    const html2 = renderKatexWithCache(equation, false);
    expect(html2).toBe(html1);
    expect(getKatexCacheSize()).toBe(1);
    expect(katexHtmlCache.has('I:E = mc^2')).toBe(true);
  });

  it('distinguishes between inline and display mode in cache keys', () => {
    const math = '\\int_0^1 x dx';
    renderKatexWithCache(math, false);
    renderKatexWithCache(math, true);

    expect(getKatexCacheSize()).toBe(2);
    expect(katexHtmlCache.has(`I:${math}`)).toBe(true);
    expect(katexHtmlCache.has(`D:${math}`)).toBe(true);
  });
});
