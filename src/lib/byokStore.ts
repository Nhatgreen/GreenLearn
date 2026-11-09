export type ByokProvider = 'openai' | 'gemini' | 'chatgpt_oauth';

const STORAGE_PREFIX = 'greenlearn_byok_';

export class ByokStore {
  static get(provider: ByokProvider = 'openai'): string | null {
    if (typeof window === 'undefined') return null;
    try {
      return localStorage.getItem(`${STORAGE_PREFIX}${provider}`);
    } catch {
      return null;
    }
  }

  static set(provider: ByokProvider = 'openai', key: string): void {
    if (typeof window === 'undefined') return;
    try {
      if (key && key.trim()) {
        localStorage.setItem(`${STORAGE_PREFIX}${provider}`, key.trim());
      } else {
        this.clear(provider);
      }
    } catch {}
  }

  static clear(provider: ByokProvider = 'openai'): void {
    if (typeof window === 'undefined') return;
    try {
      localStorage.removeItem(`${STORAGE_PREFIX}${provider}`);
    } catch {}
  }

  static has(provider: ByokProvider = 'openai'): boolean {
    const val = this.get(provider);
    return Boolean(val && val.trim().length > 0);
  }

  /**
   * Che dấu an toàn khóa API (ví dụ: sk-proj-...3aB9) để tránh bị lộ khi quay màn hình hoặc stream.
   */
  static mask(key?: string | null): string {
    if (!key || typeof key !== 'string') return '';
    const trimmed = key.trim();
    if (!trimmed) return '';

    if (trimmed.length <= 10) {
      return '••••••••';
    }

    if (trimmed.startsWith('sk-proj-')) {
      const suffix = trimmed.slice(-4);
      return `sk-proj-••••••••••••${suffix}`;
    }

    if (trimmed.startsWith('sk-')) {
      const suffix = trimmed.slice(-4);
      return `sk-••••••••${suffix}`;
    }

    const prefix = trimmed.slice(0, 3);
    const suffix = trimmed.slice(-4);
    return `${prefix}••••••••${suffix}`;
  }
}
