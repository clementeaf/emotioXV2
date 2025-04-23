import { 
  WelcomeScreenFormData,
  WelcomeScreenRecord 
} from '../../../shared/interfaces/welcome-screen.interface';
import { welcomeScreenAPI } from '@/lib/api';

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
      const response = await welcomeScreenAPI.getByResearchId(researchId);
      const data = response.data;
      console.log('[WelcomeScreenService] Welcome screen obtenido:', data);
      return data;
    } catch (error) {
      console.error('[WelcomeScreenService] Error en getByResearchId:', error);
      return null; // Devolvemos null para indicar que no existe
    }
  }

  /**
   * Crea o actualiza una pantalla de bienvenida
   */
  async save(data: WelcomeScreenFormData & { researchId: string }): Promise<WelcomeScreenRecord> {
    try {
      console.log('[WelcomeScreenService] Guardando welcome screen:', data);
      
      if (!data.researchId) {
        throw new Error('Se requiere un ID de investigación para guardar la pantalla de bienvenida');
      }
      
      let result;
      try {
        // Intentar obtener la pantalla existente primero
        const existing = await this.getByResearchId(data.researchId);
        
        if (existing && existing.id) {
          // Si existe, actualizar
          console.log('[WelcomeScreenService] Actualizando welcome screen existente con ID:', existing.id);
          const response = await welcomeScreenAPI.update(existing.id, {
            ...data,
            researchId: data.researchId // Asegurar que el researchId está presente
          });
          result = response.data;
        } else {
          throw new Error('No existe');
        }
      } catch (error) {
        // Si no existe o hay error, crear uno nuevo
        console.log('[WelcomeScreenService] Creando nuevo welcome screen');
        const response = await welcomeScreenAPI.create({
          ...data,
          // Asegurar que el researchId esté presente
          researchId: data.researchId
        });
        result = response.data;
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
   * @deprecated Esta función no es compatible con la nueva API jerárquica
   */
  async delete(id: string): Promise<void> {
    try {
      console.log('[WelcomeScreenService] Eliminando welcome screen con ID:', id);
      await welcomeScreenAPI.delete(id);
      console.log('[WelcomeScreenService] Welcome screen eliminado correctamente');
    } catch (error) {
      console.error('[WelcomeScreenService] Error en delete:', error);
      throw new Error(`Error al eliminar welcome screen: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
}

export const welcomeScreenService = new WelcomeScreenService(); 