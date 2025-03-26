import { apiClient } from '../config/api-client';

/**
 * Interfaz para una pregunta en el formulario SmartVOC
 */
export interface SmartVOCQuestion {
  id: string;
  text: string;
  type: 'open' | 'closed' | 'rating' | 'multiple_choice';
  options?: string[];
  required: boolean;
  order: number;
}

/**
 * Interfaz para los datos del formulario SmartVOC
 */
export interface SmartVOCFormData {
  title: string;
  description?: string;
  questions: SmartVOCQuestion[];
  settings?: {
    showProgressBar: boolean;
    allowBack: boolean;
    requireAllQuestions: boolean;
    shuffleQuestions: boolean;
  };
  researchId: string;
}

/**
 * Interfaz para la respuesta del servidor con el formulario SmartVOC
 */
export interface SmartVOCFormRecord extends SmartVOCFormData {
  id: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * Servicio para manejar operaciones relacionadas con formularios SmartVOC
 */
export const smartVOCFormService = {
  /**
   * Obtiene un formulario por su ID
   * @param id ID del formulario
   * @returns Formulario SmartVOC
   */
  async getById(id: string): Promise<SmartVOCFormRecord> {
    try {
      return await apiClient.get<SmartVOCFormRecord, 'forms'>('forms', 'getForm', { id });
    } catch (error) {
      console.error(`Error al obtener formulario SmartVOC ${id}:`, error);
      throw error;
    }
  },

  /**
   * Obtiene los formularios asociados a una investigación
   * @param researchId ID de la investigación
   * @returns Lista de formularios SmartVOC
   */
  async getByResearchId(researchId: string): Promise<SmartVOCFormRecord[]> {
    try {
      return await apiClient.get<SmartVOCFormRecord[], 'forms'>('forms', 'getFormsByResearch', { researchId });
    } catch (error) {
      console.error(`Error al obtener formularios SmartVOC para investigación ${researchId}:`, error);
      throw error;
    }
  },

  /**
   * Crea un nuevo formulario SmartVOC
   * @param data Datos del formulario
   * @returns Formulario creado
   */
  async create(data: SmartVOCFormData): Promise<SmartVOCFormRecord> {
    try {
      return await apiClient.post<SmartVOCFormRecord, SmartVOCFormData, 'forms'>('forms', 'createForm', data);
    } catch (error) {
      console.error('Error al crear formulario SmartVOC:', error);
      throw error;
    }
  },

  /**
   * Actualiza un formulario SmartVOC existente
   * @param id ID del formulario
   * @param data Datos a actualizar
   * @returns Formulario actualizado
   */
  async update(id: string, data: Partial<SmartVOCFormData>): Promise<SmartVOCFormRecord> {
    try {
      return await apiClient.put<SmartVOCFormRecord, Partial<SmartVOCFormData>, 'forms'>('forms', 'updateForm', data, { id });
    } catch (error) {
      console.error(`Error al actualizar formulario SmartVOC ${id}:`, error);
      throw error;
    }
  },

  /**
   * Elimina un formulario SmartVOC
   * @param id ID del formulario
   */
  async delete(id: string): Promise<void> {
    try {
      await apiClient.delete<void, 'forms'>('forms', 'deleteForm', { id });
    } catch (error) {
      console.error(`Error al eliminar formulario SmartVOC ${id}:`, error);
      throw error;
    }
  },

  /**
   * Agrega una pregunta a un formulario existente
   * @param formId ID del formulario
   * @param question Datos de la pregunta
   * @returns Formulario actualizado
   */
  async addQuestion(formId: string, question: Omit<SmartVOCQuestion, 'id'>): Promise<SmartVOCFormRecord> {
    try {
      // Primero obtenemos el formulario actual
      const form = await this.getById(formId);
      
      // Generamos un ID único para la pregunta
      const newQuestion: SmartVOCQuestion = {
        ...question,
        id: Math.random().toString(36).substring(2, 15)
      };
      
      // Actualizamos el formulario con la nueva pregunta
      return await this.update(formId, {
        questions: [...form.questions, newQuestion]
      });
    } catch (error) {
      console.error(`Error al agregar pregunta al formulario ${formId}:`, error);
      throw error;
    }
  },

  /**
   * Elimina una pregunta de un formulario existente
   * @param formId ID del formulario
   * @param questionId ID de la pregunta
   * @returns Formulario actualizado
   */
  async deleteQuestion(formId: string, questionId: string): Promise<SmartVOCFormRecord> {
    try {
      // Primero obtenemos el formulario actual
      const form = await this.getById(formId);
      
      // Filtramos las preguntas para eliminar la especificada
      const updatedQuestions = form.questions.filter(q => q.id !== questionId);
      
      // Actualizamos el formulario con las preguntas restantes
      return await this.update(formId, {
        questions: updatedQuestions
      });
    } catch (error) {
      console.error(`Error al eliminar pregunta ${questionId} del formulario ${formId}:`, error);
      throw error;
    }
  }
};

export default smartVOCFormService; 