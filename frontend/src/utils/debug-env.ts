/**
 * Utilidad de diagnóstico para variables de entorno y WebSocket
 */

export function debugEnvironmentVariables() {
  // URLs construidas
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'NO DEFINIDA';
  const wsUrl = process.env.NEXT_PUBLIC_WS_URL || 'NO DEFINIDA';

  // Validaciones
  const hasLocalhost = apiUrl.includes('localhost') || wsUrl.includes('localhost');
  const hasAWS = apiUrl.includes('execute-api.us-east-1.amazonaws.com') || wsUrl.includes('execute-api.us-east-1.amazonaws.com');

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


  return wsUrl;
}
