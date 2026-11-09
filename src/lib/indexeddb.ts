import { openDB, IDBPDatabase } from 'idb';

const DB_NAME = 'greenlearn_offline_db';
const DB_VERSION = 1;

let dbPromise: Promise<IDBPDatabase> | null = null;

export async function getIDB(): Promise<IDBPDatabase | null> {
  if (typeof window === 'undefined') return null;

  if (!dbPromise) {
    dbPromise = openDB(DB_NAME, DB_VERSION, {
      upgrade(db) {
        if (!db.objectStoreNames.contains('keyval')) {
          db.createObjectStore('keyval');
        }
        if (!db.objectStoreNames.contains('offline_ops')) {
          db.createObjectStore('offline_ops', { keyPath: 'id', autoIncrement: true });
        }
      },
    });
  }

  return dbPromise;
}

export async function idbGet<T>(key: string): Promise<T | undefined> {
  const db = await getIDB();
  if (!db) return undefined;
  return db.get('keyval', key);
}

export async function idbSet<T>(key: string, value: T): Promise<void> {
  const db = await getIDB();
  if (!db) return;
  await db.put('keyval', value, key);
}

export async function idbDelete(key: string): Promise<void> {
  const db = await getIDB();
  if (!db) return;
  await db.delete('keyval', key);
}
