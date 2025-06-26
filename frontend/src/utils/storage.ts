/**
 * Utilidad para manejar localStorage de forma segura en SSR
 */

const isClient = typeof window !== 'undefined';

export const storage = {
  getItem: (key: string): string | null => {
    if (!isClient) return null;
    try {
      return localStorage.getItem(key);
    } catch (error) {
      console.error('Error accessing localStorage:', error);
      return null;
    }
  },

  setItem: (key: string, value: string): void => {
    if (!isClient) return;
    try {
      localStorage.setItem(key, value);
    } catch (error) {
      console.error('Error setting localStorage:', error);
    }
  },

  removeItem: (key: string): void => {
    if (!isClient) return;
    try {
      localStorage.removeItem(key);
    } catch (error) {
      console.error('Error removing from localStorage:', error);
    }
  },

  clear: (): void => {
    if (!isClient) return;
    try {
      localStorage.clear();
    } catch (error) {
      console.error('Error clearing localStorage:', error);
    }
  },

  key: (index: number): string | null => {
    if (!isClient) return null;
    try {
      return localStorage.key(index);
    } catch (error) {
      console.error('Error getting localStorage key:', error);
      return null;
    }
  },

  get length(): number {
    if (!isClient) return 0;
    try {
      return localStorage.length;
    } catch (error) {
      console.error('Error getting localStorage length:', error);
      return 0;
    }
  },

  // Métodos para sessionStorage
  getSessionItem: (key: string): string | null => {
    if (!isClient) return null;
    try {
      return sessionStorage.getItem(key);
    } catch (error) {
      console.error('Error accessing sessionStorage:', error);
      return null;
    }
  },

  setSessionItem: (key: string, value: string): void => {
    if (!isClient) return;
    try {
      sessionStorage.setItem(key, value);
    } catch (error) {
      console.error('Error setting sessionStorage:', error);
    }
  },

  removeSessionItem: (key: string): void => {
    if (!isClient) return;
    try {
      sessionStorage.removeItem(key);
    } catch (error) {
      console.error('Error removing from sessionStorage:', error);
    }
  },

  // Utilidad para obtener todas las keys
  getKeys: (): string[] => {
    if (!isClient) return [];
    try {
      return Object.keys(localStorage);
    } catch (error) {
      console.error('Error getting localStorage keys:', error);
      return [];
    }
  },

  getSessionKeys: (): string[] => {
    if (!isClient) return [];
    try {
      return Object.keys(sessionStorage);
    } catch (error) {
      console.error('Error getting sessionStorage keys:', error);
      return [];
    }
  }
};
