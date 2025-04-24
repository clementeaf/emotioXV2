/**
 * API para SmartVOC
 * Manejar solicitudes de manera similar a las otras APIs que funcionan bien
 */

import { SmartVOCFormData, SmartVOCFormResponse } from 'shared/interfaces/smart-voc.interface';
import API_CONFIG from '@/config/api.config';
import { ApiClient } from '@/lib/api-client';
import { ApiError } from '@/config/api-client';

interface ApiResponse<T> {
  data?: T & { id?: string };
  error?: boolean;
  message?: string;
  notFound?: boolean;
}

// Preparar los encabezados con el token de autenticación
const getAuthHeaders = (): Record<string, string> => {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json'
  };
  
  if (typeof window !== 'undefined') {
    const storageType = localStorage.getItem('auth_storage_type') || 'local';
    const token = storageType === 'local'
      ? localStorage.getItem('token') || ''
      : sessionStorage.getItem('token') || '';
    
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
  }
  
  return headers;
};

/**
 * Manejador de respuesta personalizado para SmartVOC
 * @param response Respuesta fetch
 * @returns Datos procesados o error
 */
const handleSmartVOCResponse = async (response: Response) => {
  // Para respuestas 404 en getByResearchId, no lanzamos error sino que manejamos especialmente
  
  try {
    const data = await response.json();
    if (!response.ok) {
      console.warn(`[SmartVOCAPI] Respuesta no exitosa: ${response.status}`, data);
      
      // Caso especial para 404 - Simplemente retornar un objeto con notFound=true
      if (response.status === 404) {
        return { 
          notFound: true, 
          data: null,
          status: 404
        };
      }
      
      return { 
        error: true, 
        status: response.status, 
        message: data.message || data.error || response.statusText,
        data: null
      };
    }
    return data;
  } catch (error) {
    // Si no es JSON, intentar obtener como texto
    const text = await response.text().catch(() => '');
    if (!response.ok) {
      console.warn(`[SmartVOCAPI] Error no-JSON: ${response.status}`);
      
      // Caso especial para 404 - Simplemente retornar un objeto con notFound=true
      if (response.status === 404) {
        return { 
          notFound: true, 
          data: null,
          status: 404
        };
      }
      
      return { 
        error: true, 
        status: response.status, 
        message: text || response.statusText,
        data: null
      };
    }
    return text || {};
  }
};

// Función simple para normalizar URLs
const normalizeUrl = (base: string, path: string): string => {
  const cleanBase = base.endsWith('/') ? base.slice(0, -1) : base;
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  return `${cleanBase}${cleanPath}`;
};

export class SmartVOCFixedAPI extends ApiClient {
  constructor() {
    // La baseURL específica para POST/PUT/DELETE de smart-voc podría ser útil,
    // pero para GET by researchId, la ruta es diferente.
    super(`${API_CONFIG.baseURL}`); // Cambiar baseURL base si es necesario o quitar /smart-voc
  }

  async create(data: SmartVOCFormData): Promise<SmartVOCFormData> {
    console.log('[SmartVOCAPI] Creando smart-voc:', data);
    const path = `/research/${data.researchId}/smart-voc`;
    return this.post<SmartVOCFormData>(path, data);
  }

  async update(id: string, data: Partial<SmartVOCFormData>): Promise<SmartVOCFormData> {
    console.log(`[SmartVOCAPI] Actualizando smart-voc ${id}:`, data);
    if (!data.researchId) throw new Error('ResearchId es necesario para actualizar SmartVOC');
    const path = `/research/${data.researchId}/smart-voc/${id}`;
    return this.put<SmartVOCFormData>(path, data);
  }

  async getByResearchId(researchId: string): Promise<SmartVOCFormData | null> {
    console.log(`[SmartVOCAPI] Obteniendo smart-voc por researchId: ${researchId}`);
    const path = `/research/${researchId}/smart-voc`; 
    console.log(`[SmartVOCAPI] Llamando a GET ${path}`);
    try {
      const result = await this.get<SmartVOCFormData>(path);
      return result;
    } catch (error) {
      if (error instanceof ApiError && error.statusCode === 404) {
        console.log(`[SmartVOCAPI] No se encontró SmartVOC para researchId: ${researchId}, devolviendo null.`);
        return null;
      }
      console.error("[SmartVOCAPI] Error en getByResearchId:", error);
      throw error;
    }
  }

  async deleteSmartVOC(researchId: string, formId: string): Promise<void> {
     console.log(`[SmartVOCAPI] Eliminando smart-voc para researchId: ${researchId}, formId: ${formId}`);
     const path = `/research/${researchId}/smart-voc/${formId}`;
     await this.delete<void>(path);
  }
}

export const smartVocFixedAPI = new SmartVOCFixedAPI();