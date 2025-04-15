'use client';

import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { authAPI } from '@/lib/api';

// Interfaz para los datos del usuario
interface User {
  id: string;
  email: string;
  name?: string;
}

// Interfaz para el contexto de autenticación
interface AuthContextType {
  user: User | null;
  token: string | null;
  authLoading: boolean;
  authError: string | null;
  login: (token: string, rememberMe: boolean) => Promise<void>;
  logout: () => Promise<void>;
  clearError: () => void;
}

// Crear el contexto
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Hook personalizado para facilitar el acceso al contexto
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth debe usarse dentro de un AuthProvider');
  }
  return context;
};

// Proveedor de autenticación
export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [authLoading, setAuthLoading] = useState<boolean>(true);
  const [authError, setAuthError] = useState<string | null>(null);

  const router = useRouter();

  // Cargar usuario y token al iniciar
  const loadUserData = useCallback(async () => {
    try {
      setAuthLoading(true);
      
      // Obtener token del localStorage
      const storedToken = localStorage.getItem('token');
      if (!storedToken) {
        setAuthLoading(false);
        return;
      }
      
      setToken(storedToken);
      
      // Verificar el token con la API y obtener datos del usuario
      try {
        const response = await authAPI.refreshToken();
        if (response.data.token && response.data.renewed) {
          // Actualizar token si fue renovado
          localStorage.setItem('token', response.data.token);
          setToken(response.data.token);
          
          // Establecer datos del usuario
          if (response.data.user) {
            setUser(response.data.user);
          }
        } else {
          // Si no se pudo renovar, pero se considera válido mantener la sesión
          // Intentar obtener los datos del usuario directamente
          try {
            const userResponse = await authAPI.getProfile();
            if (userResponse.data) {
              setUser(userResponse.data);
            }
          } catch (profileError) {
            console.error('Error al obtener perfil:', profileError);
            // Si hay error al obtener el perfil, cerrar sesión
            await logout();
          }
        }
      } catch (validationError) {
        console.error('Error al validar token:', validationError);
        // Token inválido, cerrar sesión
        await logout();
      }
    } catch (error) {
      console.error('Error al cargar datos del usuario:', error);
      setAuthError('Error al cargar datos del usuario');
    } finally {
      setAuthLoading(false);
    }
  }, []);

  // Cargar datos al montar el componente
  useEffect(() => {
    loadUserData();
  }, [loadUserData]);

  // Iniciar sesión con token
  const login = useCallback(async (newToken: string, rememberMe: boolean) => {
    try {
      setAuthLoading(true);
      setAuthError(null);
      
      // Guardar token en localStorage o sessionStorage según rememberMe
      localStorage.setItem('token', newToken);
      localStorage.setItem('auth_storage_type', rememberMe ? 'local' : 'session');
      
      // Establecer token en el estado
      setToken(newToken);
      
      // Obtener datos del usuario
      try {
        const userResponse = await authAPI.getProfile();
        if (userResponse.data) {
          setUser(userResponse.data);
        }
      } catch (profileError) {
        console.error('Error al obtener perfil después del login:', profileError);
        // Si hay error al obtener el perfil, establecer datos básicos del token (si es posible)
        // En un token JWT podríamos extraer datos básicos, pero por seguridad, no lo implementamos aquí
      }
    } catch (error) {
      console.error('Error al iniciar sesión:', error);
      setAuthError('Error al iniciar sesión');
      throw error;
    } finally {
      setAuthLoading(false);
    }
  }, []);

  // Cerrar sesión
  const logout = useCallback(async () => {
    try {
      setAuthLoading(true);
      
      // Intentar hacer logout en el servidor
      try {
        await authAPI.logout();
      } catch (logoutError) {
        console.warn('Error al hacer logout en el servidor:', logoutError);
        // Continuar con el logout local incluso si falla en el servidor
      }
      
      // Eliminar token del almacenamiento
      localStorage.removeItem('token');
      localStorage.removeItem('auth_storage_type');
      
      // Limpiar estado
      setUser(null);
      setToken(null);
      
      // Redirigir a login
      router.push('/login');
    } catch (error) {
      console.error('Error al cerrar sesión:', error);
      setAuthError('Error al cerrar sesión');
      throw error;
    } finally {
      setAuthLoading(false);
    }
  }, [router]);

  // Limpiar errores
  const clearError = useCallback(() => {
    setAuthError(null);
  }, []);

  // Valor del contexto
  const contextValue: AuthContextType = {
    user,
    token,
    authLoading,
    authError,
    login,
    logout,
    clearError
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
}; 