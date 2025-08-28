/**
 * Utilidad para depurar y registrar llamadas de API
 */

export const debugFetch = async (url: string, options: RequestInit = {}) => {
  
  
  let response;
  let error;
  
  try {
    response = await fetch(url, options);
    
    
    const responseHeadersObj: { [key: string]: string } = {};
    response.headers.forEach((value, key) => {
      responseHeadersObj[key] = value;
    });
    
    
    return response;
  } catch (e) {
    error = e;
    // Error en la solicitud
    throw e;
  } finally {
    
    // Registrar a localStorage para inspección
    if (typeof window !== 'undefined') {
      try {
        const apiLogs = JSON.parse(localStorage.getItem('api_debug_logs') || '[]');
        apiLogs.push({
          timestamp: new Date().toISOString(),
          url,
          method: options.method || 'GET',
          headers: options.headers,
          body: options.body ? JSON.parse(typeof options.body === 'string' ? options.body : JSON.stringify(options.body)) : null,
          response: response ? {
            status: response.status,
            statusText: response.statusText,
            headers: (() => {
              const headersObj: { [key: string]: string } = {};
              response.headers.forEach((value, key) => {
                headersObj[key] = value;
              });
              return headersObj;
            })()
          } : null,
          error: error instanceof Error ? { 
            name: error.name,
            message: error.message
          } : null
        });
        // Mantener solo los últimos 20 registros
        localStorage.setItem('api_debug_logs', JSON.stringify(apiLogs.slice(-20)));
      } catch (e) {
        // Error al guardar log de API en localStorage
      }
    }
  }
};

export const clearApiDebugLogs = () => {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('api_debug_logs');
  }
};

export const getApiDebugLogs = () => {
  if (typeof window !== 'undefined') {
    return JSON.parse(localStorage.getItem('api_debug_logs') || '[]');
  }
  return [];
}; 