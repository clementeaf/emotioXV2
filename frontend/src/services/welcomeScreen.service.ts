import { 
  WelcomeScreenFormData,
  WelcomeScreenRecord 
} from '../../../shared/interfaces/welcome-screen.interface';
import config from '../config/api.config';

/**
 * Servicio para manejar las operaciones relacionadas con pantallas de bienvenida
 */
export class WelcomeScreenService {
  private baseUrl: string;

  constructor() {
    this.baseUrl = config.baseURL;
  }

  /**
   * Obtiene la pantalla de bienvenida por ID de investigación
   */
  async getByResearchId(researchId: string): Promise<WelcomeScreenRecord | null> {
    try {
      console.log('[WelcomeScreenService] Obteniendo welcome screen para researchId:', researchId);
      const url = `${this.baseUrl}/welcome-screen/research/${researchId}`;
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (!response.ok) {
        throw new Error(`Error al obtener welcome screen: ${response.statusText}`);
      }

      const data = await response.json();
      console.log('[WelcomeScreenService] Welcome screen obtenido:', data);
      
      return data.data;
    } catch (error) {
      console.error('[WelcomeScreenService] Error en getByResearchId:', error);
      return null;
    }
  }

  /**
   * Crea o actualiza una pantalla de bienvenida
   */
  async save(data: WelcomeScreenFormData & { researchId: string }): Promise<WelcomeScreenRecord> {
    try {
      console.log('[WelcomeScreenService] Guardando welcome screen:', data);
      
      const url = `${this.baseUrl}/welcome-screen/research/${data.researchId}`;
      const method = 'PUT';

      console.log('[WelcomeScreenService] Enviando petición:', { url, method, data });
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(data)
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('[WelcomeScreenService] Error en respuesta:', errorData);
        throw new Error(errorData.message || `Error al guardar welcome screen: ${response.statusText}`);
      }

      const result = await response.json();
      console.log('[WelcomeScreenService] Welcome screen guardado:', result);
      
      return result.data;
    } catch (error) {
      console.error('[WelcomeScreenService] Error en save:', error);
      throw error;
    }
  }

  /**
   * Elimina una pantalla de bienvenida
   */
  async delete(researchId: string): Promise<void> {
    try {
      console.log('[WelcomeScreenService] Eliminando welcome screen para researchId:', researchId);
      const url = `${this.baseUrl}/welcome-screen/research/${researchId}`;
      
      const response = await fetch(url, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (!response.ok) {
        throw new Error(`Error al eliminar welcome screen: ${response.statusText}`);
      }

      console.log('[WelcomeScreenService] Welcome screen eliminado correctamente');
    } catch (error) {
      console.error('[WelcomeScreenService] Error en delete:', error);
      throw error;
    }
  }
}

export const welcomeScreenService = new WelcomeScreenService(); 