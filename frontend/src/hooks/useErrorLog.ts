/**
 * Hook para registrar errores en la aplicación
 * Simple implementación que registra errores en la consola
 */

import { useCallback } from 'react';

export const useErrorLog = () => {
  const logError = useCallback((error: any, context?: string) => {
    const errorSource = context ? `[${context}]` : '[Error]';
    
    if (error instanceof Error) {
      console.error(`${errorSource} ${error.name}: ${error.message}`, error);
    } else {
      console.error(`${errorSource} Error:`, error);
    }
    
    // Aquí se podría implementar un registro de errores más avanzado
    // como enviar a un servicio de monitoreo de errores
    return error;
  }, []);

  return {
    log: logError,
    error: logError,
    warn: useCallback((message: string, context?: string) => {
      const source = context ? `[${context}]` : '[Warning]';
      console.warn(`${source} ${message}`);
    }, [])
  };
};

export default useErrorLog; 