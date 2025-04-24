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
export function structuredLog(level: LogLevel, context: string, message: string, data?: any): void {
    const logEntry = {
        timestamp: new Date().toISOString(),
        level,
        context,
        message,
        // Solo añadir data si existe y tiene contenido
        ...(data && Object.keys(data).length > 0 && { data })
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