/**
 * Configuración central de API para EmotioX Frontend
 * Base URL y configuración global
 */

export const API_BASE_URL = 'https://h68qs1et9j.execute-api.us-east-1.amazonaws.com/dev';

export const DEFAULT_HEADERS = {
  'Content-Type': 'application/json',
};

export const getAuthToken = (): string | null => {
  if (typeof window !== 'undefined') {
    return localStorage.getItem('token') || sessionStorage.getItem('token');
  }
  return null;
};

export const getAuthHeaders = () => {
  const token = getAuthToken();
  return {
    ...DEFAULT_HEADERS,
    ...(token && { Authorization: `Bearer ${token}` }),
  };
};
