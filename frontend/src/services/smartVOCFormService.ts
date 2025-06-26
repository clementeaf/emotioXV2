import { smartVocFixedAPI } from '@/lib/smart-voc-api';
import type {
  SmartVOCFormData,
  SmartVOCQuestion
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
  async getByResearchId(researchId: string): Promise<SmartVOCFormData | null> {
    return smartVocFixedAPI.getByResearchId(researchId);
  },

  /**
   * Crea un nuevo formulario SmartVOC
   * Ruta Backend: POST /research/{researchId}/smart-voc
   * @param researchId ID de la investigación
   * @param data Datos del formulario (debe incluir researchId)
   * @returns Formulario creado
   */
  async create(researchId: string, data: SmartVOCFormData): Promise<SmartVOCFormData> {
    return smartVocFixedAPI.create({ ...data, researchId });
  },

  /**
   * Actualiza un formulario SmartVOC existente
   * Ruta Backend: PUT /research/{researchId}/smart-voc/{formId}
   * @param researchId ID de la investigación
   * @param data Datos a actualizar
   * @returns Formulario actualizado
   */
  async update(researchId: string, data: Partial<SmartVOCFormData>): Promise<SmartVOCFormData> {
    return smartVocFixedAPI.update(researchId, data);
  },

  /**
   * Elimina un formulario SmartVOC
   * Ruta Backend: DELETE /research/{researchId}/smart-voc/{formId}
   * @param researchId ID de la investigación
   * @returns true si se eliminó correctamente, false en caso contrario
   */
  async deleteByResearchId(researchId: string): Promise<boolean> {
    return smartVocFixedAPI.deleteByResearchId(researchId);
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
      return await this.update(researchId, {
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
      return await this.update(researchId, {
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
