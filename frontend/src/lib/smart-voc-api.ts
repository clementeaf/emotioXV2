/**
 * API para SmartVOC
 * Manejar solicitudes de manera similar a las otras APIs que funcionan bien
 */

import { SmartVOCFormData } from 'shared/interfaces/smart-voc.interface';
import API_CONFIG from '@/config/api.config';
import { ApiClient } from '@/lib/api-client';
import { ApiError } from '@/config/api-client';

export class SmartVOCFixedAPI extends ApiClient {
  constructor() {
    super(`${API_CONFIG.baseURL}`);
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