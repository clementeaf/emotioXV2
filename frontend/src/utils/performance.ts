/**
 * Utilidades para optimización de performance
 */

import React from 'react';

/**
 * Comparación profunda optimizada para React.memo
 */
export function deepEqual(a: any, b: any): boolean {
  if (a === b) return true;
  
  if (a == null || b == null) return false;
  
  if (typeof a !== typeof b) return false;
  
  if (typeof a !== 'object') return false;
  
  const keysA = Object.keys(a);
  const keysB = Object.keys(b);
  
  if (keysA.length !== keysB.length) return false;
  
  for (const key of keysA) {
    if (!keysB.includes(key)) return false;
    if (!deepEqual(a[key], b[key])) return false;
  }
  
  return true;
}

/**
 * Comparación shallow optimizada
 */
export function shallowEqual(objA: any, objB: any): boolean {
  if (objA === objB) return true;
  
  if (!objA || !objB) return false;
  
  const keysA = Object.keys(objA);
  const keysB = Object.keys(objB);
  
  if (keysA.length !== keysB.length) return false;
  
  for (const key of keysA) {
    if (objA[key] !== objB[key]) return false;
  }
  
  return true;
}

/**
 * HOC para React.memo con comparación personalizada
 */
export function withOptimizedMemo<P extends object>(
  Component: React.ComponentType<P>,
  compareFunction?: (prevProps: P, nextProps: P) => boolean
) {
  return React.memo(Component, compareFunction || shallowEqual);
}

/**
 * Función para crear selectores memoizados
 */
export function createSelector<T, R>(
  selector: (data: T) => R,
  equalityFn: (a: R, b: R) => boolean = Object.is
) {
  let lastInput: T;
  let lastResult: R;
  let hasResult = false;

  return (input: T): R => {
    if (!hasResult || !Object.is(input, lastInput)) {
      const newResult = selector(input);
      
      if (!hasResult || !equalityFn(lastResult, newResult)) {
        lastResult = newResult;
      }
      
      lastInput = input;
      hasResult = true;
    }
    
    return lastResult;
  };
}

/**
 * Función para batching de actualizaciones
 */
export function batchUpdates<T>(
  updates: (() => void)[],
  delay: number = 0
): Promise<void> {
  return new Promise((resolve) => {
    if (delay === 0) {
      // Usar unstable_batchedUpdates si está disponible
      if ('unstable_batchedUpdates' in React) {
        (React as any).unstable_batchedUpdates(() => {
          updates.forEach(update => update());
        });
      } else {
        updates.forEach(update => update());
      }
      resolve();
    } else {
      setTimeout(() => {
        updates.forEach(update => update());
        resolve();
      }, delay);
    }
  });
}

/**
 * Utilidad para lazy evaluation
 */
export class LazyValue<T> {
  private _value: T | undefined;
  private _computed = false;

  constructor(private compute: () => T) {}

  get value(): T {
    if (!this._computed) {
      this._value = this.compute();
      this._computed = true;
    }
    return this._value as T;
  }

  reset(): void {
    this._computed = false;
    this._value = undefined;
  }
}

/**
 * Performance profiler para desarrollo
 */
export class PerformanceProfiler {
  private startTimes = new Map<string, number>();
  private measurements: Array<{ name: string; duration: number; timestamp: number }> = [];

  start(name: string): void {
    this.startTimes.set(name, performance.now());
  }

  end(name: string): number {
    const startTime = this.startTimes.get(name);
    if (!startTime) {
      return 0;
    }

    const duration = performance.now() - startTime;
    this.measurements.push({
      name,
      duration,
      timestamp: Date.now()
    });

    this.startTimes.delete(name);


    return duration;
  }

  getMeasurements(filter?: string): Array<{ name: string; duration: number; timestamp: number }> {
    if (!filter) return this.measurements;
    return this.measurements.filter(m => m.name.includes(filter));
  }

  getAverageDuration(name: string): number {
    const filtered = this.measurements.filter(m => m.name === name);
    if (filtered.length === 0) return 0;
    
    const total = filtered.reduce((sum, m) => sum + m.duration, 0);
    return total / filtered.length;
  }

  clear(): void {
    this.measurements = [];
    this.startTimes.clear();
  }
}

// Instancia global del profiler para desarrollo
export const profiler = new PerformanceProfiler();

/**
 * Hook para profiling de componentes
 */
export function usePerformanceProfiler(componentName: string) {
  React.useEffect(() => {
    const measureName = `${componentName}-render`;
    profiler.start(measureName);
    
    return () => {
      profiler.end(measureName);
    };
  });

  return profiler;
}

/**
 * Decorator para funciones que necesitan profiling
 */
export function withProfiling<T extends (...args: any[]) => any>(
  fn: T,
  name: string
): T {
  return ((...args: Parameters<T>) => {
    profiler.start(name);
    const result = fn(...args);
    
    if (result instanceof Promise) {
      return result.finally(() => profiler.end(name));
    } else {
      profiler.end(name);
      return result;
    }
  }) as T;
}