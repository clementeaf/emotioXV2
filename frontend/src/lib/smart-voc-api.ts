/**
 * API para SmartVOC
 * Manejar solicitudes de manera similar a las otras APIs que funcionan bien
 */

import { SmartVOCFormData, SmartVOCFormResponse } from 'shared/interfaces/smart-voc.interface';
import API_CONFIG from '@/config/api.config';
import { ApiClient } from '@/lib/api-client';

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

  async create(data: SmartVOCFormData): Promise<ApiResponse<SmartVOCFormResponse>> {
    console.log('[SmartVOCAPI] Creando smart-voc:', data);
    // Ruta POST: /research/{researchId}/smart-voc
    const path = `/research/${data.researchId}/smart-voc`;
    return this.post<ApiResponse<SmartVOCFormResponse>>(path, data);
  }

  async update(id: string, data: Partial<SmartVOCFormData>): Promise<ApiResponse<SmartVOCFormResponse>> {
    console.log(`[SmartVOCAPI] Actualizando smart-voc ${id}:`, data);
     // Ruta PUT: /research/{researchId}/smart-voc (asume researchId está en data)
    if (!data.researchId) throw new Error('ResearchId es necesario para actualizar SmartVOC');
    const path = `/research/${data.researchId}/smart-voc`;
    return this.put<ApiResponse<SmartVOCFormResponse>>(path, data);
  }

  // getById probablemente no sea necesario si siempre se accede por researchId
  // async getById(id: string): Promise<ApiResponse<SmartVOCFormResponse>> { ... }

  async getByResearchId(researchId: string): Promise<ApiResponse<SmartVOCFormResponse>> {
    console.log(`[SmartVOCAPI] Obteniendo smart-voc por researchId: ${researchId}`);
    // Ruta correcta definida en el backend
    const path = `/research/${researchId}/smart-voc`; 
    console.log(`[SmartVOCAPI] Llamando a GET ${path}`);
    // Usar la baseURL base del constructor (asumiendo que es la raíz de la API)
    return this.get<ApiResponse<SmartVOCFormResponse>>(path); 
  }

  async deleteSmartVOC(researchId: string): Promise<ApiResponse<SmartVOCFormResponse>> {
     console.log(`[SmartVOCAPI] Eliminando smart-voc para researchId: ${researchId}`);
     // Ruta DELETE: /research/{researchId}/smart-voc
     const path = `/research/${researchId}/smart-voc`;
     return this.delete<ApiResponse<SmartVOCFormResponse>>(path);
  }
}

export const smartVocFixedAPI = new SmartVOCFixedAPI();