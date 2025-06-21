/**
 * API para SmartVOC
 * Manejar solicitudes de manera similar a las otras APIs que funcionan bien
 */

import { ApiError } from '@/config/api-client';
import API_CONFIG from '@/config/api.config';
import { ApiClient } from '@/lib/api-client';
import { SmartVOCFormData } from 'shared/interfaces/smart-voc.interface';

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

  async deleteSmartVOC(researchId: string, formId: string): Promise<boolean> {
     console.log(`[SmartVOCAPI] Eliminando smart-voc para researchId: ${researchId}, formId: ${formId}`);
     const path = `/research/${researchId}/smart-voc/${formId}`;
     const result = await this.delete<any>(path);
     // El ApiClient devuelve null en 404, y undefined en 204 (éxito)
     // Si no es null (es decir, fue exitoso), devolvemos true
     return result !== null;
  }

  async deleteByResearchId(researchId: string): Promise<boolean> {
    console.log(`[SmartVOCAPI] Eliminando todos los datos smart-voc para researchId: ${researchId}`);
    const path = `/research/${researchId}/smart-voc`;
    const result = await this.delete<any>(path);
    return result !== null;
  }
}

export const smartVocFixedAPI = new SmartVOCFixedAPI();
