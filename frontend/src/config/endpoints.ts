/**
 * Configuración centralizada de endpoints
 * SOLO usa variables de entorno - NO URLs hardcodeadas
 */

export interface EndpointConfig {
  apiUrl: string;
  wsUrl: string;
  isConfigured: boolean;
  hasValidUrls: boolean;
}

/**
 * Obtener configuración de endpoints desde variables de entorno
 */
export function getEndpointConfig(): EndpointConfig {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || '';
  const wsUrl = process.env.NEXT_PUBLIC_WS_URL || '';

  const isConfigured = !!(apiUrl && wsUrl);
  const hasValidUrls = isConfigured &&
    apiUrl.includes('execute-api.us-east-1.amazonaws.com') &&
    wsUrl.includes('execute-api.us-east-1.amazonaws.com');

  return {
    apiUrl,
    wsUrl,
    isConfigured,
    hasValidUrls
  };
}

/**
 * Validar que la configuración es correcta
 */
export function validateEndpointConfig(): boolean {
  const config = getEndpointConfig();

  if (!config.isConfigured) {
    return false;
  }

  if (!config.hasValidUrls) {
    return false;
  }


  return true;
}

/**
 * Obtener URL de API con path
 */
export function getApiUrl(path: string): string {
  const config = getEndpointConfig();

  if (!config.isConfigured) {
    throw new Error('Configuración de endpoints no disponible');
  }

  const cleanPath = path.startsWith('/') ? path.substring(1) : path;
  return `${config.apiUrl}/${cleanPath}`;
}

/**
 * Obtener URL de WebSocket
 */
export function getWebSocketUrl(): string {
  const config = getEndpointConfig();

  if (!config.isConfigured) {
    throw new Error('Configuración de WebSocket no disponible');
  }

  return config.wsUrl;
}
