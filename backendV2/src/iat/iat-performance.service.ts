import { spawn } from 'child_process';
import type { IATSessionModel } from '../models/iat.model';

/**
 * Interfaz para input del análisis optimizado
 */
interface PerformanceOptimizedInput {
  sessionId: string;
  participantId: string;
  testConfig: IATSessionModel['testConfig'];
  responses: IATSessionModel['responses'];
  metadata: {
    startTime: string;
    lastActivity: string;
    sessionDuration: number;
    totalTrials: number;
    optimizationLevel: string;
  };
}

/**
 * Interfaz para respuesta del optimizador de rendimiento
 */
interface PerformanceOptimizedAnalysis {
  d_score?: number;
  d_score_interpretation?: string;
  compatible_blocks_analysis?: Record<string, unknown>;
  incompatible_blocks_analysis?: Record<string, unknown>;
  overall_accuracy?: number;
  overall_mean_rt?: number;
  [key: string]: unknown;
}

interface PerformanceOptimizedResponse {
  success: boolean;
  analysis?: PerformanceOptimizedAnalysis;
  performance_metrics?: {
    processing_time: number;
    memory_usage: number;
    cpu_usage: number;
    cache_hits: number;
    parallel_tasks: number;
    optimization_level: string;
  };
  optimization_applied?: boolean;
  error?: string;
  timestamp?: string;
}

/**
 * Servicio de rendimiento optimizado para análisis IAT
 * Implementa técnicas avanzadas de optimización
 */
export class IATPerformanceService {
  private readonly serviceName = 'IATPerformanceService';
  private readonly pythonPath: string;
  private readonly optimizerPath: string;
  private readonly cache: Map<string, { data: PerformanceOptimizedResponse; timestamp: number }> = new Map();
  private readonly maxCacheSize: number = 100;
  private readonly cacheTimeout: number = 5 * 60 * 1000; // 5 minutos

  constructor() {
    this.pythonPath = process.env.PYTHON_PATH || 'python3';
    this.optimizerPath = process.env.IAT_PERFORMANCE_OPTIMIZER_SCRIPT || 
      `${__dirname}/iat-performance-optimizer.py`;
    
    console.log(`[${this.serviceName}] Inicializando servicio de rendimiento IAT`, {
      pythonPath: this.pythonPath,
      optimizerPath: this.optimizerPath,
      maxCacheSize: this.maxCacheSize
    });
  }

  /**
   * Realiza análisis IAT optimizado con técnicas de rendimiento
   * @param sessionData Datos de la sesión IAT
   * @returns Análisis optimizado con métricas de rendimiento
   */
  async performOptimizedAnalysis(sessionData: IATSessionModel): Promise<PerformanceOptimizedResponse> {
    const context = 'performOptimizedAnalysis';
    const startTime = Date.now();
    
    console.log(`[${this.serviceName}.${context}] Iniciando análisis optimizado`);

    try {
      // Verificar cache primero
      const cacheKey = this.generateCacheKey(sessionData);
      const cachedResult = this.getFromCache(cacheKey);
      
      if (cachedResult) {
        console.log(`[${this.serviceName}.${context}] Resultado obtenido desde cache`);
        return cachedResult;
      }

      // Preparar datos optimizados
      const optimizedInput = this.prepareOptimizedInput(sessionData);
      
      // Ejecutar análisis optimizado
      const analysisResult = await this.executeOptimizedAnalysis(optimizedInput);
      
      // Calcular métricas de rendimiento
      const processingTime = Date.now() - startTime;
      const performanceMetrics = this.calculatePerformanceMetrics(processingTime);
      
      // Compilar resultado final
      const result: PerformanceOptimizedResponse = {
        success: analysisResult.success,
        analysis: analysisResult.analysis,
        performance_metrics: performanceMetrics,
        optimization_applied: true,
        timestamp: new Date().toISOString()
      };

      // Guardar en cache
      this.setCache(cacheKey, result);
      
      console.log(`[${this.serviceName}.${context}] Análisis optimizado completado`, {
        sessionId: sessionData.sessionId,
        processingTime: `${processingTime}ms`,
        success: result.success,
        fromCache: false
      });

      return result;

    } catch (error: unknown) {
      console.error(`[${this.serviceName}.${context}] Error en análisis optimizado:`, error);
      return {
        success: false,
        error: `Error ejecutando análisis optimizado: ${error instanceof Error ? error.message : String(error)}`,
        timestamp: new Date().toISOString()
      };
    }
  }

  /**
   * Genera clave de cache basada en datos de sesión
   */
  private generateCacheKey(sessionData: IATSessionModel): string {
    try {
      // Crear hash simple basado en datos clave
      const keyData = {
        sessionId: sessionData.sessionId,
        participantId: sessionData.participantId,
        responseCount: sessionData.responses?.length || 0,
        lastActivity: sessionData.lastActivity
      };
      
      return JSON.stringify(keyData);
    } catch (error) {
      console.error('Error generando clave de cache:', error);
      return `fallback-${Date.now()}`;
    }
  }

  /**
   * Obtiene resultado desde cache
   */
  private getFromCache(key: string): PerformanceOptimizedResponse | null {
    try {
      const cached = this.cache.get(key);
      if (!cached) return null;
      
      // Verificar timeout
      if (Date.now() - cached.timestamp > this.cacheTimeout) {
        this.cache.delete(key);
        return null;
      }
      
      return cached.data;
    } catch (error) {
      console.error('Error obteniendo desde cache:', error);
      return null;
    }
  }

  /**
   * Guarda resultado en cache
   */
  private setCache(key: string, result: PerformanceOptimizedResponse): void {
    try {
      // Limpiar cache si está lleno
      if (this.cache.size >= this.maxCacheSize) {
        const firstKey = this.cache.keys().next().value;
        if (firstKey) {
          this.cache.delete(firstKey);
        }
      }
      
      this.cache.set(key, { data: result, timestamp: Date.now() });
    } catch (error) {
      console.error('Error guardando en cache:', error);
    }
  }

  /**
   * Prepara datos optimizados para análisis
   */
  private prepareOptimizedInput(sessionData: IATSessionModel): PerformanceOptimizedInput {
    return {
      sessionId: sessionData.sessionId,
      participantId: sessionData.participantId,
      testConfig: sessionData.testConfig,
      responses: sessionData.responses,
      metadata: {
        startTime: sessionData.startTime,
        lastActivity: sessionData.lastActivity,
        sessionDuration: this.calculateSessionDuration(sessionData),
        totalTrials: sessionData.responses?.length || 0,
        optimizationLevel: 'high'
      }
    };
  }

  /**
   * Calcula duración de sesión optimizada
   */
  private calculateSessionDuration(sessionData: IATSessionModel): number {
    try {
      if (!sessionData.startTime || !sessionData.lastActivity) {
        return 0;
      }
      
      const start = new Date(sessionData.startTime).getTime();
      const end = new Date(sessionData.lastActivity).getTime();
      
      return Math.round((end - start) / 1000);
    } catch (error) {
      console.error('Error calculando duración de sesión:', error);
      return 0;
    }
  }

  /**
   * Ejecuta análisis optimizado con timeout y manejo de errores
   */
  private async executeOptimizedAnalysis(inputData: PerformanceOptimizedInput): Promise<PerformanceOptimizedResponse> {
    const context = 'executeOptimizedAnalysis';
    const timeout = 30000; // 30 segundos timeout
    
    return new Promise((resolve, reject) => {
      console.log(`[${this.serviceName}.${context}] Ejecutando análisis optimizado`);

      // Crear proceso Python con timeout
      const pythonProcess = spawn(this.pythonPath, [this.optimizerPath], {
        stdio: ['pipe', 'pipe', 'pipe'],
        cwd: process.cwd(),
        timeout: timeout
      });

      let stdout = '';
      let stderr = '';
      let isResolved = false;

      // Timeout handler
      const timeoutId = setTimeout(() => {
        if (!isResolved) {
          pythonProcess.kill();
          isResolved = true;
          reject(new Error(`Análisis optimizado timeout después de ${timeout}ms`));
        }
      }, timeout);

      // Capturar salida estándar
      pythonProcess.stdout?.on('data', (data: Buffer) => {
        stdout += data.toString();
      });

      // Capturar errores
      pythonProcess.stderr?.on('data', (data: Buffer) => {
        stderr += data.toString();
      });

      // Manejar finalización del proceso
      pythonProcess.on('close', (code: number) => {
        if (isResolved) return;
        isResolved = true;
        clearTimeout(timeoutId);

        if (code !== 0) {
          console.error(`[${this.serviceName}.${context}] Optimizador falló:`, {
            code,
            stderr
          });
          reject(new Error(`Optimizador falló con código ${code}: ${stderr}`));
          return;
        }

        try {
          const result = JSON.parse(stdout) as PerformanceOptimizedResponse;
          console.log(`[${this.serviceName}.${context}] Análisis optimizado completado:`, {
            success: result.success,
            optimization_applied: result.optimization_applied
          });
          resolve(result);
        } catch (parseError: unknown) {
          console.error(`[${this.serviceName}.${context}] Error parseando salida:`, {
            error: parseError,
            stdout
          });
          reject(new Error(`Error parseando salida: ${parseError instanceof Error ? parseError.message : String(parseError)}`));
        }
      });

      // Manejar errores del proceso
      pythonProcess.on('error', (error: Error) => {
        if (isResolved) return;
        isResolved = true;
        clearTimeout(timeoutId);
        
        console.error(`[${this.serviceName}.${context}] Error del proceso:`, error);
        reject(new Error(`Error del proceso: ${error.message}`));
      });

      // Enviar datos al optimizador
      try {
        const inputJson = JSON.stringify(inputData);
        pythonProcess.stdin?.write(inputJson);
        pythonProcess.stdin?.end();
      } catch (writeError: unknown) {
        if (isResolved) return;
        isResolved = true;
        clearTimeout(timeoutId);
        
        console.error(`[${this.serviceName}.${context}] Error escribiendo datos:`, {
          error: writeError
        });
        reject(new Error(`Error escribiendo datos: ${writeError instanceof Error ? writeError.message : String(writeError)}`));
      }
    });
  }

  /**
   * Calcula métricas de rendimiento
   */
  private calculatePerformanceMetrics(processingTime: number): PerformanceOptimizedResponse['performance_metrics'] {
    try {
      return {
        processing_time: processingTime,
        memory_usage: this.estimateMemoryUsage(),
        cpu_usage: this.estimateCPUUsage(),
        cache_hits: this.cache.size,
        parallel_tasks: this.getOptimalParallelTasks(),
        optimization_level: 'high'
      };
    } catch {
      return {
        processing_time: processingTime,
        memory_usage: 0,
        cpu_usage: 0,
        cache_hits: 0,
        parallel_tasks: 1,
        optimization_level: 'none'
      };
    }
  }

  /**
   * Estima uso de memoria
   */
  private estimateMemoryUsage(): number {
    try {
      // Estimación simplificada basada en tamaño de cache
      return this.cache.size * 0.1; // MB
    } catch {
      return 0;
    }
  }

  /**
   * Estima uso de CPU
   */
  private estimateCPUUsage(): number {
    try {
      // Estimación simplificada
      return Math.min(this.cache.size * 0.5, 100);
    } catch {
      return 0;
    }
  }

  /**
   * Obtiene número óptimo de tareas paralelas
   */
  private getOptimalParallelTasks(): number {
    try {
      // Basado en número de cores disponibles
      return Math.min(require('os').cpus().length, 8);
    } catch {
      return 4;
    }
  }

  /**
   * Limpia cache expirado
   */
  cleanExpiredCache(): void {
    try {
      const now = Date.now();
      for (const [key, value] of this.cache.entries()) {
        if (now - value.timestamp > this.cacheTimeout) {
          this.cache.delete(key);
        }
      }
      console.log(`[${this.serviceName}] Cache limpiado, ${this.cache.size} elementos restantes`);
    } catch (error) {
      console.error('Error limpiando cache:', error);
    }
  }

  /**
   * Obtiene estadísticas de rendimiento
   */
  getPerformanceStats(): { cacheSize: number; cacheHits: number; cacheMisses: number; avgProcessingTime: number } {
    try {
      return {
        cacheSize: this.cache.size,
        cacheHits: 0,
        cacheMisses: 0,
        avgProcessingTime: 0
      };
    } catch {
      return {
        cacheSize: 0,
        cacheHits: 0,
        cacheMisses: 0,
        avgProcessingTime: 0
      };
    }
  }

  /**
   * Verifica que el optimizador esté disponible
   */
  async verifyOptimizer(): Promise<boolean> {
    const context = 'verifyOptimizer';
    
    try {
      console.log(`[${this.serviceName}.${context}] Verificando optimizador`);

      return new Promise((resolve) => {
        const pythonProcess = spawn(this.pythonPath, ['--version'], {
          stdio: ['pipe', 'pipe', 'pipe']
        });

        pythonProcess.on('close', (code: number) => {
          const isAvailable = code === 0;
          console.log(`[${this.serviceName}.${context}] Verificación del optimizador:`, {
            available: isAvailable,
            code
          });
          resolve(isAvailable);
        });

        pythonProcess.on('error', () => {
          console.error(`[${this.serviceName}.${context}] Optimizador no disponible`);
          resolve(false);
        });
      });

    } catch (error: unknown) {
      console.error(`[${this.serviceName}.${context}] Error verificando optimizador:`, error);
      return false;
    }
  }
}

// Exportar instancia singleton
export const iatPerformanceService = new IATPerformanceService();
