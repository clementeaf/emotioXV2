/**
 * Utilidad de diagnóstico para variables de entorno y WebSocket
 */

export function debugEnvironmentVariables() {
  console.log('🔍 DIAGNÓSTICO DE VARIABLES DE ENTORNO');
  console.log('=====================================');

  // Variables críticas
  const criticalVars = {
    'NEXT_PUBLIC_API_URL': process.env.NEXT_PUBLIC_API_URL,
    'NEXT_PUBLIC_WS_URL': process.env.NEXT_PUBLIC_WS_URL,
  };

  console.log('📋 Variables críticas:');
  Object.entries(criticalVars).forEach(([key, value]) => {
    const status = value ? '✅' : '❌';
    console.log(`${status} ${key}: ${value || 'NO DEFINIDA'}`);
  });

  // URLs construidas
  console.log('\n🌐 URLs construidas:');
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'NO DEFINIDA';
  const wsUrl = process.env.NEXT_PUBLIC_WS_URL || 'NO DEFINIDA';

  console.log(`API URL: ${apiUrl}`);
  console.log(`WS URL: ${wsUrl}`);

  // Validaciones
  console.log('\n🔒 Validaciones de seguridad:');
  const hasLocalhost = apiUrl.includes('localhost') || wsUrl.includes('localhost');
  const hasAWS = apiUrl.includes('execute-api.us-east-1.amazonaws.com') || wsUrl.includes('execute-api.us-east-1.amazonaws.com');

  console.log(`❌ Contiene localhost: ${hasLocalhost ? 'SÍ' : 'NO'}`);
  console.log(`✅ Contiene AWS Lambda: ${hasAWS ? 'SÍ' : 'NO'}`);

  // Estado del WebSocket
  console.log('\n🔌 Estado del WebSocket:');
  if (!process.env.NEXT_PUBLIC_WS_URL) {
    console.log('⚠️  NEXT_PUBLIC_WS_URL no está definida');
    console.log('⚠️  Se requiere configuración dinámica desde el backend');
  }

  return {
    hasApiUrl: !!process.env.NEXT_PUBLIC_API_URL,
    hasWsUrl: !!process.env.NEXT_PUBLIC_WS_URL,
    apiUrl,
    wsUrl,
    isSecure: !hasLocalhost && hasAWS
  };
}

export function getWebSocketUrlForMonitoring(): string {
  // 🎯 OBTENER URL DEL WEBSOCKET PARA MONITOREO
  const wsUrl = process.env.NEXT_PUBLIC_WS_URL || '';

  console.log('🔌 WebSocket URL para monitoreo:', wsUrl || 'NO DEFINIDA');

  return wsUrl;
}
