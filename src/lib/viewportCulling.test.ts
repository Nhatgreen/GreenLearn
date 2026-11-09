import { describe, it, expect } from 'vitest';
import { isItemVisible, ViewportTransform, ItemBounds } from './viewportCulling';

describe('viewportCulling', () => {
  const baseView: ViewportTransform = {
    x: 0,
    y: 0,
    scale: 1,
    viewportW: 1920,
    viewportH: 1080,
  };

  it('xác định vật thể ở trung tâm màn hình là visible', () => {
    const item: ItemBounds = {
      x: 500,
      y: 400,
      width: 400,
      height: 300,
    };
    expect(isItemVisible(item, baseView, 100)).toBe(true);
  });

  it('loại trừ vật thể nằm quá xa ngoài màn hình bên phải', () => {
    const item: ItemBounds = {
      x: 3500,
      y: 400,
      width: 400,
      height: 300,
    };
    expect(isItemVisible(item, baseView, 100)).toBe(false);
  });

  it('loại trừ vật thể nằm quá xa ngoài màn hình bên trái', () => {
    const item: ItemBounds = {
      x: -2000,
      y: 400,
      width: 400,
      height: 300,
    };
    expect(isItemVisible(item, baseView, 100)).toBe(false);
  });

  it('giữ lại vật thể nằm ngoài màn hình nhưng vẫn trong khoảng đệm margin', () => {
    // maxCanvasX = 1920, item.x = 2000, margin = 300 -> nằm trong margin
    const item: ItemBounds = {
      x: 2000,
      y: 400,
      width: 100,
      height: 100,
    };
    expect(isItemVisible(item, baseView, 300)).toBe(true);
  });

  it('xử lý tỷ lệ zoom scale < 1 (thu nhỏ màn hình)', () => {
    const zoomedOutView: ViewportTransform = {
      x: 0,
      y: 0,
      scale: 0.5,
      viewportW: 1920,
      viewportH: 1080,
    };
    // Khi scale 0.5, màn hình thấy được từ 0 tới 3840 theo chiều X
    const item: ItemBounds = {
      x: 3000,
      y: 1000,
      width: 400,
      height: 300,
    };
    expect(isItemVisible(item, zoomedOutView, 100)).toBe(true);
  });
});
