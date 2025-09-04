/**
 * 🔐 AUTH HOOK - AlovaJS Clean Implementation
 * Strict TypeScript, SOLID principles
 * Authentication state management with AlovaJS
 */

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useRequest } from 'alova/client';
import { alovaInstance } from '../config/alova.config';
import { updateAlovaToken } from '../config/alova.config';
import type { 
  AuthResponse, 
  LoginRequest, 
  User,
  ApiResponse 
} from '../types/research';

interface UseAuthReturn {
  // State
  token: string | null;
  user: User | null;
  isAuthenticated: boolean;
  isAuthLoading: boolean;

  // Actions
  login: (credentials: LoginRequest) => Promise<void>;
  logout: () => Promise<void>;

  // Loading states
  isLoggingIn: boolean;
  isLoggingOut: boolean;

  // Errors
  loginError: Error | null;
  logoutError: Error | null;
}

interface StorageAuthData {
  token: string;
  user: User;
}

/**
 * Authentication hook using AlovaJS
 */
export function useAuth(): UseAuthReturn {
  const router = useRouter();
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);

  // Login mutation
  const loginMutation = useRequest(
    (credentials: LoginRequest) => 
      alovaInstance.Post<ApiResponse<AuthResponse>>('/auth/login', credentials),
    {
      immediate: false,
    }
  );

  // Logout mutation
  const logoutMutation = useRequest(
    () => alovaInstance.Post<ApiResponse<{ message: string }>>('/auth/logout'),
    {
      immediate: false,
    }
  );

  // Load auth from localStorage on mount
  useEffect(() => {
    loadAuthFromStorage();
  }, []);

  // Handle login
  const handleLogin = async (credentials: LoginRequest): Promise<void> => {
    try {
      const response = await loginMutation.send(credentials);
      const authData = response;

      if (!authData?.token || !authData?.user) {
        throw new Error('Invalid authentication response');
      }

      const storageData: StorageAuthData = {
        token: authData.token,
        user: authData.user
      };

      // Update state
      setToken(authData.token);
      setUser(authData.user);

      // Update localStorage
      saveAuthToStorage(storageData);

      // Update AlovaJS token
      updateAlovaToken(authData.token);

      // Navigate to dashboard
      router.push('/dashboard');
    } catch (error) {
      console.error('Login failed:', error);
      throw error;
    }
  };

  // Handle logout
  const handleLogout = async (): Promise<void> => {
    try {
      await logoutMutation.send();
    } catch (error) {
      console.error('Logout request failed:', error);
      // Continue with local logout even if server request fails
    } finally {
      // Clear state
      setToken(null);
      setUser(null);

      // Clear localStorage
      clearAuthFromStorage();

      // Update AlovaJS token
      updateAlovaToken(null);

      // Navigate to login
      router.push('/login');
    }
  };

  return {
    // State
    token,
    user,
    isAuthenticated: Boolean(token && user),
    isAuthLoading,

    // Actions
    login: handleLogin,
    logout: handleLogout,

    // Loading states
    isLoggingIn: loginMutation.loading,
    isLoggingOut: logoutMutation.loading,

    // Errors
    loginError: loginMutation.error || null,
    logoutError: logoutMutation.error || null,
  };
}

/**
 * Load authentication data from localStorage
 */
function loadAuthFromStorage(): StorageAuthData | null {
  try {
    const storedToken = localStorage.getItem('token');
    const storedUser = localStorage.getItem('user');

    if (!storedToken || !storedUser) {
      return null;
    }

    const user = JSON.parse(storedUser) as User;
    
    // Validate user object structure
    if (!isValidUser(user)) {
      clearAuthFromStorage();
      return null;
    }

    return { token: storedToken, user };
  } catch (error) {
    console.error('Error loading auth from storage:', error);
    clearAuthFromStorage();
    return null;
  }
}

/**
 * Save authentication data to localStorage
 */
function saveAuthToStorage(authData: StorageAuthData): void {
  try {
    localStorage.setItem('token', authData.token);
    localStorage.setItem('user', JSON.stringify(authData.user));
  } catch (error) {
    console.error('Error saving auth to storage:', error);
  }
}

/**
 * Clear authentication data from localStorage
 */
function clearAuthFromStorage(): void {
  try {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  } catch (error) {
    console.error('Error clearing auth from storage:', error);
  }
}

/**
 * Validate user object structure
 */
function isValidUser(user: unknown): user is User {
  return (
    typeof user === 'object' &&
    user !== null &&
    typeof (user as User).id === 'string' &&
    typeof (user as User).email === 'string' &&
    typeof (user as User).name === 'string'
  );
}

/**
 * Hook for checking authentication status only
 */
export function useAuthStatus() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const authData = loadAuthFromStorage();
    setIsAuthenticated(Boolean(authData));
    setIsLoading(false);
  }, []);

  return { isAuthenticated, isLoading };
}