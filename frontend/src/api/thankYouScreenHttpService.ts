/**
 * Servicio HTTP para Thank You Screen - EmotioXV2
 * Consume apiRoutes.ts y maneja todas las operaciones HTTP con fetch nativo
 */

import { API_BASE_URL } from '../config/api';
import { apiRoutes } from './apiRoutes';

/**
 * Manejo de respuesta HTTP unificado
 */
const handleResponse = async (response: Response) => {
  if (!response.ok) {
    // Manejar 404 como caso especial para thank-you-screen
    if (response.status === 404) {
      console.log(`ℹ️ [ThankYouScreen] Configuración no encontrada (normal para investigaciones nuevas)`);
      return { message: 'No hay datos disponibles para esta investigación.' };
    }
    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
  }
  return await response.json();
};

/**
 * Obtener headers de autenticación
 */
const getAuthHeaders = () => {
  const token = typeof window !== 'undefined'
    ? localStorage.getItem('token') || sessionStorage.getItem('token')
    : '';

  return {
    'Content-Type': 'application/json',
    ...(token && { 'Authorization': `Bearer ${token}` })
  };
};

/**
 * Servicio Thank You Screen usando fetch nativo
 */
export const thankYouScreenHttpService = {
  /**
   * Obtener thank you screen por research ID
   */
  async getByResearchId(researchId: string) {
    const response = await fetch(`${API_BASE_URL}${apiRoutes.thankYouScreen.base(researchId)}`, {
      method: 'GET',
      headers: getAuthHeaders(),
    });
    return handleResponse(response);
  },

  /**
   * Crear nuevo thank you screen
   */
  async create(researchId: string, data: any) {
    const response = await fetch(`${API_BASE_URL}${apiRoutes.thankYouScreen.base(researchId)}`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    return handleResponse(response);
  },

  /**
   * Actualizar thank you screen existente
   */
  async update(researchId: string, data: any) {
    const response = await fetch(`${API_BASE_URL}${apiRoutes.thankYouScreen.base(researchId)}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    return handleResponse(response);
  },

  /**
   * Eliminar thank you screen
   */
  async delete(researchId: string) {
    const response = await fetch(`${API_BASE_URL}${apiRoutes.thankYouScreen.base(researchId)}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });
    return handleResponse(response);
  }
};

export default thankYouScreenHttpService;
