import { CognitiveTaskModel, CognitiveTaskRecord } from '../models/cognitiveTask.model';
import { CognitiveTaskFormData } from '../../../shared/interfaces/cognitive-task.interface';

/**
 * Clase que proporciona servicios para gestionar formularios CognitiveTask
 */
export class CognitiveTaskService {
  private model = new CognitiveTaskModel();

  /**
   * Crea un nuevo formulario CognitiveTask para una investigación
   * @param researchId ID de la investigación
   * @param formData Datos del formulario
   * @returns El formulario creado
   */
  async createCognitiveTaskForm(researchId: string, formData: CognitiveTaskFormData): Promise<CognitiveTaskRecord> {
    try {
      // Verificamos si ya existe un formulario para esta investigación
      const existingForm = await this.model.getByResearchId(researchId);
      
      if (existingForm) {
        throw new Error(`Ya existe un formulario CognitiveTask para la investigación con ID: ${researchId}`);
      }
      
      return await this.model.create(formData, researchId);
    } catch (error: any) {
      console.error('Error al crear formulario CognitiveTask:', error);
      throw new Error(`Error al crear formulario CognitiveTask: ${error.message}`);
    }
  }

  /**
   * Obtiene un formulario CognitiveTask por su ID
   * @param formId ID del formulario
   * @returns El formulario si existe, null si no
   */
  async getCognitiveTaskFormById(formId: string): Promise<CognitiveTaskRecord | null> {
    try {
      const form = await this.model.getById(formId);
      
      if (!form) {
        console.log(`No se encontró formulario CognitiveTask con ID: ${formId}`);
      }
      
      return form;
    } catch (error: any) {
      console.error('Error al obtener formulario CognitiveTask por ID:', error);
      throw new Error(`Error al obtener formulario CognitiveTask: ${error.message}`);
    }
  }

  /**
   * Obtiene el formulario CognitiveTask asociado a una investigación
   * @param researchId ID de la investigación
   * @returns El formulario si existe, null si no
   */
  async getCognitiveTaskFormByResearchId(researchId: string): Promise<CognitiveTaskRecord | null> {
    try {
      const form = await this.model.getByResearchId(researchId);
      
      if (!form) {
        console.log(`No se encontró formulario CognitiveTask para la investigación con ID: ${researchId}`);
      }
      
      return form;
    } catch (error: any) {
      console.error('Error al obtener formulario CognitiveTask por ID de investigación:', error);
      throw new Error(`Error al obtener formulario CognitiveTask: ${error.message}`);
    }
  }

  /**
   * Actualiza un formulario CognitiveTask
   * @param formId ID del formulario
   * @param updateData Datos actualizados
   * @returns El formulario actualizado
   */
  async updateCognitiveTaskForm(formId: string, updateData: Partial<CognitiveTaskFormData>): Promise<CognitiveTaskRecord> {
    try {
      // Verificamos si el formulario existe
      const existingForm = await this.model.getById(formId);
      
      if (!existingForm) {
        throw new Error(`No se encontró formulario CognitiveTask con ID: ${formId}`);
      }
      
      return await this.model.update(formId, updateData);
    } catch (error: any) {
      console.error('Error al actualizar formulario CognitiveTask:', error);
      throw new Error(`Error al actualizar formulario CognitiveTask: ${error.message}`);
    }
  }

  /**
   * Elimina un formulario CognitiveTask
   * @param formId ID del formulario a eliminar
   * @returns true si se eliminó correctamente
   */
  async deleteCognitiveTaskForm(formId: string): Promise<boolean> {
    try {
      // Verificamos si el formulario existe
      const existingForm = await this.model.getById(formId);
      
      if (!existingForm) {
        throw new Error(`No se encontró formulario CognitiveTask con ID: ${formId}`);
      }
      
      await this.model.delete(formId);
      return true;
    } catch (error: any) {
      console.error('Error al eliminar formulario CognitiveTask:', error);
      throw new Error(`Error al eliminar formulario CognitiveTask: ${error.message}`);
    }
  }

  /**
   * Crea o actualiza un formulario CognitiveTask para una investigación
   * Si ya existe un formulario para esa investigación, lo actualiza
   * Si no existe, crea uno nuevo
   * @param researchId ID de la investigación
   * @param formData Datos del formulario
   * @returns El formulario creado o actualizado
   */
  async createOrUpdateCognitiveTaskForm(researchId: string, formData: CognitiveTaskFormData): Promise<CognitiveTaskRecord> {
    try {
      // Verificamos si ya existe un formulario para esta investigación
      const existingForm = await this.model.getByResearchId(researchId);
      
      if (existingForm) {
        // Si existe, lo actualizamos
        return await this.model.update(existingForm.id, formData);
      } else {
        // Si no existe, lo creamos
        return await this.model.create(formData, researchId);
      }
    } catch (error: any) {
      console.error('Error al crear o actualizar formulario CognitiveTask:', error);
      throw new Error(`Error al crear o actualizar formulario CognitiveTask: ${error.message}`);
    }
  }

  /**
   * Clona un formulario CognitiveTask existente para una nueva investigación
   * @param sourceFormId ID del formulario a clonar
   * @param targetResearchId ID de la investigación destino
   * @returns El nuevo formulario clonado
   */
  async cloneCognitiveTaskForm(sourceFormId: string, targetResearchId: string): Promise<CognitiveTaskRecord> {
    try {
      // Verificamos si el formulario origen existe
      const sourceForm = await this.model.getById(sourceFormId);
      
      if (!sourceForm) {
        throw new Error(`No se encontró formulario CognitiveTask con ID: ${sourceFormId}`);
      }
      
      // Verificamos si ya existe un formulario para la investigación destino
      const existingTargetForm = await this.model.getByResearchId(targetResearchId);
      
      if (existingTargetForm) {
        throw new Error(`Ya existe un formulario CognitiveTask para la investigación con ID: ${targetResearchId}`);
      }
      
      // Creamos un nuevo formulario con los datos del origen
      const formDataToClone: CognitiveTaskFormData = {
        researchId: targetResearchId,
        questions: sourceForm.questions.map(q => ({
          ...q,
          id: q.id // Mantenemos los mismos IDs de preguntas
        })),
        randomizeQuestions: sourceForm.randomizeQuestions,
        metadata: {
          createdAt: sourceForm.metadata?.createdAt,
          updatedAt: new Date().toISOString(),
          lastModifiedBy: 'system'
        }
      };
      
      return await this.model.create(formDataToClone, targetResearchId);
    } catch (error: any) {
      console.error('Error al clonar formulario CognitiveTask:', error);
      throw new Error(`Error al clonar formulario CognitiveTask: ${error.message}`);
    }
  }

  /**
   * Obtiene todos los formularios CognitiveTask
   * @returns Lista de todos los formularios
   */
  async getAllForms(): Promise<CognitiveTaskRecord[]> {
    try {
      return await this.model.getAll();
    } catch (error: any) {
      console.error('Error al obtener todos los formularios CognitiveTask:', error);
      throw new Error(`Error al obtener formularios CognitiveTask: ${error.message}`);
    }
  }

  /**
   * Actualizaciones batch de formularios CognitiveTask
   * Útil para actualizaciones masivas en campañas
   * @param formIds IDs de los formularios a actualizar
   * @param updateData Datos a actualizar en todos los formularios
   * @returns Número de formularios actualizados correctamente
   */
  async batchUpdate(formIds: string[], updateData: Partial<CognitiveTaskFormData>): Promise<number> {
    try {
      let successCount = 0;
      
      // Actualizar cada formulario individualmente
      for (const formId of formIds) {
        try {
          await this.updateCognitiveTaskForm(formId, updateData);
          successCount++;
        } catch (error) {
          console.error(`Error al actualizar formulario ${formId}:`, error);
          // Continuamos con el siguiente a pesar del error
        }
      }
      
      return successCount;
    } catch (error: any) {
      console.error('Error en actualización batch de formularios CognitiveTask:', error);
      throw new Error(`Error en actualización batch: ${error.message}`);
    }
  }

  /**
   * Valida los datos de un formulario CognitiveTask
   * @param formData Datos del formulario a validar
   * @returns true si los datos son válidos, error si no
   */
  validateFormData(formData: CognitiveTaskFormData): boolean {
    // Verificar que tengamos preguntas
    if (!formData.questions || formData.questions.length === 0) {
      throw new Error('El formulario debe tener al menos una pregunta');
    }

    // Verificar las preguntas
    formData.questions.forEach((question, index) => {
      if (!question.title) {
        throw new Error(`La pregunta #${index + 1} debe tener un título`);
      }

      // Verificar opciones para preguntas de tipo choice
      if (['single_choice', 'multiple_choice', 'ranking'].includes(question.type)) {
        if (!question.choices || question.choices.length < 2) {
          throw new Error(`La pregunta "${question.title}" debe tener al menos 2 opciones`);
        }
      }

      // Verificar escala para preguntas de tipo linear_scale
      if (question.type === 'linear_scale') {
        if (!question.scaleConfig) {
          throw new Error(`La pregunta "${question.title}" debe tener configuración de escala`);
        }
        if (question.scaleConfig.startValue >= question.scaleConfig.endValue) {
          throw new Error(`La escala de la pregunta "${question.title}" debe tener un valor inicial menor que el valor final`);
        }
      }

      // Verificar archivos para preguntas de tipo navigation_flow o preference_test
      if (['navigation_flow', 'preference_test'].includes(question.type)) {
        if (question.required && (!question.files || question.files.length === 0)) {
          throw new Error(`La pregunta obligatoria "${question.title}" debe tener al menos un archivo asociado`);
        }
      }
    });

    return true;
  }
} 