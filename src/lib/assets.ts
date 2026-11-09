/**
 * Helper to resolve static asset URLs taking into account Next.js basePath (e.g. GitHub Pages /GreenLearn).
 */
export function getAssetPath(path: string): string {
  if (!path) return '';
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  const envBasePath = process.env.NEXT_PUBLIC_BASE_PATH || '';

  // In browser, if we are hosted on a subpath (e.g. GitHub Pages repo /GreenLearn)
  if (typeof window !== 'undefined') {
    if (window.location.pathname.startsWith('/GreenLearn')) {
      return `/GreenLearn${cleanPath}`;
    }
  }

  return `${envBasePath}${cleanPath}`;
}
