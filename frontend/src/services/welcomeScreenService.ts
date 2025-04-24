import { apiClient, ApiError } from '../config/api-client';

/**
 * Interfaz para los datos de la pantalla de bienvenida
 */
export interface WelcomeScreenData {
  title: string;
  subtitle?: string;
  message: string;
  startButtonText: string;
  logoUrl?: string;
  backgroundImageUrl?: string;
  backgroundColor?: string;
  textColor?: string;
  isEnabled?: boolean;
  theme?: string;
  disclaimer?: string;
  customCss?: string;
  researchId: string;
  metadata?: { 
    version?: string;
    lastUpdated?: string;
    lastModifiedBy?: string;
  };
}

/**
 * Interfaz para la respuesta del servidor con la pantalla de bienvenida
 */
export interface WelcomeScreenRecord extends WelcomeScreenData {
  id: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * Servicio para manejar operaciones relacionadas con pantallas de bienvenida
 */
export const welcomeScreenService = {
  /**
   * Obtiene una pantalla de bienvenida por su ID específico y el de su investigación.
   * @param researchId ID de la investigación padre.
   * @param screenId ID específico de la pantalla.
   * @returns Pantalla de bienvenida.
   */
  async getById(researchId: string, screenId: string): Promise<WelcomeScreenRecord> {
    try {
      // Usar 'GET' (mayúsculas) como se define en API_CONFIG
      return await apiClient.get<WelcomeScreenRecord, 'welcomeScreen'>(
        'welcomeScreen', 
        'GET', // Corregido
        { researchId, screenId } 
      );
    } catch (error) {
      console.error(`Error al obtener pantalla de bienvenida ${screenId} para investigación ${researchId}:`, error);
      throw error;
    }
  },

  /**
   * Obtiene la pantalla de bienvenida asociada a una investigación
   * @param researchId ID de la investigación
   * @returns Pantalla de bienvenida o null si no se encuentra.
   */
  async getByResearchId(researchId: string): Promise<WelcomeScreenRecord | null> {
    try {
      // El tipo genérico T aquí es lo que devuelve la API (y apiClient)
      const result = await apiClient.get<WelcomeScreenRecord, 'welcomeScreen'>(
        'welcomeScreen', 
        'GET_BY_RESEARCH', 
        { researchId } 
      );
      // Devolver directamente el resultado de apiClient
      return result;
    } catch (error: any) {
      if (error instanceof ApiError && error.statusCode === 404) {
         console.log(`[Service] No se encontró pantalla (404), devolviendo null.`);
        return null; // <-- Correcto
      }
      console.error(`Error al obtener pantalla de bienvenida para investigación ${researchId}:`, error);
      throw error;
    }
  },

  /**
   * Crea una nueva pantalla de bienvenida (POST a ruta base)
   * @param data Datos de la pantalla (debe incluir researchId)
   * @returns Pantalla creada
   */
  async create(data: WelcomeScreenData): Promise<WelcomeScreenRecord> {
    try {
      if (!data.researchId) throw new Error('researchId es requerido en los datos para crear.');
      // Usar 'CREATE' (mayúsculas)
      return await apiClient.post<WelcomeScreenRecord, WelcomeScreenData, 'welcomeScreen'>(
        'welcomeScreen', 
        'CREATE', // Corregido
        data, 
        { researchId: data.researchId } 
      );
    } catch (error) {
      console.error('Error al crear pantalla de bienvenida:', error);
      throw error;
    }
  },

  /**
   * Actualiza una pantalla de bienvenida existente (PUT a ruta específica)
   * @param researchId ID de la investigación padre.
   * @param screenId ID específico de la pantalla a actualizar.
   * @param data Datos parciales a actualizar.
   * @returns Pantalla actualizada.
   */
  async update(researchId: string, screenId: string, data: Partial<WelcomeScreenData>): Promise<WelcomeScreenRecord> {
    try {
      if (!researchId || !screenId) {
        throw new Error('researchId y screenId son requeridos para actualizar.');
      }
      console.log(`[Service DEBUG] Actualizando pantalla con screenId: ${screenId}, researchId: ${researchId}`);
      // Usar 'UPDATE' (mayúsculas)
      return await apiClient.put<WelcomeScreenRecord, Partial<WelcomeScreenData>, 'welcomeScreen'>(
        'welcomeScreen', 
        'UPDATE', // Corregido
        data, 
        { researchId, screenId } 
      );
    } catch (error) {
      console.error(`Error al actualizar pantalla de bienvenida ${screenId}:`, error);
      throw error;
    }
  },

  /**
   * Elimina una pantalla de bienvenida (DELETE a ruta específica)
   * @param researchId ID de la investigación padre.
   * @param screenId ID específico de la pantalla a eliminar.
   */
  async delete(researchId: string, screenId: string): Promise<void> {
    try {
      if (!researchId || !screenId) {
        throw new Error('researchId y screenId son requeridos para eliminar.');
      }
      // Usar 'DELETE' (mayúsculas)
      await apiClient.delete<void, 'welcomeScreen'>(
        'welcomeScreen', 
        'DELETE', // Corregido
        { researchId, screenId } 
      );
    } catch (error) {
      console.error(`Error al eliminar pantalla de bienvenida ${screenId}:`, error);
      throw error;
    }
  },

  /**
   * Crea una nueva pantalla de bienvenida para una investigación específica (Usa POST).
   */
  async createForResearch(
    researchId: string,
    data: WelcomeScreenData // Incluye researchId
  ): Promise<WelcomeScreenRecord> {
      // Llama a la función `create` base 
      return this.create(data); 
  },

  /**
   * Actualiza una pantalla de bienvenida existente para una investigación (Usa PUT).
   */
  async updateForResearch(
    researchId: string, 
    screenId: string,
    data: Partial<WelcomeScreenData> // No incluye researchId/screenId aquí
  ): Promise<WelcomeScreenRecord> {
      // Llama a la función `update` base pasando todos los IDs
      return this.update(researchId, screenId, data); 
  }
};

export default welcomeScreenService; 