import { 
  WelcomeScreenFormData,
  WelcomeScreenRecord 
} from '../../../shared/interfaces/welcome-screen.interface';
import { apiClient } from '../config/api-client';

/**
 * Servicio para manejar las operaciones relacionadas con pantallas de bienvenida
 */
export class WelcomeScreenService {
  /**
   * Obtiene la pantalla de bienvenida por ID de investigación
   */
  async getByResearchId(researchId: string): Promise<WelcomeScreenRecord | null> {
    try {
      console.log('[WelcomeScreenService] Obteniendo welcome screen para researchId:', researchId);
      const data = await apiClient.get<WelcomeScreenRecord, 'welcomeScreen'>('welcomeScreen', 'getByResearch', { researchId });
      console.log('[WelcomeScreenService] Welcome screen obtenido:', data);
      return data;
    } catch (error) {
      console.error('[WelcomeScreenService] Error en getByResearchId:', error);
      throw new Error(`Error al obtener welcome screen: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Crea o actualiza una pantalla de bienvenida
   */
  async save(data: WelcomeScreenFormData & { researchId: string }): Promise<WelcomeScreenRecord> {
    try {
      console.log('[WelcomeScreenService] Guardando welcome screen:', data);
      
      let result;
      try {
        // Intentar obtener la pantalla existente primero
        await this.getByResearchId(data.researchId);
        // Si existe, actualizar
        result = await apiClient.put<WelcomeScreenRecord, WelcomeScreenFormData & { researchId: string }, 'welcomeScreen'>(
          'welcomeScreen', 
          'update', 
          data, 
          { id: data.researchId }
        );
      } catch (error) {
        // Si no existe, crear
        result = await apiClient.post<WelcomeScreenRecord, WelcomeScreenFormData & { researchId: string }, 'welcomeScreen'>(
          'welcomeScreen', 
          'create', 
          data
        );
      }
      
      console.log('[WelcomeScreenService] Welcome screen guardado:', result);
      return result;
    } catch (error) {
      console.error('[WelcomeScreenService] Error en save:', error);
      throw new Error(`Error al guardar welcome screen: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Elimina una pantalla de bienvenida
   */
  async delete(researchId: string): Promise<void> {
    try {
      console.log('[WelcomeScreenService] Eliminando welcome screen para researchId:', researchId);
      await apiClient.delete<void, 'welcomeScreen'>('welcomeScreen', 'delete', { researchId });
      console.log('[WelcomeScreenService] Welcome screen eliminado correctamente');
    } catch (error) {
      console.error('[WelcomeScreenService] Error en delete:', error);
      throw new Error(`Error al eliminar welcome screen: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
}

export const welcomeScreenService = new WelcomeScreenService(); 