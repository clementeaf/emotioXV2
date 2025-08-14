import { welcomeScreenHttpService } from '@/api/welcomeScreenHttpService';
import {
  WelcomeScreenFormData,
  WelcomeScreenRecord
} from '../../../shared/interfaces/welcome-screen.interface';

/**
 * Servicio para manejar las operaciones relacionadas con pantallas de bienvenida
 */
export class WelcomeScreenService {
  /**
   * Obtiene la pantalla de bienvenida por ID de investigación
   */
  async getByResearchId(researchId: string): Promise<WelcomeScreenRecord | null> {
    try {
      // console.log('[WelcomeScreenService] Obteniendo welcome screen para researchId:', researchId);
      // Asegúrate que la API maneje correctamente si no se encuentra (e.g., 404 -> null)
      const data = await welcomeScreenHttpService.getByResearchId(researchId);

      // Si data es null (404 manejado por handleResponse), devolver null
      if (data === null) {
        console.log(`ℹ️ [WelcomeScreen] Configuración no encontrada para investigación ${researchId} (normal para investigaciones nuevas)`);
        return null;
      }
      // console.log('[WelcomeScreenService] Welcome screen obtenido:', data);
      return data;
    } catch (error: any) {
      // Si el error es un 404, es esperado si no existe, devolvemos null
      if (error?.statusCode === 404 || error?.response?.status === 404) {
        // console.log('[WelcomeScreenService] No se encontró welcome screen para researchId:', researchId);
        return null;
      }
      // Otros errores sí son inesperados
      console.error('[WelcomeScreenService] Error en getByResearchId:', error);
      // Considera lanzar el error para que el UI pueda manejarlo si es necesario
      // throw error;
      return null; // O devolver null como antes
    }
  }

  /**
   * Crea o actualiza una pantalla de bienvenida (usando siempre POST - lógica upsert en backend)
   * @param data Datos del formulario, incluyendo researchId y opcionalmente id
   */
  async save(data: WelcomeScreenFormData & { researchId: string; id?: string }): Promise<WelcomeScreenRecord> {
    try {
      // console.log('[WelcomeScreenService] Guardando (upsert) welcome screen:', data);

      if (!data.researchId) {
        throw new Error('Se requiere un ID de investigación para guardar la pantalla de bienvenida');
      }

      // Extraer researchId. El id ya no se usa aquí, pero se deja en la firma por compatibilidad con el hook.
      const { researchId, ...payloadData } = data;

      // console.log(`[WelcomeScreenService] Enviando POST (upsert) para researchId: ${researchId}`);
      // Llamar siempre a create (POST). El backend debe manejar la lógica de actualizar si ya existe.
      const result = await welcomeScreenHttpService.create(researchId, payloadData as WelcomeScreenFormData);
      // console.log('[WelcomeScreenService] Welcome screen guardado (upsert):', result);
      return result;

    } catch (error) {
      console.error('[WelcomeScreenService] Error en save (upsert):', error);
      // Re-lanzar el error para que sea capturado por el hook y mostrado en el modal
      if (error instanceof Error) {
        throw error;
      } else {
        const message = (error as any)?.message || String(error);
        throw new Error(`Error al guardar welcome screen: ${message}`);
      }
    }
  }

  /**
   * Elimina una pantalla de bienvenida por researchId y screenId
   * @param researchId ID de la investigación asociada
   * @param screenId ID de la pantalla de bienvenida
   */
  async delete(researchId: string, screenId: string): Promise<void> {
    try {
      // console.log('[WelcomeScreenService] Eliminando welcome screen para researchId:', researchId);
      await welcomeScreenHttpService.delete(researchId);
      // console.log('[WelcomeScreenService] Welcome screen eliminado correctamente para researchId:', researchId);
    } catch (error) {
      console.error('[WelcomeScreenService] Error en delete:', error);
      if (error instanceof Error) {
        throw error;
      } else {
        const message = (error as any)?.message || String(error);
        throw new Error(`Error al eliminar welcome screen: ${message}`);
      }
    }
  }

  /**
   * Crea una nueva pantalla de bienvenida para una investigación específica
   * @param researchId ID de la investigación
   * @param data Datos de la pantalla de bienvenida
   * @returns Pantalla de bienvenida creada
   */
  async createForResearch(researchId: string, data: WelcomeScreenFormData): Promise<WelcomeScreenRecord> {
    try {
      return await welcomeScreenHttpService.create(researchId, data);
    } catch (error) {
      console.error('[WelcomeScreenService] Error en createForResearch:', error);
      if (error instanceof Error) {
        throw error;
      } else {
        const message = (error as any)?.message || String(error);
        throw new Error(`Error al crear welcome screen: ${message}`);
      }
    }
  }

  /**
   * Actualiza una pantalla de bienvenida existente para una investigación específica
   * @param researchId ID de la investigación
   * @param screenId ID de la pantalla de bienvenida
   * @param data Datos a actualizar
   * @returns Pantalla de bienvenida actualizada
   */
  async updateForResearch(researchId: string, screenId: string, data: WelcomeScreenFormData): Promise<WelcomeScreenRecord> {
    try {
      return await welcomeScreenHttpService.update(researchId, data);
    } catch (error) {
      console.error('[WelcomeScreenService] Error en updateForResearch:', error);
      if (error instanceof Error) {
        throw error;
      } else {
        const message = (error as any)?.message || String(error);
        throw new Error(`Error al actualizar welcome screen: ${message}`);
      }
    }
  }
}

export const welcomeScreenService = new WelcomeScreenService();
