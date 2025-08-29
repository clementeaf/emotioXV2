/**
 * Servicio de autenticación migrado a AlovaJS
 * Mantiene la misma interfaz pero usa Alova internamente
 */

import { alovaApiClient } from '../config/api-alova';
import { updateAlovaToken } from '../config/alova.config';

/**
 * Datos para el registro de usuario
 */
export interface RegisterData {
  email: string;
  password: string;
  name: string;
  lastName?: string;
}

/**
 * Datos para el inicio de sesión
 */
export interface LoginData {
  email: string;
  password: string;
}

/**
 * Respuesta del servidor tras autenticación exitosa
 */
export interface AuthResponse {
  user: {
    id: string;
    email: string;
    name: string;
    lastName?: string;
    role: string;
  };
  token: string;
  refreshToken: string;
}

/**
 * Respuesta estándar de la API
 */
interface APIResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  error?: string;
}

/**
 * Servicio para manejar operaciones de autenticación usando AlovaJS
 */
export const authService = {
  /**
   * Registra un nuevo usuario
   * @param data Datos de registro
   * @returns Respuesta con el usuario y tokens
   */
  async register(data: RegisterData): Promise<AuthResponse> {
    try {
      const response = await alovaApiClient.post('auth', 'register', data) as APIResponse<AuthResponse>;
      
      const authData = response.data || response as any;

      // Almacenar el token en localStorage para uso en futuras peticiones
      if (authData.token) {
        localStorage.setItem('token', authData.token);
        localStorage.setItem('refreshToken', authData.refreshToken);
        localStorage.setItem('user', JSON.stringify(authData.user));
        
        // Actualizar token en Alova
        updateAlovaToken(authData.token);
        alovaApiClient.setAuthToken(authData.token);
      }

      return authData;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Inicia sesión con credenciales
   * @param data Credenciales de inicio de sesión
   * @returns Respuesta con el usuario y tokens
   */
  async login(data: LoginData): Promise<AuthResponse> {
    try {
      const response = await alovaApiClient.post('auth', 'login', data) as APIResponse<AuthResponse>;
      
      const authData = response.data || response as any;

      // Almacenar el token en localStorage para uso en futuras peticiones
      if (authData.token) {
        localStorage.setItem('token', authData.token);
        localStorage.setItem('refreshToken', authData.refreshToken);
        localStorage.setItem('user', JSON.stringify(authData.user));
        
        // Actualizar token en Alova
        updateAlovaToken(authData.token);
        alovaApiClient.setAuthToken(authData.token);
      }

      return authData;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Refresca el token de autenticación
   * @returns Nueva respuesta de autenticación
   */
  async refreshToken(): Promise<AuthResponse> {
    try {
      const refreshToken = localStorage.getItem('refreshToken');
      if (!refreshToken) {
        throw new Error('No hay refresh token disponible');
      }

      const response = await alovaApiClient.post('auth', 'refreshToken', { 
        token: refreshToken 
      }) as APIResponse<AuthResponse>;
      
      const authData = response.data || response as any;

      // Actualizar tokens almacenados
      if (authData.token) {
        localStorage.setItem('token', authData.token);
        localStorage.setItem('refreshToken', authData.refreshToken);
        localStorage.setItem('user', JSON.stringify(authData.user));
        
        // Actualizar token en Alova
        updateAlovaToken(authData.token);
        alovaApiClient.setAuthToken(authData.token);
      }

      return authData;
    } catch (error) {
      // Si falla el refresh, limpiar tokens
      this.clearAuth();
      throw error;
    }
  },

  /**
   * Obtiene el perfil del usuario actual
   * @returns Datos del usuario
   */
  async getProfile(): Promise<AuthResponse['user']> {
    try {
      const response = await alovaApiClient.get('auth', 'profile') as APIResponse<AuthResponse['user']>;
      
      const userData = response.data || response as any;
      
      // Actualizar datos del usuario en localStorage
      localStorage.setItem('user', JSON.stringify(userData));
      
      return userData;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Cierra la sesión del usuario actual
   */
  async logout(): Promise<void> {
    try {
      await alovaApiClient.post('auth', 'logout', {});
      
      // Limpiar autenticación
      this.clearAuth();
    } catch (error) {
      // Aún así, limpiar tokens locales
      this.clearAuth();
      throw error;
    }
  },

  /**
   * Limpia toda la información de autenticación
   */
  clearAuth(): void {
    localStorage.removeItem('token');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
    
    // Limpiar token en Alova
    updateAlovaToken(null);
    alovaApiClient.clearAuthToken();
    
    // Limpiar caché de Alova relacionada con usuario
    import('../config/alova.config').then(({ alovaInstance }) => {
      alovaInstance.snapshots.match(/\/auth\//).forEach(method => method.abort());
    });
  },

  /**
   * Verifica si hay un usuario autenticado
   * @returns true si hay un token almacenado y válido
   */
  isAuthenticated(): boolean {
    const token = localStorage.getItem('token');
    const user = localStorage.getItem('user');
    return !!(token && user);
  },

  /**
   * Obtiene el token almacenado
   * @returns Token de autenticación o null
   */
  getToken(): string | null {
    return localStorage.getItem('token');
  },

  /**
   * Obtiene el usuario almacenado
   * @returns Datos del usuario o null
   */
  getUser(): AuthResponse['user'] | null {
    try {
      const userData = localStorage.getItem('user');
      return userData ? JSON.parse(userData) : null;
    } catch (error) {
      console.error('Error parsing user data:', error);
      return null;
    }
  },

  /**
   * Establece el token de autenticación en el cliente API
   * (útil al iniciar la aplicación si ya hay un token almacenado)
   */
  initializeAuth(): void {
    const token = localStorage.getItem('token');
    if (token) {
      // Actualizar token en Alova
      updateAlovaToken(token);
      alovaApiClient.setAuthToken(token);
    }
  },

  /**
   * Verifica si el token está próximo a expirar
   * @param threshold Minutos antes de la expiración para considerar próximo a expirar
   * @returns true si el token está próximo a expirar
   */
  isTokenNearExpiry(threshold: number = 5): boolean {
    const token = this.getToken();
    if (!token) return true;

    try {
      // Decodificar JWT para obtener la fecha de expiración
      const payload = JSON.parse(atob(token.split('.')[1]));
      const exp = payload.exp * 1000; // Convertir a milisegundos
      const now = Date.now();
      const thresholdMs = threshold * 60 * 1000; // Convertir minutos a milisegundos
      
      return (exp - now) <= thresholdMs;
    } catch (error) {
      console.error('Error checking token expiry:', error);
      return true; // Asumir que está expirado si hay error
    }
  },

  /**
   * Intenta renovar el token automáticamente si está próximo a expirar
   */
  async autoRefreshToken(): Promise<boolean> {
    try {
      if (this.isTokenNearExpiry()) {
        await this.refreshToken();
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error auto-refreshing token:', error);
      return false;
    }
  }
};

export default authService;