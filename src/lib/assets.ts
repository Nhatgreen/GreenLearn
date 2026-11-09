/**
 * Helper to resolve static asset URLs taking into account Next.js basePath (e.g. GitHub Pages /ViTudy).
 */
export function getAssetPath(path: string): string {
  if (!path) return '';
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  const envBasePath = process.env.NEXT_PUBLIC_BASE_PATH || '';

  // In browser, if we are hosted on a subpath (e.g. GitHub Pages repo /ViTudy)
  if (typeof window !== 'undefined') {
    if (window.location.pathname.startsWith('/ViTudy')) {
      return `/ViTudy${cleanPath}`;
    }
  }

  return `${envBasePath}${cleanPath}`;
}
