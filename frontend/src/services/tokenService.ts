/**
 * Servicio de gestión de tokens
 * Maneja la renovación automática, almacenamiento y validación de tokens de autenticación
 */
import { authAPI } from '@/lib/api';

// Intervalo para renovación periódica del token (30 minutos)
const TOKEN_REFRESH_INTERVAL = 30 * 60 * 1000;

// Tiempo mínimo que debe quedar para considerar renovar el token (2 horas)
const TOKEN_REFRESH_THRESHOLD = 2 * 60 * 60 * 1000;

// Variable para almacenar el temporizador de renovación
let refreshTimer: NodeJS.Timeout | null = null;

// Variable para controlar cuándo se muestran los mensajes de log
type LogLevel = 'ERROR' | 'WARN' | 'INFO' | 'DEBUG';
const LOG_LEVEL: LogLevel = (process.env.NODE_ENV === 'production' ? 'ERROR' : 'INFO') as LogLevel;
const SHOW_DETAILED_LOGS = process.env.NODE_ENV !== 'production';

/**
 * Función personalizada de logging para evitar mensajes excesivos en consola
 */
const logService = {
  info: (message: string, ...args: any[]) => {
    if (LOG_LEVEL === 'INFO' || LOG_LEVEL === 'DEBUG') {
      console.info(`[TokenService] ${message}`, ...args);
    }
  },
  warn: (message: string, ...args: any[]) => {
    // Para advertencias relacionadas con tokens ausentes, usar info en lugar de warn
    if (message.includes('No hay token') || message.includes('token ausente')) {
      if (SHOW_DETAILED_LOGS) {
        console.info(`[TokenService] (Info) ${message}`, ...args);
      }
    } else {
      console.warn(`[TokenService] ${message}`, ...args);
    }
  },
  error: (message: string, ...args: any[]) => {
    console.error(`[TokenService] ${message}`, ...args);
  }
};

/**
 * Decodifica un token JWT sin verificar la firma
 * @param token Token JWT
 * @returns Payload decodificado o null si hay error
 */
const decodeToken = (token: string): any | null => {
  try {
    // Obtener la parte del payload (segunda parte del token)
    const base64Url = token.split('.')[1];
    if (!base64Url) {return null;}
    
    // Decodificar el base64
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      window
        .atob(base64)
        .split('')
        .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    
    return JSON.parse(jsonPayload);
  } catch (error) {
    logService.error('Error al decodificar token:', error);
    return null;
  }
};

/**
 * Verifica si un token está próximo a expirar
 * @param token Token JWT
 * @returns true si está próximo a expirar, false en caso contrario
 */
const isTokenExpiringSoon = (token: string): boolean => {
  try {
    const payload = decodeToken(token);
    if (!payload || !payload.exp) {return true;}
    
    // Convertir exp a milisegundos
    const expirationTime = payload.exp * 1000;
    const currentTime = Date.now();
    
    // Si el token expira en menos del umbral, considerar que está próximo a expirar
    return expirationTime - currentTime < TOKEN_REFRESH_THRESHOLD;
  } catch (error) {
    logService.error('Error al verificar expiración del token:', error);
    return true; // En caso de error, asumir que el token está próximo a expirar
  }
};

/**
 * Obtiene el token actual del almacenamiento
 * @returns Token o null si no existe
 */
const getToken = (): string | null => {
  return localStorage.getItem('token');
};

/**
 * Guarda el token en el almacenamiento
 * @param token Token JWT
 */
const saveToken = (token: string): void => {
  localStorage.setItem('token', token);
  logService.info('Token actualizado en localStorage');
};

/**
 * Elimina el token del almacenamiento
 */
const removeToken = (): void => {
  localStorage.removeItem('token');
  logService.info('Token eliminado de localStorage');
  
  // Detener el temporizador si existe
  if (refreshTimer) {
    clearInterval(refreshTimer);
    refreshTimer = null;
  }
};

/**
 * Renueva el token si es necesario
 * @returns Promise con el resultado de la renovación
 */
const refreshTokenIfNeeded = async (): Promise<boolean> => {
  try {
    const currentToken = getToken();
    if (!currentToken) {
      // Cambio: usar info en lugar de warn para un mensaje más discreto
      logService.info('Token ausente - no es necesario renovar');
      return false;
    }
    
    // Si el token no está próximo a expirar, no es necesario renovarlo
    if (!isTokenExpiringSoon(currentToken)) {
      logService.info('Token vigente, no es necesario renovarlo');
      return false;
    }
    
    logService.info('Token próximo a expirar, solicitando renovación...');
    const response = await authAPI.refreshToken();
    
    if (response.data && response.data.token) {
      // Si el token fue renovado, guardarlo
      if (response.data.renewed) {
        logService.info('Token renovado exitosamente');
        saveToken(response.data.token);
        return true;
      } else {
        logService.info('El servidor indica que no es necesario renovar el token');
        return false;
      }
    } else {
      logService.warn('Respuesta de renovación inválida:', response);
      return false;
    }
  } catch (error) {
    logService.error('Error al renovar token:', error);
    return false;
  }
};

/**
 * Inicia la renovación automática del token
 */
const startAutoRefresh = (): void => {
  // Detener el temporizador anterior si existe
  if (refreshTimer) {
    clearInterval(refreshTimer);
  }
  
  // Intentar renovar el token inmediatamente al iniciar
  refreshTokenIfNeeded().then(renewed => {
    logService.info('Resultado de renovación inicial:', renewed ? 'Renovado' : 'No fue necesario');
  });
  
  // Configurar temporizador para renovación periódica
  refreshTimer = setInterval(() => {
    refreshTokenIfNeeded().then(renewed => {
      logService.info('Resultado de renovación periódica:', renewed ? 'Renovado' : 'No fue necesario');
    });
  }, TOKEN_REFRESH_INTERVAL);
  
  logService.info('Renovación automática de token iniciada');
};

/**
 * Detiene la renovación automática del token
 */
const stopAutoRefresh = (): void => {
  if (refreshTimer) {
    clearInterval(refreshTimer);
    refreshTimer = null;
    logService.info('Renovación automática de token detenida');
  }
};

// Exportar funciones del servicio
const tokenService = {
  getToken,
  saveToken,
  removeToken,
  refreshTokenIfNeeded,
  startAutoRefresh,
  stopAutoRefresh,
  isTokenExpiringSoon,
  decodeToken
};

export default tokenService; 