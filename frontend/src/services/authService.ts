import { apiClient } from '../config/api';

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
 * Servicio para manejar operaciones de autenticación
 */
export const authService = {
  /**
   * Registra un nuevo usuario
   * @param data Datos de registro
   * @returns Respuesta con el usuario y tokens
   */
  async register(data: RegisterData): Promise<AuthResponse> {
    try {
      const response = await apiClient.post('auth', 'register', data) as AuthResponse;

      // Almacenar el token en localStorage para uso en futuras peticiones
      if (response.token) {
        localStorage.setItem('token', response.token);
        localStorage.setItem('refreshToken', response.refreshToken);
        apiClient.setAuthToken(response.token);
      }

      return response;
    } catch (error) {
      console.error('Error durante el registro:', error);
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
      const response = await apiClient.post('auth', 'login', data) as AuthResponse;

      // Almacenar el token en localStorage para uso en futuras peticiones
      if (response.token) {
        localStorage.setItem('token', response.token);
        localStorage.setItem('refreshToken', response.refreshToken);
        apiClient.setAuthToken(response.token);
      }

      return response;
    } catch (error) {
      console.error('Error durante el inicio de sesión:', error);
      throw error;
    }
  },

  /**
   * Cierra la sesión del usuario actual
   */
  async logout(): Promise<void> {
    try {
      await apiClient.post('auth', 'logout', {});

      // Limpiar tokens almacenados
      localStorage.removeItem('token');
      localStorage.removeItem('refreshToken');
      apiClient.clearAuthToken();
    } catch (error) {
      console.error('Error durante el cierre de sesión:', error);
      // Aún así, limpiar tokens locales
      localStorage.removeItem('token');
      localStorage.removeItem('refreshToken');
      apiClient.clearAuthToken();
      throw error;
    }
  },

  /**
   * Verifica si hay un usuario autenticado
   * @returns true si hay un token almacenado
   */
  isAuthenticated(): boolean {
    return !!localStorage.getItem('token');
  },

  /**
   * Establece el token de autenticación en el cliente API
   * (útil al iniciar la aplicación si ya hay un token almacenado)
   */
  initializeAuth(): void {
    const token = localStorage.getItem('token');
    if (token) {
      apiClient.setAuthToken(token);
    }
  }
};

export default authService;
