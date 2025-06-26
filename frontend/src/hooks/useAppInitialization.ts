import { useEffect } from 'react';

import { apiClient } from '../config/api';

export const useAppInitialization = () => {
  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    const initializeApp = () => {
      const isDevEnv = process.env.NODE_ENV === 'development';

      // Reactivar el debugger de manera más segura
      if (isDevEnv && typeof window.enableApiDebugger === 'function') {
        try {
          window.enableApiDebugger();
          console.log('🔍 [API-DEBUG] Debugger activado exitosamente');
        } catch (error) {
          console.warn('🔍 [API-DEBUG] Error al activar debugger:', error);
        }
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
