import { apiClient } from '../config/api-client';
import type {
  SmartVOCQuestion,
  SmartVOCFormData,
  SmartVOCFormResponse,
} from 'shared/interfaces/smart-voc.interface';

/**
 * Servicio para manejar operaciones relacionadas con formularios SmartVOC
 */
export const smartVOCFormService = {
  /**
   * Obtiene un formulario por su ID de investigación.
   * Nota: La ruta real del backend mapea researchId. 
   * El método original getById(formId) no tiene una ruta backend directa ahora.
   * Se mantiene getByResearchId.
   * @param researchId ID de la investigación
   * @returns Formulario SmartVOC (o array si el backend lo devuelve así)
   */
  async getByResearchId(researchId: string): Promise<SmartVOCFormData | null> { // Ajustar tipo de retorno si el backend devuelve solo uno o null
    try {
      // Asumiendo que GET_BY_RESEARCH mapea a GET /research/{researchId}/smart-voc
      const response = await apiClient.get<SmartVOCFormData, 'smartVoc'>('smartVoc', 'GET_BY_RESEARCH', { researchId });
      // Si el backend devuelve un array, tomar el primero o ajustar la lógica
      return response as SmartVOCFormData; // Hacer cast o ajustar según la respuesta real
    } catch (error: any) {
       // Manejar 404 específicamente si es posible
       if (error?.response?.status === 404) {
          console.log(`No se encontró formulario SmartVOC para investigación ${researchId}`);
          return null;
       }
      console.error(`Error al obtener formulario SmartVOC para investigación ${researchId}:`, error);
      throw error;
    }
  },

  /**
   * Crea un nuevo formulario SmartVOC
   * Ruta Backend: POST /research/{researchId}/smart-voc
   * @param data Datos del formulario (debe incluir researchId)
   * @returns Formulario creado
   */
  async create(data: SmartVOCFormData): Promise<SmartVOCFormData> {
    try {
      // Asumiendo que CREATE mapea a la ruta POST y el apiClient/backend extraen researchId
      const response = await apiClient.post<SmartVOCFormData, SmartVOCFormData, 'smartVoc'>('smartVoc', 'CREATE', data);
      return response;
    } catch (error) {
      console.error('Error al crear formulario SmartVOC:', error);
      throw error;
    }
  },

  /**
   * Actualiza un formulario SmartVOC existente
   * Ruta Backend: PUT /research/{researchId}/smart-voc/{formId}
   * @param researchId ID de la investigación
   * @param formId ID del formulario
   * @param data Datos a actualizar
   * @returns Formulario actualizado
   */
  async update(researchId: string, formId: string, data: Partial<SmartVOCFormData>): Promise<SmartVOCFormData> {
    try {
      // Pasar researchId y formId como parámetros de ruta
      const response = await apiClient.put<SmartVOCFormData, Partial<SmartVOCFormData>, 'smartVoc'>(
          'smartVoc', 
          'UPDATE', // Acción (puede ser usada por apiClient)
          data,     // Cuerpo de la petición
          { researchId, formId } // Parámetros de ruta
      );
      return response;
    } catch (error) {
      console.error(`Error al actualizar formulario SmartVOC ${formId} para investigación ${researchId}:`, error);
      throw error;
    }
  },

  /**
   * Elimina un formulario SmartVOC
   * Ruta Backend: DELETE /research/{researchId}/smart-voc/{formId}
   * @param researchId ID de la investigación
   * @param formId ID del formulario
   */
  async delete(researchId: string, formId: string): Promise<void> {
    try {
      // Pasar researchId y formId como parámetros de ruta
      const response = await apiClient.delete<{ success: boolean; message?: string }, 'smartVoc'>(
          'smartVoc', 
          'DELETE', // Acción
          { researchId, formId } // Parámetros de ruta
      );
      // El backend ahora devuelve 204 No Content en éxito, no un cuerpo
      // Comprobar el status si es necesario, pero si no hay error, asumir éxito.
      // if (!response.success) { 
      //   throw new Error(response.message || 'Error al eliminar formulario SmartVOC');
      // }
    } catch (error) {
      console.error(`Error al eliminar formulario SmartVOC ${formId} para investigación ${researchId}:`, error);
      throw error;
    }
  },

  // --- Métodos auxiliares que dependen de los anteriores --- 

  /**
   * Agrega una pregunta a un formulario existente
   * @param researchId ID de la investigación (necesario para update)
   * @param formId ID del formulario
   * @param question Datos de la pregunta
   * @returns Formulario actualizado
   */
   // NOTA: Este método requiere obtener el formulario actual para añadir la pregunta.
   // Dado que getById(formId) ya no mapea directamente, sería mejor usar getByResearchId.
   // Asumiremos que getByResearchId devuelve el formulario correcto.
  async addQuestion(researchId: string, formId: string, question: Omit<SmartVOCQuestion, 'id'>): Promise<SmartVOCFormData> {
    try {
      // Obtener el formulario actual usando researchId
      const form = await this.getByResearchId(researchId);
      if (!form) { 
          throw new Error(`Formulario no encontrado para research ${researchId}.`);
      }
      
      const newQuestion: SmartVOCQuestion = {
        ...question,
        id: Math.random().toString(36).substring(2, 15), 
      };
      
      const currentQuestions = Array.isArray(form.questions) ? form.questions : [];
      
      // Llamar a update con researchId y formId
      return await this.update(researchId, formId, {
        questions: [...currentQuestions, newQuestion]
      });
    } catch (error) {
      console.error(`Error al agregar pregunta al formulario ${formId}:`, error);
      throw error;
    }
  },

  /**
   * Elimina una pregunta de un formulario existente
   * @param researchId ID de la investigación (necesario para update)
   * @param formId ID del formulario (necesario para la ruta PUT)
   * @param questionId ID de la pregunta a eliminar
   * @returns Formulario actualizado
   */
  async deleteQuestion(researchId: string, formId: string, questionId: string): Promise<SmartVOCFormData> {
    try {
      // Obtener el formulario actual usando researchId
      const form = await this.getByResearchId(researchId);
      if (!form) {
          throw new Error(`Formulario no encontrado para research ${researchId}.`);
      }
      
      const currentQuestions = Array.isArray(form.questions) ? form.questions : [];
      const updatedQuestions = currentQuestions.filter(q => q.id !== questionId);
      
      // Llamar a update con researchId y formId
      return await this.update(researchId, formId, {
        questions: updatedQuestions
      });
    } catch (error) {
      console.error(`Error al eliminar pregunta ${questionId} del formulario ${formId}:`, error);
      throw error;
    }
  },

  // Eliminar método getById original si ya no tiene ruta backend
  /*
  async getById(id: string): Promise<SmartVOCFormData> {
    try {
      return await apiClient.get<SmartVOCFormData, 'smartVoc'>('smartVoc', 'GET', { id });
    } catch (error) {
      console.error(`Error al obtener formulario SmartVOC ${id}:`, error);
      throw error;
    }
  },
  */
};

export default smartVOCFormService; 