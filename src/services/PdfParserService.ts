'use client';

import { getAssetPath } from '@/lib/assets';

export interface ParsedPage {
  id: string;
  pageNumber: number;
  title: string;
  text: string;
  image?: string;
}

/**
 * Service to parse real PDF files in browser, extracting both
 * clean text content and high-resolution rendered page images.
 */
export async function parsePdfFile(file: File): Promise<ParsedPage[]> {
  try {
    // Dynamic import to avoid SSR issues with canvas/worker in Next.js
    const pdfjsLib = await import('pdfjs-dist');

    if (typeof window !== 'undefined' && !pdfjsLib.GlobalWorkerOptions.workerSrc) {
      // Use local worker copied to public/
      pdfjsLib.GlobalWorkerOptions.workerSrc = getAssetPath('/pdf.worker.min.mjs');
    }

    const arrayBuffer = await file.arrayBuffer();
    const loadingTask = pdfjsLib.getDocument({
      data: new Uint8Array(arrayBuffer),
      cMapUrl: 'https://unpkg.com/pdfjs-dist@4.10.38/cmaps/',
      cMapPacked: true,
    });

    const pdfDoc = await loadingTask.promise;
    const numPages = pdfDoc.numPages;
    const rawName = file.name.replace(/\.[^/.]+$/, '');
    const pages: ParsedPage[] = [];

    for (let i = 1; i <= numPages; i++) {
      const page = await pdfDoc.getPage(i);

      // 1. Extract text content
      let pageText = '';
      try {
        const textContent = await page.getTextContent();
        pageText = textContent.items
          .map((item: any) => item.str || '')
          .join(' ')
          .replace(/\s+/g, ' ')
          .trim();
      } catch (err) {
        console.warn(`Lỗi trích xuất chữ trang ${i}:`, err);
      }

      // 2. Render page to image via HTML5 Canvas
      let imageDataUrl: string | undefined = undefined;
      try {
        // Scale 1.5 provides crisp reading resolution on desktop
        const viewport = page.getViewport({ scale: 1.5 });
        const canvas = document.createElement('canvas');
        canvas.width = viewport.width;
        canvas.height = viewport.height;
        const ctx = canvas.getContext('2d');

        if (ctx) {
          await page.render({
            canvasContext: ctx,
            viewport,
          }).promise;

          imageDataUrl = canvas.toDataURL('image/jpeg', 0.88);
        }
      } catch (err) {
        console.warn(`Lỗi render ảnh trang ${i}:`, err);
      }

      pages.push({
        id: `pdf-page-${i}`,
        pageNumber: i,
        title: `${rawName} - Trang ${i}`,
        text: pageText || (imageDataUrl ? `[Trang ${i} - Bản quét tài liệu]` : `Trang ${i}`),
        image: imageDataUrl,
      });

      // Cleanup memory
      page.cleanup();
    }

    return pages;
  } catch (error) {
    console.error('Lỗi phân tích file PDF:', error);
    throw error;
  }
}
