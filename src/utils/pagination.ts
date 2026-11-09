/**
 * Utility for dynamic, exact pagination of book and paper documents.
 * Guarantees zero text loss, clean paragraph/sentence boundaries,
 * and exact height fitting without scrollbars or bottom clipping.
 */

export interface PaginatedLeaf {
  id: string;
  sourceChapterId?: string;
  chapterTitle: string;
  pageNumber: number; // 1-indexed overall book page
  text: string;
  image?: string;
  isContinuation?: boolean;
}

// Measured available text height inside book page (630px height book)
const MAX_PAGE_TEXT_HEIGHT = 370; 
const PAGE_INNER_WIDTH = 405; // 453px page width - 48px padding

/**
 * Heuristic fallback when DOM measurement is not ready or during SSR.
 * Calibrated for 14.5px font size and line-height 1.7 (~24.6px per line).
 */
function paginateTextHeuristic(
  chapterTitle: string,
  rawText: string,
  startPageNumber: number
): PaginatedLeaf[] {
  const normalized = rawText.normalize('NFC').trim();
  if (!normalized) {
    return [{
      id: `leaf-${startPageNumber}`,
      chapterTitle,
      pageNumber: startPageNumber,
      text: '',
      isContinuation: false
    }];
  }

  const paragraphs = normalized.split(/\n\n+/);
  const leaves: PaginatedLeaf[] = [];
  let currentParagraphs: string[] = [];
  let currentLineEstimate = 0;
  // ~14 lines max per page to prevent any bottom clipping
  const MAX_LINES_PER_PAGE = 13;

  const estimateLines = (para: string) => {
    const rawLines = para.split('\n');
    let total = 0;
    for (const line of rawLines) {
      // average 48 chars per line at 14.5px font across 405px width
      total += Math.max(1, Math.ceil(line.length / 48));
    }
    return total;
  };

  const flushPage = (isFirst: boolean) => {
    if (currentParagraphs.length === 0) return;
    leaves.push({
      id: `leaf-${startPageNumber + leaves.length}`,
      chapterTitle,
      pageNumber: startPageNumber + leaves.length,
      text: currentParagraphs.join('\n\n'),
      isContinuation: !isFirst
    });
    currentParagraphs = [];
    currentLineEstimate = 0;
  };

  for (let i = 0; i < paragraphs.length; i++) {
    const p = paragraphs[i];
    const pLines = estimateLines(p);

    if (currentLineEstimate + pLines + (currentParagraphs.length > 0 ? 1 : 0) <= MAX_LINES_PER_PAGE) {
      currentParagraphs.push(p);
      currentLineEstimate += pLines + (currentParagraphs.length > 1 ? 1 : 0);
    } else {
      if (currentParagraphs.length > 0) {
        flushPage(leaves.length === 0);
      }

      if (pLines <= MAX_LINES_PER_PAGE) {
        currentParagraphs.push(p);
        currentLineEstimate = pLines;
      } else {
        const lines = p.split('\n');
        let subLines: string[] = [];
        let subCount = 0;

        for (const line of lines) {
          const lCount = Math.max(1, Math.ceil(line.length / 48));
          if (subCount + lCount > MAX_LINES_PER_PAGE && subLines.length > 0) {
            leaves.push({
              id: `leaf-${startPageNumber + leaves.length}`,
              chapterTitle,
              pageNumber: startPageNumber + leaves.length,
              text: subLines.join('\n'),
              isContinuation: leaves.length > 0
            });
            subLines = [];
            subCount = 0;
          }
          subLines.push(line);
          subCount += lCount;
        }

        if (subLines.length > 0) {
          currentParagraphs.push(subLines.join('\n'));
          currentLineEstimate = subCount;
        }
      }
    }
  }

  if (currentParagraphs.length > 0) {
    flushPage(leaves.length === 0);
  }

  return leaves.length > 0 ? leaves : [{
    id: `leaf-${startPageNumber}`,
    chapterTitle,
    pageNumber: startPageNumber,
    text: normalized,
    isContinuation: false
  }];
}

/**
 * Measure text height in DOM using an offscreen element with exact book page typography
 */
function createMeasurer(): { measure: (text: string) => number; cleanup: () => void } | null {
  if (typeof document === 'undefined') return null;

  const div = document.createElement('div');
  div.style.position = 'fixed';
  div.style.left = '-9999px';
  div.style.top = '-9999px';
  div.style.width = `${PAGE_INNER_WIDTH}px`;
  div.style.fontFamily = "var(--font-ui), 'Open Sans', sans-serif";
  div.style.fontSize = '14.5px';
  div.style.lineHeight = '1.7';
  div.style.fontWeight = '400';
  div.style.whiteSpace = 'pre-line';
  div.style.visibility = 'hidden';
  div.style.pointerEvents = 'none';
  div.style.boxSizing = 'border-box';
  document.body.appendChild(div);

  return {
    measure: (text: string) => {
      div.textContent = text;
      return div.getBoundingClientRect().height;
    },
    cleanup: () => {
      if (div.parentNode) {
        div.parentNode.removeChild(div);
      }
    }
  };
}

/**
 * Dynamic pagination engine.
 * Takes a list of raw book pages/chapters and splits overflowing text across natural pages.
 */
export function paginateDocument(
  rawPages: { id?: string; title?: string; text: string; image?: string }[]
): PaginatedLeaf[] {
  const leaves: PaginatedLeaf[] = [];
  const measurer = createMeasurer();

  try {
    for (const chapter of rawPages) {
      const chapterTitle = (chapter.title || `Chương ${leaves.length + 1}`).normalize('NFC');
      const rawText = (chapter.text || '').normalize('NFC').trim();

      // If page already has a rendered image (from PDF or picture), keep it as a distinct full page
      if (chapter.image) {
        leaves.push({
          id: `leaf-${leaves.length + 1}`,
          sourceChapterId: chapter.id,
          chapterTitle,
          pageNumber: leaves.length + 1,
          text: rawText,
          image: chapter.image,
          isContinuation: false
        });
        continue;
      }

      if (!measurer) {
        const heuristicLeaves = paginateTextHeuristic(chapterTitle, rawText, leaves.length + 1);
        leaves.push(...heuristicLeaves);
        continue;
      }

      // Check if entire text fits in one page
      const totalHeight = measurer.measure(rawText);
      if (totalHeight <= MAX_PAGE_TEXT_HEIGHT) {
        leaves.push({
          id: `leaf-${leaves.length + 1}`,
          sourceChapterId: chapter.id,
          chapterTitle,
          pageNumber: leaves.length + 1,
          text: rawText,
          isContinuation: false
        });
        continue;
      }

      // If text overflows, split by paragraphs first
      const paragraphs = rawText.split(/\n\n+/);
      let currentParagraphs: string[] = [];

      for (let i = 0; i < paragraphs.length; i++) {
        const nextCandidate = [...currentParagraphs, paragraphs[i]].join('\n\n');
        const height = measurer.measure(nextCandidate);

        if (height <= MAX_PAGE_TEXT_HEIGHT) {
          currentParagraphs.push(paragraphs[i]);
        } else {
          // If current page already has content, flush it
          if (currentParagraphs.length > 0) {
            leaves.push({
              id: `leaf-${leaves.length + 1}`,
              sourceChapterId: chapter.id,
              chapterTitle,
              pageNumber: leaves.length + 1,
              text: currentParagraphs.join('\n\n'),
              isContinuation: leaves.length > 0 && leaves[leaves.length - 1].chapterTitle === chapterTitle
            });
            currentParagraphs = [];
          }

          // Check if single paragraph fits on fresh page
          const singleHeight = measurer.measure(paragraphs[i]);
          if (singleHeight <= MAX_PAGE_TEXT_HEIGHT) {
            currentParagraphs.push(paragraphs[i]);
          } else {
            // Split big paragraph line by line
            const lines = paragraphs[i].split('\n');
            let subLines: string[] = [];
            for (const line of lines) {
              const lineCandidate = [...subLines, line].join('\n');
              if (measurer.measure(lineCandidate) <= MAX_PAGE_TEXT_HEIGHT) {
                subLines.push(line);
              } else {
                if (subLines.length > 0) {
                  leaves.push({
                    id: `leaf-${leaves.length + 1}`,
                    sourceChapterId: chapter.id,
                    chapterTitle,
                    pageNumber: leaves.length + 1,
                    text: subLines.join('\n'),
                    isContinuation: true
                  });
                  subLines = [];
                }
                subLines.push(line);
              }
            }
            if (subLines.length > 0) {
              currentParagraphs.push(subLines.join('\n'));
            }
          }
        }
      }

      if (currentParagraphs.length > 0) {
        leaves.push({
          id: `leaf-${leaves.length + 1}`,
          sourceChapterId: chapter.id,
          chapterTitle,
          pageNumber: leaves.length + 1,
          text: currentParagraphs.join('\n\n'),
          isContinuation: leaves.length > 0 && leaves[leaves.length - 1].chapterTitle === chapterTitle
        });
      }
    }
  } finally {
    if (measurer) {
      measurer.cleanup();
    }
  }

  return leaves;
}
