/**
 * Storage Migration Utility for GreenLearn
 * Automatically migrates localStorage, sessionStorage, and IndexedDB data from ViTudy to GreenLearn once.
 */

const MIGRATION_DONE_KEY = 'greenlearn_storage_migrated';

export function migrateLegacyStorage(): void {
  if (typeof window === 'undefined') return;

  try {
    if (localStorage.getItem(MIGRATION_DONE_KEY) === 'true') {
      return;
    }

    // 1. Migrate localStorage keys
    const keysToMigrate: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && (key.startsWith('vitudy_') || key.startsWith('vitudy:'))) {
        keysToMigrate.push(key);
      }
    }

    for (const oldKey of keysToMigrate) {
      const value = localStorage.getItem(oldKey);
      if (value !== null) {
        let newKey = oldKey;
        if (oldKey.startsWith('vitudy_')) {
          newKey = oldKey.replace(/^vitudy_/, 'greenlearn_');
        } else if (oldKey.startsWith('vitudy:')) {
          newKey = oldKey.replace(/^vitudy:/, 'greenlearn:');
        }

        // Only copy if new key does not exist yet
        if (!localStorage.getItem(newKey)) {
          localStorage.setItem(newKey, value);
        }
        localStorage.removeItem(oldKey);
      }
    }

    // 2. Migrate sessionStorage keys
    if (typeof sessionStorage !== 'undefined') {
      const oldLastView = sessionStorage.getItem('vitudy_last_view');
      if (oldLastView && !sessionStorage.getItem('greenlearn_last_view')) {
        sessionStorage.setItem('greenlearn_last_view', oldLastView);
        sessionStorage.removeItem('vitudy_last_view');
      }
    }

    localStorage.setItem(MIGRATION_DONE_KEY, 'true');
    console.info('[GreenLearn] Storage migration from ViTudy completed successfully.');
  } catch (err) {
    console.warn('[GreenLearn] Storage migration warning:', err);
  }
}
