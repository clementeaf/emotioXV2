import { spawn } from 'child_process';
import type { IATSessionModel } from '../models/iat.model';

/**
 * Interfaz para input del análisis avanzado
 */
interface AdvancedAnalysisInput {
  sessionId: string;
  participantId: string;
  testConfig: IATSessionModel['testConfig'];
  responses: IATSessionModel['responses'];
  metadata: {
    startTime: string;
    lastActivity: string;
    sessionDuration: number;
    totalTrials: number;
  };
}

/**
 * Interfaz para respuesta del motor de análisis avanzado
 */
interface AdvancedAnalysisResponse {
  success: boolean;
  analysis?: {
    d_score: number;
    d_score_interpretation: string;
    d_score_confidence_interval: [number, number];
    d_score_significance: boolean;
    d_score_effect_size: string;
    
    compatible_blocks_analysis: {
      block_number: number;
      block_type: string;
      trial_count: number;
      mean_rt: number;
      median_rt: number;
      std_rt: number;
      accuracy: number;
      error_rate: number;
      fast_trials: number;
      slow_trials: number;
      outlier_rate: number;
      learning_effect: number;
      consistency: number;
    };
    
    incompatible_blocks_analysis: {
      block_number: number;
      block_type: string;
      trial_count: number;
      mean_rt: number;
      median_rt: number;
      std_rt: number;
      accuracy: number;
      error_rate: number;
      fast_trials: number;
      slow_trials: number;
      outlier_rate: number;
      learning_effect: number;
      consistency: number;
    };
    
    overall_accuracy: number;
    overall_mean_rt: number;
    overall_consistency: number;
    learning_curve: number[];
    
    error_pattern: string;
    error_analysis: {
      total_errors: number;
      error_rate: number;
      error_blocks?: Record<string, number>;
    };
    
    fatigue_effect: number;
    attention_metrics: {
      focus: number;
      stability: number;
    };
    
    data_quality_score: number;
    reliability_metrics: {
      internal_consistency: number;
      test_retest_reliability: number;
      split_half_reliability: number;
    };
  };
  error?: string;
  timestamp?: string;
}

/**
 * Servicio para análisis estadístico avanzado IAT
 * Utiliza el motor Python de análisis avanzado
 */
export class IATAdvancedAnalysisService {
  private readonly serviceName = 'IATAdvancedAnalysisService';
  private readonly pythonPath: string;
  private readonly analysisEnginePath: string;

  constructor() {
    this.pythonPath = process.env.PYTHON_PATH || 'python3';
    this.analysisEnginePath = process.env.IAT_ANALYSIS_ENGINE_SCRIPT || 
      `${__dirname}/iat-analysis-engine.py`;
    
    console.log(`[${this.serviceName}] Inicializando servicio de análisis avanzado IAT`, {
      pythonPath: this.pythonPath,
      analysisEnginePath: this.analysisEnginePath
    });
  }

  /**
   * Realiza análisis estadístico avanzado de una sesión IAT
   * @param sessionData Datos de la sesión IAT
   * @returns Análisis estadístico completo
   */
  async performAdvancedAnalysis(sessionData: IATSessionModel): Promise<AdvancedAnalysisResponse> {
    const context = 'performAdvancedAnalysis';
    console.log(`[${this.serviceName}.${context}] Iniciando análisis estadístico avanzado`);

    try {
      // Preparar datos para el motor de análisis
      const analysisInput = this.prepareAnalysisInput(sessionData);
      
      // Ejecutar análisis avanzado
      const analysisResult = await this.executeAdvancedAnalysis(analysisInput);
      
      console.log(`[${this.serviceName}.${context}] Análisis avanzado completado`, {
        sessionId: sessionData.sessionId,
        success: analysisResult.success,
        dScore: analysisResult.analysis?.d_score
      });

      return analysisResult;

    } catch (error: unknown) {
      console.error(`[${this.serviceName}.${context}] Error en análisis avanzado:`, error);
      return {
        success: false,
        error: `Error ejecutando análisis avanzado: ${error instanceof Error ? error.message : String(error)}`,
        timestamp: new Date().toISOString()
      };
    }
  }

  /**
   * Prepara datos de sesión para análisis avanzado
   */
  private prepareAnalysisInput(sessionData: IATSessionModel): AdvancedAnalysisInput {
    return {
      sessionId: sessionData.sessionId,
      participantId: sessionData.participantId,
      testConfig: sessionData.testConfig,
      responses: sessionData.responses,
      metadata: {
        startTime: sessionData.startTime,
        lastActivity: sessionData.lastActivity,
        sessionDuration: this.calculateSessionDuration(sessionData),
        totalTrials: sessionData.responses?.length || 0
      }
    };
  }

  /**
   * Calcula duración de la sesión
   */
  private calculateSessionDuration(sessionData: IATSessionModel): number {
    try {
      if (!sessionData.startTime || !sessionData.lastActivity) {
        return 0;
      }
      
      const start = new Date(sessionData.startTime).getTime();
      const end = new Date(sessionData.lastActivity).getTime();
      
      return Math.round((end - start) / 1000); // Segundos
    } catch (error) {
      console.error('Error calculando duración de sesión:', error);
      return 0;
    }
  }

  /**
   * Ejecuta el motor de análisis avanzado
   */
  private async executeAdvancedAnalysis(inputData: AdvancedAnalysisInput): Promise<AdvancedAnalysisResponse> {
    const context = 'executeAdvancedAnalysis';
    
    return new Promise((resolve, reject) => {
      console.log(`[${this.serviceName}.${context}] Ejecutando motor de análisis avanzado`);

      // Crear proceso Python
      const pythonProcess = spawn(this.pythonPath, [this.analysisEnginePath], {
        stdio: ['pipe', 'pipe', 'pipe'],
        cwd: process.cwd()
      });

      let stdout = '';
      let stderr = '';

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
        if (code !== 0) {
          console.error(`[${this.serviceName}.${context}] Motor de análisis falló:`, {
            code,
            stderr
          });
          reject(new Error(`Motor de análisis falló con código ${code}: ${stderr}`));
          return;
        }

        try {
          const result = JSON.parse(stdout) as AdvancedAnalysisResponse;
          console.log(`[${this.serviceName}.${context}] Motor de análisis completado:`, {
            success: result.success
          });
          resolve(result);
        } catch (parseError: unknown) {
          console.error(`[${this.serviceName}.${context}] Error parseando salida del motor:`, {
            error: parseError,
            stdout
          });
          reject(new Error(`Error parseando salida del motor: ${parseError instanceof Error ? parseError.message : String(parseError)}`));
        }
      });

      // Manejar errores del proceso
      pythonProcess.on('error', (error: Error) => {
        console.error(`[${this.serviceName}.${context}] Error del proceso Python:`, error);
        reject(new Error(`Error del proceso Python: ${error.message}`));
      });

      // Enviar datos al motor
      try {
        const inputJson = JSON.stringify(inputData);
        pythonProcess.stdin?.write(inputJson);
        pythonProcess.stdin?.end();
      } catch (writeError: unknown) {
        console.error(`[${this.serviceName}.${context}] Error escribiendo al motor:`, {
          error: writeError
        });
        reject(new Error(`Error escribiendo al motor: ${writeError instanceof Error ? writeError.message : String(writeError)}`));
      }
    });
  }

  /**
   * Verifica que el motor de análisis esté disponible
   */
  async verifyAnalysisEngine(): Promise<boolean> {
    const context = 'verifyAnalysisEngine';
    
    try {
      console.log(`[${this.serviceName}.${context}] Verificando motor de análisis`);

      return new Promise((resolve) => {
        const pythonProcess = spawn(this.pythonPath, ['--version'], {
          stdio: ['pipe', 'pipe', 'pipe']
        });

        pythonProcess.on('close', (code: number) => {
          const isAvailable = code === 0;
          console.log(`[${this.serviceName}.${context}] Verificación del motor:`, {
            available: isAvailable,
            code
          });
          resolve(isAvailable);
        });

        pythonProcess.on('error', () => {
          console.error(`[${this.serviceName}.${context}] Motor no disponible`);
          resolve(false);
        });
      });

    } catch (error: unknown) {
      console.error(`[${this.serviceName}.${context}] Error verificando motor:`, error);
      return false;
    }
  }

  /**
   * Genera reporte de análisis en formato legible
   */
  generateAnalysisReport(analysis: AdvancedAnalysisResponse['analysis']): string {
    if (!analysis) {
      return 'No hay datos de análisis disponibles';
    }

    const report = `
# REPORTE DE ANÁLISIS IAT AVANZADO

## PUNTUACIÓN D-SCORE
- **D-Score:** ${analysis.d_score.toFixed(3)}
- **Interpretación:** ${analysis.d_score_interpretation}
- **Significancia:** ${analysis.d_score_significance ? 'Sí' : 'No'}
- **Tamaño del efecto:** ${analysis.d_score_effect_size}
- **Intervalo de confianza:** [${analysis.d_score_confidence_interval[0].toFixed(3)}, ${analysis.d_score_confidence_interval[1].toFixed(3)}]

## ANÁLISIS DE BLOQUES

### Bloques Compatibles
- **Precisión:** ${(analysis.compatible_blocks_analysis.accuracy * 100).toFixed(1)}%
- **RT Promedio:** ${analysis.compatible_blocks_analysis.mean_rt.toFixed(0)}ms
- **Consistencia:** ${(analysis.compatible_blocks_analysis.consistency * 100).toFixed(1)}%
- **Efecto de aprendizaje:** ${(analysis.compatible_blocks_analysis.learning_effect * 100).toFixed(1)}%

### Bloques Incompatibles
- **Precisión:** ${(analysis.incompatible_blocks_analysis.accuracy * 100).toFixed(1)}%
- **RT Promedio:** ${analysis.incompatible_blocks_analysis.mean_rt.toFixed(0)}ms
- **Consistencia:** ${(analysis.incompatible_blocks_analysis.consistency * 100).toFixed(1)}%
- **Efecto de aprendizaje:** ${(analysis.incompatible_blocks_analysis.learning_effect * 100).toFixed(1)}%

## RENDIMIENTO GENERAL
- **Precisión general:** ${(analysis.overall_accuracy * 100).toFixed(1)}%
- **RT promedio:** ${analysis.overall_mean_rt.toFixed(0)}ms
- **Consistencia general:** ${(analysis.overall_consistency * 100).toFixed(1)}%

## ANÁLISIS DE ERRORES
- **Patrón de errores:** ${analysis.error_pattern}
- **Tasa de error:** ${(analysis.error_analysis.error_rate * 100).toFixed(1)}%
- **Total de errores:** ${analysis.error_analysis.total_errors}

## MÉTRICAS TEMPORALES
- **Efecto de fatiga:** ${(analysis.fatigue_effect * 100).toFixed(1)}%
- **Enfoque:** ${(analysis.attention_metrics.focus * 100).toFixed(1)}%
- **Estabilidad:** ${(analysis.attention_metrics.stability * 100).toFixed(1)}%

## CALIDAD DE DATOS
- **Puntuación de calidad:** ${(analysis.data_quality_score * 100).toFixed(1)}%
- **Consistencia interna:** ${(analysis.reliability_metrics.internal_consistency * 100).toFixed(1)}%
- **Confiabilidad split-half:** ${(analysis.reliability_metrics.split_half_reliability * 100).toFixed(1)}%
`;

    return report;
  }
}

// Exportar instancia singleton
export const iatAdvancedAnalysisService = new IATAdvancedAnalysisService();
