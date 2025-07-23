import { API_WEBSOCKET_ENDPOINT } from '../config/endpoints';

/**
 * 🧪 SCRIPT DE DIAGNÓSTICO PARA WEBSOCKET
 *
 * Este script ayuda a diagnosticar problemas de conectividad WebSocket
 * en public-tests
 */

/**
 * Función para probar la conectividad del WebSocket
 */
export async function testWebSocketConnection(): Promise<{
  success: boolean;
  error?: string;
  details?: any;
}> {
  return new Promise((resolve) => {
    try {
      // 🎯 OBTENER URL DEL WEBSOCKET DESDE CONFIGURACIÓN
      const wsUrl = import.meta.env.VITE_WS_URL || API_WEBSOCKET_ENDPOINT;

      console.log('🧪 Probando conexión WebSocket:', wsUrl);

      const ws = new WebSocket(wsUrl);

      const timeout = setTimeout(() => {
        console.log('⏰ Timeout en conexión WebSocket');
        ws.close();
        resolve({
          success: false,
          error: 'Timeout en conexión WebSocket',
          details: { wsUrl }
        });
      }, 10000); // 10 segundos

      ws.onopen = () => {
        console.log('✅ WebSocket conectado exitosamente');
        clearTimeout(timeout);
        ws.close();
        resolve({
          success: true,
          details: { wsUrl }
        });
      };

      ws.onclose = (event) => {
        console.log('❌ WebSocket desconectado:', {
          code: event.code,
          reason: event.reason,
          wasClean: event.wasClean
        });
        clearTimeout(timeout);
        resolve({
          success: false,
          error: `WebSocket desconectado: ${event.code} - ${event.reason}`,
          details: { wsUrl, event }
        });
      };

      ws.onerror = (error) => {
        console.error('❌ Error en WebSocket:', error);
        clearTimeout(timeout);
        resolve({
          success: false,
          error: 'Error en WebSocket',
          details: { wsUrl, error }
        });
      };

    } catch (error) {
      console.error('❌ Error creando WebSocket:', error);
      resolve({
        success: false,
        error: 'Error creando WebSocket',
        details: { error }
      });
    }
  });
}

/**
 * Función para verificar variables de entorno
 */
export function checkEnvironmentVariables(): {
  VITE_WS_URL: string | undefined;
  VITE_API_URL: string | undefined;
} {
  const env = {
    VITE_WS_URL: import.meta.env.VITE_WS_URL,
    VITE_API_URL: import.meta.env.VITE_API_URL
  };

  console.log('🔍 Variables de entorno:', env);
  return env;
}

/**
 * Función para diagnosticar problemas de red
 */
export async function diagnoseNetworkIssues(): Promise<void> {
  console.log('🔍 Iniciando diagnóstico de red...');

  // 🎯 VERIFICAR VARIABLES DE ENTORNO
  const env = checkEnvironmentVariables();

  // 🎯 PROBAR CONEXIÓN WEBSOCKET
  const wsTest = await testWebSocketConnection();

  // 🎯 MOSTRAR RESULTADOS
  console.log('📊 Resultados del diagnóstico:');
  console.log('- Variables de entorno:', env);
  console.log('- Test WebSocket:', wsTest);

  if (!wsTest.success) {
    console.log('❌ Problemas detectados:');
    console.log('1. Verificar que VITE_WS_URL esté configurada');
    console.log('2. Verificar conectividad de red');
    console.log('3. Verificar que el endpoint WebSocket esté disponible');
  } else {
    console.log('✅ WebSocket funcionando correctamente');
  }
}

// 🎯 EXPORTAR PARA USO EN CONSOLA DEL NAVEGADOR
if (typeof window !== 'undefined') {
  (window as any).testWebSocketConnection = testWebSocketConnection;
  (window as any).checkEnvironmentVariables = checkEnvironmentVariables;
  (window as any).diagnoseNetworkIssues = diagnoseNetworkIssues;

  console.log('🧪 Script de diagnóstico WebSocket cargado. Usa:');
  console.log('- testWebSocketConnection() para probar conexión');
  console.log('- checkEnvironmentVariables() para verificar variables');
  console.log('- diagnoseNetworkIssues() para diagnóstico completo');
}
