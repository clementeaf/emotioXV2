/**
 * Cache Manager - Sistema de caché simple para APIs
 */

interface CacheItem<T> {
  data: T;
  timestamp: number;
  expiry: number;
}

class CacheManager<T> {
  private cache = new Map<string, CacheItem<T>>();
  private defaultExpiry = 5 * 60 * 1000; // 5 minutos

  set(key: string, data: T, expiry?: number): void {
    const now = Date.now();
    this.cache.set(key, {
      data,
      timestamp: now,
      expiry: expiry || this.defaultExpiry,
    });
  }

  get(key: string): T | null {
    const item = this.cache.get(key);
    if (!item) return null;

    const now = Date.now();
    if (now - item.timestamp > item.expiry) {
      this.cache.delete(key);
      return null;
    }

    return item.data;
  }

  has(key: string): boolean {
    return this.get(key) !== null;
  }

  delete(key: string): boolean {
    return this.cache.delete(key);
  }

  clear(): void {
    this.cache.clear();
  }

  size(): number {
    // Limpiar entradas expiradas
    const now = Date.now();
    const entries = Array.from(this.cache.entries());
    for (const [key, item] of entries) {
      if (now - item.timestamp > item.expiry) {
        this.cache.delete(key);
      }
    }
    return this.cache.size;
  }

  async getOrSet(key: string, fetcher: () => Promise<T>, expiry?: number): Promise<T> {
    const cached = this.get(key);
    if (cached !== null) {
      return cached;
    }
    const data = await fetcher();
    this.set(key, data, expiry);
    return data;
  }

  invalidatePattern(pattern: string): number {
    let deleted = 0;
    const regex = new RegExp(pattern);
    const keys = Array.from(this.cache.keys());
    for (const key of keys) {
      if (regex.test(key)) {
        this.cache.delete(key);
        deleted++;
      }
    }
    return deleted;
  }

  getStats(): { size: number; keys: string[] } {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys())
    };
  }
}

// Instancias específicas para diferentes tipos de datos
export const apiCache = new CacheManager<unknown>();
export const companiesCache = new CacheManager<unknown>();
export const researchCache = new CacheManager<unknown>();

export { CacheManager };
export default CacheManager;