/**
 * Configuración para el entorno Python IAT Bridge
 * Maneja variables de entorno y configuración del sistema Python
 */

export interface PythonBridgeConfig {
  pythonPath: string;
  bridgeScriptPath: string;
  virtualEnvPath?: string;
  timeout: number;
  maxRetries: number;
  logLevel: 'debug' | 'info' | 'warn' | 'error';
}

/**
 * Configuración por defecto del Python Bridge
 */
export const DEFAULT_PYTHON_CONFIG: PythonBridgeConfig = {
  pythonPath: process.env.PYTHON_PATH || 'python3',
  bridgeScriptPath: process.env.IAT_BRIDGE_SCRIPT || 
    `${__dirname}/python-iat-bridge.py`,
  virtualEnvPath: process.env.PYTHON_VENV_PATH || 
    `${process.cwd()}/iat-python-env`,
  timeout: parseInt(process.env.PYTHON_TIMEOUT || '30000'), // 30 segundos
  maxRetries: parseInt(process.env.PYTHON_MAX_RETRIES || '3'),
  logLevel: (process.env.PYTHON_LOG_LEVEL as any) || 'info'
};

/**
 * Configuración para diferentes entornos
 */
export const ENVIRONMENT_CONFIGS: Record<string, Partial<PythonBridgeConfig>> = {
  development: {
    timeout: 60000, // 60 segundos en desarrollo
    logLevel: 'debug'
  },
  production: {
    timeout: 30000, // 30 segundos en producción
    logLevel: 'info'
  },
  test: {
    timeout: 10000, // 10 segundos en tests
    logLevel: 'warn'
  }
};

/**
 * Obtiene la configuración del Python Bridge para el entorno actual
 */
export function getPythonBridgeConfig(): PythonBridgeConfig {
  const environment = process.env.NODE_ENV || 'development';
  const envConfig = ENVIRONMENT_CONFIGS[environment] || {};
  
  return {
    ...DEFAULT_PYTHON_CONFIG,
    ...envConfig
  };
}

/**
 * Valida la configuración del Python Bridge
 */
export function validatePythonBridgeConfig(config: PythonBridgeConfig): string[] {
  const errors: string[] = [];
  
  if (!config.pythonPath) {
    errors.push('PYTHON_PATH no está configurado');
  }
  
  if (!config.bridgeScriptPath) {
    errors.push('IAT_BRIDGE_SCRIPT no está configurado');
  }
  
  if (config.timeout < 5000) {
    errors.push('Timeout debe ser al menos 5 segundos');
  }
  
  if (config.maxRetries < 1) {
    errors.push('Max retries debe ser al menos 1');
  }
  
  return errors;
}

/**
 * Configuración de variables de entorno requeridas
 */
export const REQUIRED_ENV_VARS = [
  'PYTHON_PATH',
  'IAT_BRIDGE_SCRIPT'
] as const;

/**
 * Configuración de variables de entorno opcionales
 */
export const OPTIONAL_ENV_VARS = [
  'PYTHON_VENV_PATH',
  'PYTHON_TIMEOUT',
  'PYTHON_MAX_RETRIES',
  'PYTHON_LOG_LEVEL'
] as const;
