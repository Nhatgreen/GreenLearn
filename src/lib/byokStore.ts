export type ByokProvider = 'openai' | 'gemini' | 'chatgpt_oauth';

const STORAGE_PREFIX = 'vitudy_byok_';

export class ByokStore {
  static get(provider: ByokProvider): string | null {
    if (typeof window === 'undefined') return null;
    try {
      return localStorage.getItem(`${STORAGE_PREFIX}${provider}`);
    } catch {
      return null;
    }
  }

  static set(provider: ByokProvider, key: string): void {
    if (typeof window === 'undefined') return;
    try {
      if (key && key.trim()) {
        localStorage.setItem(`${STORAGE_PREFIX}${provider}`, key.trim());
      } else {
        this.clear(provider);
      }
    } catch {}
  }

  static clear(provider: ByokProvider): void {
    if (typeof window === 'undefined') return;
    try {
      localStorage.removeItem(`${STORAGE_PREFIX}${provider}`);
    } catch {}
  }

  static has(provider: ByokProvider): boolean {
    const val = this.get(provider);
    return Boolean(val && val.trim().length > 0);
  }
}
