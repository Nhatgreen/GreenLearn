export interface ItemBounds {
  x: number;
  y: number;
  width: number;
  height: number;
  rotation?: number;
}

export interface ViewportTransform {
  x: number;
  y: number;
  scale: number;
  viewportW: number;
  viewportH: number;
}

/**
 * Kiểm tra xem một vật thể bàn học có nằm trong tầm nhìn màn hình (kèm khoảng đệm margin) hay không
 * Sử dụng bounding sphere bán kính ngoại tiếp để bao quát an toàn mọi góc xoay 360 độ
 */
export function isItemVisible(
  item: ItemBounds,
  view: ViewportTransform,
  margin = 500
): boolean {
  if (view.scale <= 0) return true;

  const w = item.width || 300;
  const h = item.height || 300;

  // Bán kính ngoại tiếp của hình chữ nhật
  const radius = Math.sqrt((w / 2) ** 2 + (h / 2) ** 2);
  const centerX = item.x + w / 2;
  const centerY = item.y + h / 2;

  // Giới hạn tầm nhìn màn hình trong hệ toạ độ thế giới bàn học
  const minCanvasX = -view.x / view.scale - margin;
  const maxCanvasX = (-view.x + view.viewportW) / view.scale + margin;
  const minCanvasY = -view.y / view.scale - margin;
  const maxCanvasY = (-view.y + view.viewportH) / view.scale + margin;

  if (centerX + radius < minCanvasX) return false;
  if (centerX - radius > maxCanvasX) return false;
  if (centerY + radius < minCanvasY) return false;
  if (centerY - radius > maxCanvasY) return false;

  return true;
}
