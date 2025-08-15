/**
 * Script de prueba para verificar la conexión WebSocket
 */

import { DYNAMIC_API_ENDPOINTS } from '../api/dynamic-endpoints';

export function testWebSocketConnection(): Promise<boolean> {
  return new Promise((resolve) => {
    try {
      // Obtener URL dinámicamente
      const endpoints = DYNAMIC_API_ENDPOINTS;
      const wsUrl = endpoints.ws;

      if (!wsUrl) {
        console.log('❌ No se pudo obtener URL de WebSocket desde endpoints dinámicos');
        resolve(false);
        return;
      }

      console.log('🧪 Probando conexión WebSocket:', wsUrl);

      const ws = new WebSocket(wsUrl);

      const timeout = setTimeout(() => {
        console.log('⏰ Timeout en conexión WebSocket');
        ws.close();
        resolve(false);
      }, 10000); // 10 segundos de timeout

      ws.onopen = () => {
        console.log('✅ WebSocket conectado exitosamente');
        clearTimeout(timeout);
        ws.close();
        resolve(true);
      };

      ws.onclose = (event) => {
        console.log('❌ WebSocket desconectado:', event.code, event.reason);
        clearTimeout(timeout);
        resolve(false);
      };

      ws.onerror = (error) => {
        console.error('❌ Error en WebSocket:', error);
        clearTimeout(timeout);
        resolve(false);
      };
    } catch (error) {
      console.error('❌ Error obteniendo endpoints dinámicos:', error);
      resolve(false);
    }
  });
}

export function testMonitoringWebSocket(researchId: string): Promise<boolean> {
  return new Promise((resolve) => {
    try {
      // Obtener URL dinámicamente
      const endpoints = DYNAMIC_API_ENDPOINTS;
      const wsUrl = endpoints.ws;

      if (!wsUrl) {
        console.log('❌ No se pudo obtener URL de WebSocket desde endpoints dinámicos');
        resolve(false);
        return;
      }

      console.log('🧪 Probando WebSocket de monitoreo:', wsUrl);

      const ws = new WebSocket(wsUrl);

      const timeout = setTimeout(() => {
        console.log('⏰ Timeout en WebSocket de monitoreo');
        ws.close();
        resolve(false);
      }, 10000);

      ws.onopen = () => {
        console.log('✅ WebSocket de monitoreo conectado');

        // Enviar mensaje de suscripción
        const subscribeMessage = {
          type: 'SUBSCRIBE_RESEARCH',
          data: {
            researchId,
            timestamp: new Date().toISOString()
          }
        };

        ws.send(JSON.stringify(subscribeMessage));
        console.log('📡 Mensaje de suscripción enviado:', subscribeMessage);

        // Esperar respuesta
        setTimeout(() => {
          console.log('✅ Prueba de monitoreo completada');
          clearTimeout(timeout);
          ws.close();
          resolve(true);
        }, 2000);
      };

      ws.onclose = (event) => {
        console.log('❌ WebSocket de monitoreo desconectado:', event.code, event.reason);
        clearTimeout(timeout);
        resolve(false);
      };

      ws.onerror = (error) => {
        console.error('❌ Error en WebSocket de monitoreo:', error);
        clearTimeout(timeout);
        resolve(false);
      };

      ws.onmessage = (event) => {
        console.log('📨 Mensaje recibido en prueba:', event.data);
      };
    } catch (error) {
      console.error('❌ Error obteniendo endpoints dinámicos:', error);
      resolve(false);
    }
  });
}
