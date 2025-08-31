/**
 * Sistema de cache sofisticado para el frontend
 * Soporte para TTL, invalidación, persistencia y estrategias de cache
 */

export interface CacheConfig {
  ttl?: number; // Time to live en milliseconds
  maxSize?: number; // Máximo número de entradas
  persistent?: boolean; // Persistir en localStorage
  strategy?: 'LRU' | 'FIFO'; // Estrategia de eviction
}

export interface CacheEntry<T = any> {
  data: T;
  timestamp: number;
  ttl: number;
  accessCount: number;
  lastAccess: number;
}

export class CacheManager {
  private cache = new Map<string, CacheEntry>();
  private config: Required<CacheConfig>;
  private storageKey: string;

  constructor(config: CacheConfig = {}) {
    this.config = {
      ttl: config.ttl ?? 5 * 60 * 1000, // 5 minutos por defecto
      maxSize: config.maxSize ?? 100,
      persistent: config.persistent ?? false,
      strategy: config.strategy ?? 'LRU'
    };
    
    this.storageKey = `cache-${Date.now()}`;
    
    if (this.config.persistent) {
      this.loadFromStorage();
    }
    
    // Cleanup periódico
    this.startCleanupInterval();
  }

  /**
   * Guarda un elemento en cache
   */
  set<T>(key: string, data: T, customTtl?: number): void {
    const ttl = customTtl ?? this.config.ttl;
    const now = Date.now();
    
    const entry: CacheEntry<T> = {
      data,
      timestamp: now,
      ttl,
      accessCount: 0,
      lastAccess: now
    };

    // Si el cache está lleno, hacer espacio
    if (this.cache.size >= this.config.maxSize) {
      this.evict();
    }

    this.cache.set(key, entry);
    
    if (this.config.persistent) {
      this.saveToStorage();
    }
  }

  /**
   * Obtiene un elemento del cache
   */
  get<T>(key: string): T | null {
    const entry = this.cache.get(key) as CacheEntry<T> | undefined;
    
    if (!entry) {
      return null;
    }
    
    const now = Date.now();
    
    // Verificar si ha expirado
    if (now - entry.timestamp > entry.ttl) {
      this.delete(key);
      return null;
    }
    
    // Actualizar estadísticas de acceso
    entry.accessCount++;
    entry.lastAccess = now;
    
    return entry.data;
  }

  /**
   * Elimina un elemento del cache
   */
  delete(key: string): boolean {
    const deleted = this.cache.delete(key);
    
    if (deleted && this.config.persistent) {
      this.saveToStorage();
    }
    
    return deleted;
  }

  /**
   * Verifica si existe una clave
   */
  has(key: string): boolean {
    const entry = this.cache.get(key);
    
    if (!entry) {
      return false;
    }
    
    const now = Date.now();
    
    // Verificar si ha expirado
    if (now - entry.timestamp > entry.ttl) {
      this.delete(key);
      return false;
    }
    
    return true;
  }

  /**
   * Limpia todo el cache
   */
  clear(): void {
    this.cache.clear();
    
    if (this.config.persistent) {
      localStorage.removeItem(this.storageKey);
    }
  }

  /**
   * Obtiene estadísticas del cache
   */
  getStats() {
    const now = Date.now();
    let validEntries = 0;
    let expiredEntries = 0;
    let totalSize = 0;

    for (const [, entry] of Array.from(this.cache)) {
      totalSize += JSON.stringify(entry.data).length;
      
      if (now - entry.timestamp > entry.ttl) {
        expiredEntries++;
      } else {
        validEntries++;
      }
    }

    return {
      totalEntries: this.cache.size,
      validEntries,
      expiredEntries,
      maxSize: this.config.maxSize,
      totalSizeBytes: totalSize,
      hitRate: this.calculateHitRate()
    };
  }

  /**
   * Invalidar por patrón
   */
  invalidatePattern(pattern: RegExp): number {
    let deleted = 0;
    
    for (const key of Array.from(this.cache.keys())) {
      if (pattern.test(key)) {
        this.delete(key);
        deleted++;
      }
    }
    
    return deleted;
  }

  /**
   * Cache con función de fallback
   */
  async getOrSet<T>(
    key: string,
    fetcher: () => Promise<T>,
    customTtl?: number
  ): Promise<T> {
    const cached = this.get<T>(key);
    
    if (cached !== null) {
      return cached;
    }
    
    const data = await fetcher();
    this.set(key, data, customTtl);
    
    return data;
  }

  /**
   * Estrategias de eviction
   */
  private evict(): void {
    if (this.cache.size === 0) return;
    
    let keyToEvict: string = '';
    
    switch (this.config.strategy) {
      case 'LRU':
        keyToEvict = this.findLRUKey();
        break;
      case 'FIFO':
        const firstKeyFIFO = Array.from(this.cache.keys())[0];
        if (firstKeyFIFO) keyToEvict = firstKeyFIFO;
        break;
      default:
        const firstKeyDefault = Array.from(this.cache.keys())[0];
        if (firstKeyDefault) keyToEvict = firstKeyDefault;
    }
    
    if (keyToEvict) this.cache.delete(keyToEvict);
  }

  private findLRUKey(): string {
    let oldestKey = '';
    let oldestTime = Date.now();
    
    for (const [key, entry] of Array.from(this.cache)) {
      if (entry.lastAccess < oldestTime) {
        oldestTime = entry.lastAccess;
        oldestKey = key;
      }
    }
    
    return oldestKey;
  }

  /**
   * Cleanup de entradas expiradas
   */
  private cleanup(): void {
    const now = Date.now();
    const keysToDelete: string[] = [];
    
    for (const [key, entry] of Array.from(this.cache)) {
      if (now - entry.timestamp > entry.ttl) {
        keysToDelete.push(key);
      }
    }
    
    keysToDelete.forEach(key => this.cache.delete(key));
    
    if (keysToDelete.length > 0 && this.config.persistent) {
      this.saveToStorage();
    }
  }

  private startCleanupInterval(): void {
    // Cleanup cada minuto
    setInterval(() => this.cleanup(), 60 * 1000);
  }

  private calculateHitRate(): number {
    if (this.cache.size === 0) return 0;
    
    const totalAccess = Array.from(this.cache.values())
      .reduce((sum, entry) => sum + entry.accessCount, 0);
    
    return totalAccess / this.cache.size;
  }

  private saveToStorage(): void {
    if (typeof window === 'undefined') return;
    
    try {
      const cacheData = Array.from(this.cache.entries());
      localStorage.setItem(this.storageKey, JSON.stringify(cacheData));
    } catch (error) {
    }
  }

  private loadFromStorage(): void {
    if (typeof window === 'undefined') return;
    
    try {
      const stored = localStorage.getItem(this.storageKey);
      if (stored) {
        const cacheData: [string, CacheEntry][] = JSON.parse(stored);
        this.cache = new Map(cacheData);
        
        // Cleanup de entradas expiradas al cargar
        this.cleanup();
      }
    } catch (error) {
    }
  }
}

// Instancias de cache especializadas
export const apiCache = new CacheManager({
  ttl: 5 * 60 * 1000, // 5 minutos
  maxSize: 50,
  persistent: true,
  strategy: 'LRU'
});

export const companiesCache = new CacheManager({
  ttl: 10 * 60 * 1000, // 10 minutos (las empresas cambian menos)
  maxSize: 20,
  persistent: true,
  strategy: 'LRU'
});

export const researchCache = new CacheManager({
  ttl: 2 * 60 * 1000, // 2 minutos (las investigaciones cambian más)
  maxSize: 30,
  persistent: false,
  strategy: 'LRU'
});