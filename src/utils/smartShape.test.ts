import { describe, it, expect } from 'vitest';
import { recognizeSmartShape, Point } from './smartShape';

describe('recognizeSmartShape', () => {
  it('recognizes a straight horizontal line and snaps it', () => {
    const points: Point[] = [
      { x: 10, y: 50 },
      { x: 30, y: 51 },
      { x: 60, y: 49 },
      { x: 90, y: 50 },
      { x: 120, y: 50 },
    ];
    const res = recognizeSmartShape(points);
    expect(res).toHaveLength(2);
    expect(res[0].y).toBe(res[1].y); // Snapped horizontal
  });

  it('recognizes a square and returns a 5-point closed quadrilateral', () => {
    const square: Point[] = [];
    const size = 100;
    for (let i = 0; i <= 10; i++) square.push({ x: (i / 10) * size, y: 0 });
    for (let i = 0; i <= 10; i++) square.push({ x: size, y: (i / 10) * size });
    for (let i = 0; i <= 10; i++) square.push({ x: size - (i / 10) * size, y: size });
    for (let i = 0; i <= 10; i++) square.push({ x: 0, y: size - (i / 10) * size });

    const res = recognizeSmartShape(square);
    expect(res).toHaveLength(5);
    // Closed shape: first point equals last point
    expect(res[0]).toEqual(res[4]);
    // Width and height should be approximately equal (square)
    const w = Math.abs(res[1].x - res[0].x);
    const h = Math.abs(res[2].y - res[1].y);
    expect(Math.abs(w - h)).toBeLessThanOrEqual(2);
  });

  it('recognizes a triangle and returns a 4-point closed polygon', () => {
    const triangle: Point[] = [];
    const size = 100;
    // Top to bottom-right
    for (let i = 0; i <= 10; i++) triangle.push({ x: 50 + (i / 10) * 50, y: (i / 10) * size });
    // Bottom-right to bottom-left
    for (let i = 0; i <= 10; i++) triangle.push({ x: 100 - (i / 10) * 100, y: size });
    // Bottom-left to top
    for (let i = 0; i <= 10; i++) triangle.push({ x: (i / 10) * 50, y: size - (i / 10) * size });

    const res = recognizeSmartShape(triangle);
    expect(res).toHaveLength(4); // 3 vertices + 1 closing point
    expect(res[0]).toEqual(res[3]);
  });

  it('recognizes a rectangle and returns a 5-point closed polygon', () => {
    const rect: Point[] = [];
    for (let i = 0; i <= 10; i++) rect.push({ x: (i / 10) * 200, y: 0 });
    for (let i = 0; i <= 10; i++) rect.push({ x: 200, y: (i / 10) * 80 });
    for (let i = 0; i <= 10; i++) rect.push({ x: 200 - (i / 10) * 200, y: 80 });
    for (let i = 0; i <= 10; i++) rect.push({ x: 0, y: 80 - (i / 10) * 80 });

    const res = recognizeSmartShape(rect);
    expect(res).toHaveLength(5);
    expect(res[0]).toEqual(res[4]);
    const w = Math.abs(res[1].x - res[0].x);
    const h = Math.abs(res[2].y - res[1].y);
    expect(w).toBeGreaterThan(h * 1.5);
  });

  it('recognizes a circle and returns smooth interpolated points', () => {
    const circle: Point[] = [];
    const radius = 60;
    const steps = 40;
    for (let i = 0; i <= steps; i++) {
      const th = (i / steps) * 2 * Math.PI;
      circle.push({
        x: Math.round(100 + radius * Math.cos(th)),
        y: Math.round(100 + radius * Math.sin(th))
      });
    }

    const res = recognizeSmartShape(circle);
    // Circles return 41 points (steps + 1)
    expect(res.length).toBeGreaterThanOrEqual(30);
    expect(res[0]).toEqual(res[res.length - 1]);
  });

  it('recognizes hand-drawn imperfect circle with aspect ratio 1.35 as Circle (not Ellipse or Square)', () => {
    const imperfectCircle: Point[] = [];
    const steps = 40;
    // rx = 68, ry = 50 -> aspectRatio = 1.36 (common hand-drawn mouse oval)
    for (let i = 0; i <= steps; i++) {
      const th = (i / steps) * 2 * Math.PI;
      // Add small hand tremor
      const wobble = ((i % 3) - 1) * 1.5;
      imperfectCircle.push({
        x: Math.round(150 + (68 + wobble) * Math.cos(th)),
        y: Math.round(150 + (50 + wobble) * Math.sin(th))
      });
    }

    const res = recognizeSmartShape(imperfectCircle);
    expect(res.length).toBeGreaterThanOrEqual(30); // Interpolated circle
    // Bounding box of the output circle should be perfectly square (width == height)
    let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
    for (const p of res) {
      if (p.x < minX) minX = p.x;
      if (p.x > maxX) maxX = p.x;
      if (p.y < minY) minY = p.y;
      if (p.y > maxY) maxY = p.y;
    }
    const outW = maxX - minX;
    const outH = maxY - minY;
    expect(Math.abs(outW - outH)).toBeLessThanOrEqual(2); // Perfectly round!
  });

  it('recognizes deliberate elongated oval (aspect ratio 2.2) as Ellipse', () => {
    const deliberateEllipse: Point[] = [];
    const steps = 40;
    for (let i = 0; i <= steps; i++) {
      const th = (i / steps) * 2 * Math.PI;
      deliberateEllipse.push({
        x: Math.round(200 + 110 * Math.cos(th)),
        y: Math.round(200 + 50 * Math.sin(th))
      });
    }

    const res = recognizeSmartShape(deliberateEllipse);
    expect(res.length).toBeGreaterThanOrEqual(30);
    let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
    for (const p of res) {
      if (p.x < minX) minX = p.x;
      if (p.x > maxX) maxX = p.x;
      if (p.y < minY) minY = p.y;
      if (p.y > maxY) maxY = p.y;
    }
    const outW = maxX - minX;
    const outH = maxY - minY;
    expect(outW).toBeGreaterThan(outH * 1.8); // Retains deliberate elliptical ratio
  });

  it('recognizes a hand-drawn slightly rounded square with mouse jitter as a Square (not Triangle or Circle)', () => {
    const handSquare: Point[] = [];
    const size = 120;
    // Top side with slight jitter
    for (let i = 0; i <= 8; i++) handSquare.push({ x: 50 + (i / 8) * size, y: 50 + ((i % 2) ? 2 : 0) });
    // Right side
    for (let i = 1; i <= 8; i++) handSquare.push({ x: 50 + size + ((i % 2) ? -1 : 1), y: 50 + (i / 8) * size });
    // Bottom side
    for (let i = 1; i <= 8; i++) handSquare.push({ x: 50 + size - (i / 8) * size, y: 50 + size + ((i % 2) ? -2 : 0) });
    // Left side returning to start
    for (let i = 1; i <= 8; i++) handSquare.push({ x: 50 + ((i % 2) ? 1 : -1), y: 50 + size - (i / 8) * size });

    const res = recognizeSmartShape(handSquare);
    expect(res).toHaveLength(5); // 4 corners + 1 closing point (Square)
    expect(res[0]).toEqual(res[4]);
    const w = Math.abs(res[1].x - res[0].x);
    const h = Math.abs(res[2].y - res[1].y);
    expect(Math.abs(w - h)).toBeLessThanOrEqual(2);
  });
});
