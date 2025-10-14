import { spawn } from 'child_process';
import type { IATSessionModel } from '../models/iat.model';

/**
 * Interfaz para comunicación con Python IAT Bridge
 */
interface PythonIATResponse {
  success: boolean;
  data?: {
    d_score: number;
    mean_rt_compatible: number;
    mean_rt_incompatible: number;
    error_rate: number;
    statistical_significance: boolean;
    effect_size: number;
    confidence_interval: [number, number];
    analysis_method?: string;
    error_message?: string;
    raw_data?: any[];
  };
  error?: string;
  timestamp?: string;
}

/**
 * Servicio para comunicación con Python IAT Bridge
 * Maneja la ejecución de análisis IAT usando Python desde Node.js
 */
export class PythonIATBridgeService {
  private readonly serviceName = 'PythonIATBridgeService';
  private readonly pythonPath: string;
  private readonly bridgeScriptPath: string;

  constructor() {
    // Configurar rutas del entorno Python
    this.pythonPath = process.env.PYTHON_PATH || 'python3';
    this.bridgeScriptPath = process.env.IAT_BRIDGE_SCRIPT || 
      `${__dirname}/python-iat-bridge.py`;
    
    console.log(`[${this.serviceName}] Inicializando Python IAT Bridge Service`, {
      pythonPath: this.pythonPath,
      bridgeScriptPath: this.bridgeScriptPath
    });
  }

  /**
   * Ejecuta análisis IAT usando Python bridge
   * @param sessionData Datos de la sesión IAT
   * @returns Resultado del análisis IAT
   */
  async analyzeIATData(sessionData: IATSessionModel): Promise<any> {
    const context = 'analyzeIATData';
    console.log(`[${this.serviceName}.${context}] Iniciando análisis IAT con Python`);

    try {
      // Preparar datos para Python
      const pythonInput = this.preparePythonInput(sessionData);
      
      // Ejecutar análisis Python
      const pythonResult = await this.executePythonAnalysis(pythonInput);
      
      console.log(`[${this.serviceName}.${context}] Análisis IAT completado`, {
        sessionId: sessionData.sessionId,
        success: pythonResult.success
      });

      return pythonResult;

    } catch (error: unknown) {
      console.error(`[${this.serviceName}.${context}] Error en análisis IAT:`, error);
      throw new Error(
        `Error ejecutando análisis IAT: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  /**
   * Prepara datos de sesión para envío a Python
   */
  private preparePythonInput(sessionData: IATSessionModel): any {
    return {
      sessionId: sessionData.sessionId,
      participantId: sessionData.participantId,
      testConfig: sessionData.testConfig,
      responses: sessionData.responses,
      metadata: {
        startTime: sessionData.startTime,
        lastActivity: sessionData.lastActivity
      }
    };
  }

  /**
   * Ejecuta el script Python y retorna el resultado
   */
  private async executePythonAnalysis(inputData: any): Promise<PythonIATResponse> {
    const context = 'executePythonAnalysis';
    
    return new Promise((resolve, reject) => {
      console.log(`[${this.serviceName}.${context}] Ejecutando análisis Python`);

      // Crear proceso Python
      const pythonProcess = spawn(this.pythonPath, [this.bridgeScriptPath], {
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
          console.error(`[${this.serviceName}.${context}] Python process failed:`, {
            code,
            stderr
          });
          reject(new Error(`Python process failed with code ${code}: ${stderr}`));
          return;
        }

        try {
          const result = JSON.parse(stdout) as PythonIATResponse;
          console.log(`[${this.serviceName}.${context}] Python analysis completed:`, {
            success: result.success
          });
          resolve(result);
        } catch (parseError: unknown) {
          console.error(`[${this.serviceName}.${context}] Error parsing Python output:`, {
            error: parseError,
            stdout
          });
          reject(new Error(`Error parsing Python output: ${parseError instanceof Error ? parseError.message : String(parseError)}`));
        }
      });

      // Manejar errores del proceso
      pythonProcess.on('error', (error: Error) => {
        console.error(`[${this.serviceName}.${context}] Python process error:`, error);
        reject(new Error(`Python process error: ${error.message}`));
      });

      // Enviar datos a Python
      try {
        const inputJson = JSON.stringify(inputData);
        pythonProcess.stdin?.write(inputJson);
        pythonProcess.stdin?.end();
      } catch (writeError: unknown) {
        console.error(`[${this.serviceName}.${context}] Error writing to Python stdin:`, {
          error: writeError
        });
        reject(new Error(`Error writing to Python: ${writeError instanceof Error ? writeError.message : String(writeError)}`));
      }
    });
  }

  /**
   * Verifica que el entorno Python esté disponible
   */
  async verifyPythonEnvironment(): Promise<boolean> {
    const context = 'verifyPythonEnvironment';
    
    try {
      console.log(`[${this.serviceName}.${context}] Verificando entorno Python`);

      return new Promise((resolve) => {
        const pythonProcess = spawn(this.pythonPath, ['--version'], {
          stdio: ['pipe', 'pipe', 'pipe']
        });

        pythonProcess.on('close', (code: number) => {
          const isAvailable = code === 0;
          console.log(`[${this.serviceName}.${context}] Python environment check:`, {
            available: isAvailable,
            code
          });
          resolve(isAvailable);
        });

        pythonProcess.on('error', () => {
          console.error(`[${this.serviceName}.${context}] Python not available`);
          resolve(false);
        });
      });

    } catch (error: unknown) {
      console.error(`[${this.serviceName}.${context}] Error checking Python environment:`, error);
      return false;
    }
  }
}

// Exportar instancia singleton
export const pythonIATBridgeService = new PythonIATBridgeService();
