/**
 * Utilidad de Logging Estructurado
 */

export type LogLevel = 'info' | 'error' | 'warn' | 'debug';

/**
 * Registra un mensaje estructurado en la consola.
 * 
 * @param level Nivel del log (info, error, warn, debug).
 * @param context Contexto del log (ej: NombreClase.nombreMetodo).
 * @param message Mensaje principal del log.
 * @param data Datos adicionales a incluir en el log (objeto opcional).
 */
/**
 * Interfaz para datos de log estructurado con tipos específicos
 */
export interface LogData {
  [key: string]: string | number | boolean | Error | Record<string, string | number | boolean> | null | undefined;
}

/**
 * Helper function to convert unknown values to LogData compatible types
 */
const sanitizeLogValue = (value: unknown): string | number | boolean | Error | Record<string, string | number | boolean> | null | undefined => {
  if (value === null || value === undefined) return value;
  if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') return value;
  if (value instanceof Error) return value;
  if (Array.isArray(value)) return `[Array of ${value.length} items]`;
  if (typeof value === 'object') {
    try {
      // Try to convert object to a sanitized record
      const record: Record<string, string | number | boolean> = {};
      for (const [key, val] of Object.entries(value)) {
        if (typeof val === 'string' || typeof val === 'number' || typeof val === 'boolean') {
          record[key] = val;
        } else {
          record[key] = String(val);
        }
      }
      return record;
    } catch {
      return String(value);
    }
  }
  return String(value);
};

export function structuredLog(level: LogLevel, context: string, message: string, data?: Record<string, unknown> | LogData): void {
    // Sanitize data to ensure type compatibility
    const sanitizedData: LogData | undefined = data ? 
        Object.fromEntries(
            Object.entries(data).map(([key, value]) => [key, sanitizeLogValue(value)])
        ) : undefined;

    const logEntry = {
        timestamp: new Date().toISOString(),
        level,
        context,
        message,
        // Solo añadir data si existe y tiene contenido
        ...(sanitizedData && Object.keys(sanitizedData).length > 0 && { data: sanitizedData })
    };
    
    switch (level) {
        case 'error':
            console.error(JSON.stringify(logEntry));
            break;
        case 'warn':
            console.warn(JSON.stringify(logEntry));
            break;
        case 'info':
            console.log(JSON.stringify(logEntry));
            break;
        case 'debug':
            // Opcional: solo loguear debug en entornos de no producción
            if (process.env.NODE_ENV !== 'production') {
                console.debug(JSON.stringify(logEntry));
            }
            break;
        default:
            console.log(JSON.stringify(logEntry)); // Por defecto a log
            break;
    }
}

// Ejemplo de uso:
// structuredLog('info', 'MyController.myMethod', 'Proceso iniciado', { userId: '123' });
// structuredLog('error', 'MyService.databaseCall', 'Falló la conexión', { error: err.message }); 