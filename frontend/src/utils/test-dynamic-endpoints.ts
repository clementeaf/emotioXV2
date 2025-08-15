/**
 * Script para probar el sistema de endpoints dinámicos
 */

import { DYNAMIC_API_ENDPOINTS } from '../api/dynamic-endpoints';

export function testDynamicEndpoints(): {
  success: boolean;
  endpoints: any;
  error?: string;
} {
  try {
    console.log('🧪 Probando sistema de endpoints dinámicos...');

    const endpoints = DYNAMIC_API_ENDPOINTS;

    console.log('✅ Endpoints dinámicos cargados:', {
      http: endpoints.http,
      ws: endpoints.ws,
      stage: endpoints.stage
    });

    // Verificar que las URLs son válidas
    const isValidHttp = endpoints.http?.includes('execute-api.us-east-1.amazonaws.com');
    const isValidWs = endpoints.ws?.includes('execute-api.us-east-1.amazonaws.com');

    if (!isValidHttp || !isValidWs) {
      return {
        success: false,
        endpoints,
        error: 'URLs no parecen ser de AWS Lambda'
      };
    }

    return {
      success: true,
      endpoints
    };

  } catch (error) {
    console.error('❌ Error probando endpoints dinámicos:', error);
    return {
      success: false,
      endpoints: null,
      error: error instanceof Error ? error.message : 'Error desconocido'
    };
  }
}

export function testDynamicWebSocketConnection(): Promise<{
  success: boolean;
  wsUrl?: string;
  error?: string;
}> {
  try {
    console.log('🧪 Probando conexión WebSocket con endpoints dinámicos...');

    const endpoints = DYNAMIC_API_ENDPOINTS;
    const wsUrl = endpoints.ws;

    if (!wsUrl) {
      return Promise.resolve({
        success: false,
        error: 'No se pudo obtener URL de WebSocket'
      });
    }

    console.log('🔌 Probando conexión a:', wsUrl);

    return new Promise((resolve) => {
      const ws = new WebSocket(wsUrl);

      const timeout = setTimeout(() => {
        console.log('⏰ Timeout en conexión WebSocket dinámica');
        ws.close();
        resolve({
          success: false,
          wsUrl,
          error: 'Timeout en conexión'
        });
      }, 10000);

      ws.onopen = () => {
        console.log('✅ WebSocket dinámico conectado exitosamente');
        clearTimeout(timeout);
        ws.close();
        resolve({
          success: true,
          wsUrl
        });
      };

      ws.onclose = (event) => {
        console.log('❌ WebSocket dinámico desconectado:', event.code, event.reason);
        clearTimeout(timeout);
        resolve({
          success: false,
          wsUrl,
          error: `Conexión cerrada: ${event.code} - ${event.reason}`
        });
      };

      ws.onerror = (error) => {
        console.error('❌ Error en WebSocket dinámico:', error);
        clearTimeout(timeout);
        resolve({
          success: false,
          wsUrl,
          error: 'Error de conexión WebSocket'
        });
      };
    });

  } catch (error) {
    console.error('❌ Error probando WebSocket dinámico:', error);
    return Promise.resolve({
      success: false,
      error: error instanceof Error ? error.message : 'Error desconocido'
    });
  }
}
