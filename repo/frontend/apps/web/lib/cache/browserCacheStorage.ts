import type { CacheScope } from "@scopify/desktop-contract";
import { createStore, del, entries } from "idb-keyval";

export interface BrowserCacheRecord {
  accessedAt: number;
  category: string;
  expiresAt: number;
  sizeBytes: number;
  value: unknown;
}

export interface BrowserCacheStorage {
  clear(scope: CacheScope): Promise<void>;
  delete(scope: CacheScope, key: string): Promise<void>;
  entries(scope: CacheScope): Promise<Array<[string, BrowserCacheRecord]>>;
  get(scope: CacheScope, key: string): Promise<BrowserCacheRecord | null>;
  set(scope: CacheScope, key: string, value: BrowserCacheRecord): Promise<void>;
}

/** The default idb-keyval store used by playback cache releases before v2. */
export interface LegacyBrowserPlaybackStorage {
  delete(key: string): Promise<void>;
  entries(): Promise<Array<[string, unknown]>>;
}

const DATABASE_NAME = "scopify-cache";
const DATABASE_VERSION = 1;

/** A non-persistent fallback for SSR, private mode, and unsupported browsers. */
export class MemoryBrowserCacheStorage implements BrowserCacheStorage {
  private readonly stores: Record<CacheScope, Map<string, BrowserCacheRecord>> = {
    page: new Map(),
    playback: new Map(),
  };

  async clear(scope: CacheScope) {
    this.stores[scope].clear();
  }

  async delete(scope: CacheScope, key: string) {
    this.stores[scope].delete(key);
  }

  async entries(scope: CacheScope): Promise<Array<[string, BrowserCacheRecord]>> {
    return [...this.stores[scope]].map(
      ([key, record]) => [key, structuredClone(record)] as [string, BrowserCacheRecord],
    );
  }

  async get(scope: CacheScope, key: string) {
    const record = this.stores[scope].get(key);
    return record ? structuredClone(record) : null;
  }

  async set(scope: CacheScope, key: string, value: BrowserCacheRecord) {
    this.stores[scope].set(key, structuredClone(value));
  }
}

class IndexedDbBrowserCacheStorage implements BrowserCacheStorage {
  private database: Promise<IDBDatabase> | null = null;

  async clear(scope: CacheScope) {
    await this.transaction(scope, "readwrite", (store) => store.clear());
  }

  async delete(scope: CacheScope, key: string) {
    await this.transaction(scope, "readwrite", (store) => store.delete(key));
  }

  async entries(scope: CacheScope): Promise<Array<[string, BrowserCacheRecord]>> {
    return this.transaction(
      scope,
      "readonly",
      (store) =>
        new Promise<Array<[string, BrowserCacheRecord]>>((resolve, reject) => {
          const records: Array<[string, BrowserCacheRecord]> = [];
          const request = store.openCursor();
          request.onerror = () => reject(request.error);
          request.onsuccess = () => {
            const cursor = request.result;
            if (!cursor) {
              resolve(records);
              return;
            }
            records.push([String(cursor.key), cursor.value as BrowserCacheRecord]);
            cursor.continue();
          };
        }),
    );
  }

  async get(scope: CacheScope, key: string) {
    return this.transaction(scope, "readonly", (store) =>
      requestResult<BrowserCacheRecord | undefined>(store.get(key)).then(
        (record) => record ?? null,
      ),
    );
  }

  async set(scope: CacheScope, key: string, value: BrowserCacheRecord) {
    await this.transaction(scope, "readwrite", (store) => store.put(value, key));
  }

  private async getDatabase(): Promise<IDBDatabase> {
    if (this.database) return this.database;

    this.database = new Promise<IDBDatabase>((resolve, reject) => {
      const request = indexedDB.open(DATABASE_NAME, DATABASE_VERSION);
      request.onerror = () =>
        reject(request.error ?? new Error("Unable to open the cache database."));
      request.onupgradeneeded = () => {
        for (const scope of ["page", "playback"] as const) {
          if (!request.result.objectStoreNames.contains(scope))
            request.result.createObjectStore(scope);
        }
      };
      request.onsuccess = () => resolve(request.result);
    });

    try {
      return await this.database;
    } catch (error) {
      this.database = null;
      throw error;
    }
  }

  private async transaction<T>(
    scope: CacheScope,
    mode: IDBTransactionMode,
    operation: (store: IDBObjectStore) => IDBRequest | Promise<T>,
  ): Promise<T> {
    const database = await this.getDatabase();
    const transaction = database.transaction(scope, mode);
    const result = await operation(transaction.objectStore(scope));
    await transactionComplete(transaction);
    return result as T;
  }
}

function requestResult<T>(request: IDBRequest<T>): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
  });
}

function transactionComplete(transaction: IDBTransaction): Promise<void> {
  return new Promise<void>((resolve, reject) => {
    transaction.onabort = () => reject(transaction.error);
    transaction.onerror = () => reject(transaction.error);
    transaction.oncomplete = () => resolve();
  });
}

export function createBrowserCacheStorage(): BrowserCacheStorage {
  return typeof indexedDB === "undefined"
    ? new MemoryBrowserCacheStorage()
    : new IndexedDbBrowserCacheStorage();
}

const legacyPlaybackStore = createStore("keyval-store", "keyval");

export function createLegacyBrowserPlaybackStorage(): LegacyBrowserPlaybackStorage {
  return {
    delete: (key) => del(key, legacyPlaybackStore),
    entries: async () =>
      (await entries<string, unknown>(legacyPlaybackStore)).map(
        ([key, value]) => [String(key), value] as [string, unknown],
      ),
  };
}
