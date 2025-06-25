import { apiClient } from '@/config/api-client';
import { useEffect } from 'react';

export const useAppInitialization = () => {
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const initializeApp = () => {
      const isDevEnv = process.env.NODE_ENV === 'development';

      if (isDevEnv && typeof window.enableApiDebugger === 'function') {
        window.enableApiDebugger();
      }

      initializeApiAuth();
    };

    const initializeApiAuth = () => {
      try {
        const storageType = localStorage.getItem('auth_storage_type') || 'local';
        const storage = storageType === 'local' ? localStorage : sessionStorage;
        const token = storage.getItem('token');

        if (token) {
          apiClient.setAuthToken(token);
        }
      } catch (error) {
        console.error('🔑 [AUTH] Error al inicializar el token en apiClient:', error);
      }
    };

    initializeApp();
  }, []);
};
