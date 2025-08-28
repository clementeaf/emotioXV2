/**
 * Sistema de deduplicación para prevenir llamadas API duplicadas
 */

interface PendingRequest {
  promise: Promise<any>;
  timestamp: number;
}

class APIDeduplicator {
  private pendingRequests: Map<string, PendingRequest> = new Map();
  private readonly CACHE_TIME = 1000; // 1 segundo de cache para prevenir duplicados

  /**
   * Ejecuta una función fetch con deduplicación
   * Si hay una llamada en progreso con la misma key, retorna esa promesa
   */
  async dedupe<T>(key: string, fetchFn: () => Promise<T>): Promise<T> {
    // Limpiar requests antiguos
    this.cleanOldRequests();

    // Si hay una request pendiente, retornarla
    const pending = this.pendingRequests.get(key);
    if (pending) {
      return pending.promise;
    }

    // Crear nueva request
    const promise = fetchFn();
    
    this.pendingRequests.set(key, {
      promise,
      timestamp: Date.now()
    });

    // Limpiar después de que se complete
    promise.finally(() => {
      setTimeout(() => {
        this.pendingRequests.delete(key);
      }, this.CACHE_TIME);
    });

    return promise;
  }

  private cleanOldRequests() {
    const now = Date.now();
    const oldKeys: string[] = [];

    this.pendingRequests.forEach((request, key) => {
      if (now - request.timestamp > 5000) { // Limpiar requests de más de 5 segundos
        oldKeys.push(key);
      }
    });

    oldKeys.forEach(key => {
      this.pendingRequests.delete(key);
    });
  }
}

export const apiDeduplicator = new APIDeduplicator();