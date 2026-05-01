interface CacheEntry<T> {
  data: T;
  expiresAt: number;
}

const TTL_MS = Number(process.env.CACHE_TTL_MS) || 30_000;

class SimpleCache {
  private store = new Map<string, CacheEntry<unknown>>();

  set<T>(key: string, data: T): void {
    this.store.set(key, { data, expiresAt: Date.now() + TTL_MS });
  }

  get<T>(key: string): T | null {
    const entry = this.store.get(key) as CacheEntry<T> | undefined;
    if (!entry || Date.now() > entry.expiresAt) {
      this.store.delete(key);
      return null;
    }
    return entry.data;
  }

  clear(): void {
    this.store.clear();
  }
}

export const cache = new SimpleCache();
