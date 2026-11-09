/**
 * Smart Shape Recognition for ViTudy Canvas
 * Accurately recognizes and beautifies messy hand-drawn sketches into:
 * - Straight Line (with 8-degree horizontal/vertical snapping)
 * - Triangle (equilateral / arbitrary triangles)
 * - Square (aspect ratio ~1.0)
 * - Rectangle (elongated quadrilaterals)
 * - Circle (smooth curvature, aspect ratio ~1.0)
 * - Ellipse (smooth curvature, elongated)
 */

export interface Point {
  x: number;
  y: number;
}

export function recognizeSmartShape(points: Point[]): Point[] {
  if (!points || points.length < 5) return points;

  const n = points.length;
  const p0 = points[0];
  const pN = points[n - 1];

  let minX = Infinity;
  let maxX = -Infinity;
  let minY = Infinity;
  let maxY = -Infinity;

  let totalPathLength = 0;
  for (let i = 0; i < n; i++) {
    const p = points[i];
    if (p.x < minX) minX = p.x;
    if (p.x > maxX) maxX = p.x;
    if (p.y < minY) minY = p.y;
    if (p.y > maxY) maxY = p.y;

    if (i > 0) {
      totalPathLength += Math.hypot(p.x - points[i - 1].x, p.y - points[i - 1].y);
    }
  }

  const w = maxX - minX;
  const h = maxY - minY;
  if (w < 8 && h < 8) return points;

  const cx = minX + w / 2;
  const cy = minY + h / 2;
  const endsDist = Math.hypot(pN.x - p0.x, pN.y - p0.y);
  const maxDim = Math.max(w, h);

  // 1. OPEN STROKE -> Check if Straight Line
  const isClosed = endsDist / (maxDim || 1) < 0.38 || endsDist < 38;

  if (!isClosed) {
    if (endsDist > totalPathLength * 0.78) {
      const angle = Math.atan2(pN.y - p0.y, pN.x - p0.x);
      const absAngle = Math.abs(angle);
      const snapThreshold = 0.16; // ~9.2 degrees

      const snappedP0 = { ...p0 };
      const snappedPN = { ...pN };

      if (absAngle < snapThreshold || Math.abs(absAngle - Math.PI) < snapThreshold) {
        // Horizontal line snap
        const midY = (p0.y + pN.y) / 2;
        snappedP0.y = Math.round(midY);
        snappedPN.y = Math.round(midY);
      } else if (Math.abs(absAngle - Math.PI / 2) < snapThreshold) {
        // Vertical line snap
        const midX = (p0.x + pN.x) / 2;
        snappedP0.x = Math.round(midX);
        snappedPN.x = Math.round(midX);
      }

      return [snappedP0, snappedPN];
    }
    return points;
  }

  // 2. CLOSED STROKE ANALYSIS
  const aspectRatio = w / (h || 1);
  const boxArea = (w * h) || 1;
  const area = calculateShoelaceArea(points);
  const fillRatio = area / boxArea;

  // Ramer-Douglas-Peucker polygon simplification to find corners (optimal ~4.5% tolerance)
  const simplified = ramerDouglasPeucker(points, Math.max(7, maxDim * 0.045));
  const cornerCount = Math.max(2, simplified.length - 1);
  const sharpCorners = countSharpCorners(points, maxDim);

  // Measure radius variation from center for curve smoothness check
  let sumR = 0;
  for (let i = 0; i < n; i++) {
    sumR += Math.hypot(points[i].x - cx, points[i].y - cy);
  }
  const meanR = sumR / n;
  let sumVarR = 0;
  for (let i = 0; i < n; i++) {
    const r = Math.hypot(points[i].x - cx, points[i].y - cy);
    sumVarR += (r - meanR) ** 2;
  }
  const cvR = Math.sqrt(sumVarR / n) / (meanR || 1);

  // 2A. TRIANGLE
  // Mathematical fact: Maximum area of an enclosed triangle in a bounding box is 0.50 * boxArea.
  // With hand-drawn curvature, fillRatio for a triangle is strictly <= 0.62.
  const isTriangleCandidate = fillRatio <= 0.62 && (cornerCount === 3 || sharpCorners === 3 || (cornerCount <= 4 && fillRatio < 0.56));
  if (isTriangleCandidate) {
    const triangleCorners = findBestTriangleCorners(simplified.length >= 3 ? simplified : points);
    if (triangleCorners && triangleCorners.length === 4) {
      return triangleCorners;
    }
  }

  // 2B. SQUARE / RECTANGLE (QUADRILATERAL)
  // Boxy shapes have distinct sharp corners (sharpCorners >= 2 or cornerCount === 4 with fillRatio >= 0.68)
  // Pure smooth curves (circles & ellipses) have sharpCorners <= 1
  const hasMultipleSharpCorners = sharpCorners >= 2;
  const isBoxy = hasMultipleSharpCorners || (cornerCount === 4 && fillRatio >= 0.68);
  const isQuadrilateral = fillRatio >= 0.63 && isBoxy;

  if (isQuadrilateral) {
    // If aspect ratio is close to 1, snap to a neat Square (generous 0.70 - 1.42 for freehand mouse drawing)
    if (aspectRatio >= 0.70 && aspectRatio <= 1.42) {
      const side = (w + h) / 2;
      const half = side / 2;
      return [
        { x: Math.round(cx - half), y: Math.round(cy - half) },
        { x: Math.round(cx + half), y: Math.round(cy - half) },
        { x: Math.round(cx + half), y: Math.round(cy + half) },
        { x: Math.round(cx - half), y: Math.round(cy + half) },
        { x: Math.round(cx - half), y: Math.round(cy - half) }
      ];
    }

    // Standard neat Rectangle
    return [
      { x: Math.round(minX), y: Math.round(minY) },
      { x: Math.round(maxX), y: Math.round(minY) },
      { x: Math.round(maxX), y: Math.round(maxY) },
      { x: Math.round(minX), y: Math.round(maxY) },
      { x: Math.round(minX), y: Math.round(minY) }
    ];
  }

  // 2C. CIRCLE
  // Smooth curvature (low cvR, no sharp corners) with aspect ratio ~1 (0.65 - 1.55)
  if (aspectRatio >= 0.65 && aspectRatio <= 1.55) {
    const radius = (w + h) / 4;
    const circlePoints: Point[] = [];
    const steps = 40;
    for (let i = 0; i <= steps; i++) {
      const theta = (i / steps) * 2 * Math.PI;
      circlePoints.push({
        x: Math.round(cx + radius * Math.cos(theta)),
        y: Math.round(cy + radius * Math.sin(theta))
      });
    }
    return circlePoints;
  }

  // 2D. ELLIPSE (Elongated oval: aspect ratio < 0.65 or > 1.55)
  const rx = w / 2;
  const ry = h / 2;
  const ellipsePoints: Point[] = [];
  const steps = 40;
  for (let i = 0; i <= steps; i++) {
    const theta = (i / steps) * 2 * Math.PI;
    ellipsePoints.push({
      x: Math.round(cx + rx * Math.cos(theta)),
      y: Math.round(cy + ry * Math.sin(theta))
    });
  }
  return ellipsePoints;
}

function calculateShoelaceArea(pts: Point[]): number {
  let area = 0;
  const n = pts.length;
  for (let i = 0; i < n - 1; i++) {
    area += pts[i].x * pts[i + 1].y - pts[i + 1].x * pts[i].y;
  }
  return Math.abs(area) / 2;
}

function findBestTriangleCorners(pts: Point[]): Point[] {
  const uniquePts: Point[] = [];
  for (const p of pts) {
    const isDup = uniquePts.some(u => Math.hypot(u.x - p.x, u.y - p.y) < 5);
    if (!isDup) uniquePts.push(p);
  }

  if (uniquePts.length < 3) return [];

  if (uniquePts.length === 3) {
    return [uniquePts[0], uniquePts[1], uniquePts[2], uniquePts[0]];
  }

  // Find 3 vertices that maximize triangle area
  let maxArea = -1;
  let bestTriangle: Point[] = [];
  const len = uniquePts.length;

  for (let i = 0; i < len; i++) {
    for (let j = i + 1; j < len; j++) {
      for (let k = j + 1; k < len; k++) {
        const p1 = uniquePts[i];
        const p2 = uniquePts[j];
        const p3 = uniquePts[k];
        const area = Math.abs(p1.x * (p2.y - p3.y) + p2.x * (p3.y - p1.y) + p3.x * (p1.y - p2.y)) / 2;
        if (area > maxArea) {
          maxArea = area;
          bestTriangle = [p1, p2, p3, p1];
        }
      }
    }
  }

  return bestTriangle;
}

function ramerDouglasPeucker(points: Point[], epsilon: number): Point[] {
  if (points.length <= 2) return points;

  let dmax = 0;
  let index = 0;
  const last = points.length - 1;

  for (let i = 1; i < last; i++) {
    const d = perpendicularDistance(points[i], points[0], points[last]);
    if (d > dmax) {
      index = i;
      dmax = d;
    }
  }

  if (dmax > epsilon) {
    const recResults1 = ramerDouglasPeucker(points.slice(0, index + 1), epsilon);
    const recResults2 = ramerDouglasPeucker(points.slice(index), epsilon);
    return [...recResults1.slice(0, -1), ...recResults2];
  }

  return [points[0], points[last]];
}

function perpendicularDistance(p: Point, p1: Point, p2: Point): number {
  const dx = p2.x - p1.x;
  const dy = p2.y - p1.y;
  if (dx === 0 && dy === 0) {
    return Math.hypot(p.x - p1.x, p.y - p1.y);
  }
  const numerator = Math.abs(dy * p.x - dx * p.y + p2.x * p1.y - p2.y * p1.x);
  const denominator = Math.hypot(dx, dy);
  return numerator / denominator;
}

function countSharpCorners(points: Point[], maxDim: number): number {
  if (points.length < 5) return 0;
  const simplified = ramerDouglasPeucker(points, Math.max(6, maxDim * 0.05));
  if (simplified.length < 3) return 0;

  let sharpCount = 0;
  const m = simplified.length;
  for (let i = 1; i < m - 1; i++) {
    const prev = simplified[i - 1];
    const curr = simplified[i];
    const next = simplified[i + 1];

    const d1 = Math.hypot(curr.x - prev.x, curr.y - prev.y);
    const d2 = Math.hypot(next.x - curr.x, next.y - curr.y);
    if (d1 < 6 || d2 < 6) continue;

    const v1x = curr.x - prev.x;
    const v1y = curr.y - prev.y;
    const v2x = next.x - curr.x;
    const v2y = next.y - curr.y;

    const dot = v1x * v2x + v1y * v2y;
    const cosAngle = dot / (d1 * d2);
    const turnAngleDeg = Math.acos(Math.max(-1, Math.min(1, cosAngle))) * (180 / Math.PI);
    if (turnAngleDeg >= 48 && turnAngleDeg <= 145) {
      sharpCount++;
    }
  }
  return sharpCount;
}
