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
        } catch (error) {
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
      }
    };

    initializeApp();
  }, []);
};
