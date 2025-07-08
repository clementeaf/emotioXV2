/**
 * Utilidad para depurar y registrar llamadas de API
 */

export const debugFetch = async (url: string, options: RequestInit = {}) => {
  // console.log(`🔍 [API-DEBUG] Enviando solicitud a: ${url}`);
  // console.log('🔍 [API-DEBUG] Método:', options.method || 'GET');
  // console.log('🔍 [API-DEBUG] Cabeceras:', options.headers);
  
  if (options.body) {
    try {
      const bodyData = typeof options.body === 'string' 
        ? JSON.parse(options.body) 
        : options.body;
      // console.log('🔍 [API-DEBUG] Cuerpo:', bodyData);
    } catch (e) {
      // console.log('🔍 [API-DEBUG] Cuerpo (no JSON):', options.body);
    }
  }
  
  let response;
  let error;
  
  try {
    response = await fetch(url, options);
    
    // Clonar la respuesta para no consumirla
    const clonedResponse = response.clone();
    
    // console.log(`🔍 [API-DEBUG] Respuesta status: ${response.status} (${response.statusText})`);
    const responseHeadersObj: { [key: string]: string } = {};
    response.headers.forEach((value, key) => {
      responseHeadersObj[key] = value;
    });
    
    try {
      const responseData = await clonedResponse.json();
      // console.log('🔍 [API-DEBUG] Datos respuesta:', responseData);
    } catch (e) {
      const text = await clonedResponse.text();
      // console.log('🔍 [API-DEBUG] Respuesta texto:', text.substring(0, 500) + (text.length > 500 ? '...' : ''));
    }
    
    return response;
  } catch (e) {
    error = e;
    console.error('🔍 [API-DEBUG] Error en la solicitud:', e);
    throw e;
  } finally {
    // console.log('🔍 [API-DEBUG] Solicitud finalizada');
    
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
        console.error('Error al guardar log de API en localStorage:', e);
      }
    }
  }
};

export const clearApiDebugLogs = () => {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('api_debug_logs');
    // console.log('🔍 [API-DEBUG] Logs de API borrados');
  }
};

export const getApiDebugLogs = () => {
  if (typeof window !== 'undefined') {
    return JSON.parse(localStorage.getItem('api_debug_logs') || '[]');
  }
  return [];
}; 