/**
 * Helper to resolve static asset URLs and app paths taking into account Next.js basePath (e.g. GitHub Pages /GreenLearn).
 */
export function getAppBasePath(): string {
  if (typeof window !== 'undefined') {
    if (window.location.pathname.startsWith('/GreenLearn')) {
      return '/GreenLearn';
    }
  }
  return process.env.NEXT_PUBLIC_BASE_PATH || '';
}

export function getAppBaseUrl(): string {
  if (typeof window !== 'undefined') {
    const origin = window.location.origin;
    const basePath = getAppBasePath();
    return `${origin}${basePath}`;
  }
  return 'https://nhatgreen.github.io/GreenLearn';
}

export function getShareRoomUrl(roomId: string, perm: string = 'edit', spaceId?: string): string {
  const baseUrl = getAppBaseUrl();
  const params = new URLSearchParams();
  if (spaceId) params.set('space', spaceId);
  params.set('room', roomId);
  params.set('perm', perm);
  return `${baseUrl}/?${params.toString()}`;
}

export function navigateToRoom(roomId: string, perm: string = 'edit') {
  if (typeof window === 'undefined') return;
  const targetUrl = getShareRoomUrl(roomId, perm);
  window.location.href = targetUrl;
}

export function getAssetPath(path: string): string {
  if (!path) return '';
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  const basePath = getAppBasePath();
  return `${basePath}${cleanPath}`;
}

