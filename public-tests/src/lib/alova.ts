import { API_HTTP_ENDPOINT } from '../config/endpoints.js';

const API_CONFIG = {
  baseURL: API_HTTP_ENDPOINT,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  }
};

const buildUrl = (path: string): string => {
  const cleanPath = path.startsWith('/') ? path.substring(1) : path;
  return `${API_CONFIG.baseURL}/${cleanPath}`;
};

const validateResponse = (response: Response): Response => {
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
  }
  return response;
};

const parseJson = async <T>(response: Response): Promise<T> => {
  try {
    return await response.json() as T;
  } catch (error) {
    console.error('[API] Error parseando JSON:', error);
    throw new Error('Error al procesar la respuesta del servidor');
  }
};

const apiRequest = async <T>(
  url: string,
  options: RequestInit = {}
): Promise<T> => {
  const fullUrl = buildUrl(url);

  const config: RequestInit = {
    headers: {
      ...API_CONFIG.headers,
      ...options.headers
    },
    ...options
  };

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), API_CONFIG.timeout);

    const response = await fetch(fullUrl, {
      ...config,
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    const validatedResponse = validateResponse(response);
    return await parseJson<T>(validatedResponse);

  } catch (error: unknown) {
    console.error('[API] Error en request:', error);

    if (error instanceof Error) {
      if (error.name === 'AbortError') {
        throw new Error('La solicitud tardó demasiado en completarse');
      }

      if (error.message?.includes('404')) {
        throw new Error('Recurso no encontrado');
      }

      if (error.message?.includes('500')) {
        throw new Error('Error interno del servidor');
      }

      if (error.message?.includes('4')) {
        throw new Error('Error en la solicitud');
      }
    }

    throw new Error('Error de conexión');
  }
};

export { API_CONFIG, apiRequest, buildUrl, parseJson, validateResponse };
