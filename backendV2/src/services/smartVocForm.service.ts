import SmartVOCFormModel, { SmartVOCFormRecord } from '../models/smartVocForm.model';
import { SmartVOCFormData } from '../../../shared/interfaces/smart-voc.interface';

/**
 * Interfaz extendida para metadatos con propiedades de clonación
 */
interface ExtendedMetadata {
  estimatedCompletionTime?: string;
  createdAt?: string;
  updatedAt?: string;
  clonedFrom?: string;
  clonedAt?: string;
}

/**
 * Clase que proporciona servicios para gestionar formularios SmartVOC
 */
export class SmartVOCFormService {
  private model = SmartVOCFormModel;

  /**
   * Crea un nuevo formulario SmartVOC para una investigación
   * @param researchId ID de la investigación
   * @param formData Datos del formulario
   * @returns El formulario creado
   */
  async createSmartVOCForm(researchId: string, formData: SmartVOCFormData): Promise<SmartVOCFormRecord> {
    try {
      // Verificamos si ya existe un formulario para esta investigación
      const existingForm = await this.model.getByResearchId(researchId);
      
      if (existingForm) {
        throw new Error(`Ya existe un formulario SmartVOC para la investigación con ID: ${researchId}`);
      }
      
      return await this.model.create(formData, researchId);
    } catch (error: any) {
      console.error('Error al crear formulario SmartVOC:', error);
      throw new Error(`Error al crear formulario SmartVOC: ${error.message}`);
    }
  }

  /**
   * Obtiene un formulario SmartVOC por su ID
   * @param formId ID del formulario
   * @returns El formulario si existe, null si no
   */
  async getSmartVOCFormById(formId: string): Promise<SmartVOCFormRecord | null> {
    try {
      const form = await this.model.getById(formId);
      
      if (!form) {
        console.log(`No se encontró formulario SmartVOC con ID: ${formId}`);
      }
      
      return form;
    } catch (error: any) {
      console.error('Error al obtener formulario SmartVOC por ID:', error);
      throw new Error(`Error al obtener formulario SmartVOC: ${error.message}`);
    }
  }

  /**
   * Obtiene el formulario SmartVOC asociado a una investigación
   * @param researchId ID de la investigación
   * @returns El formulario si existe, null si no
   */
  async getSmartVOCFormByResearchId(researchId: string): Promise<SmartVOCFormRecord | null> {
    try {
      const form = await this.model.getByResearchId(researchId);
      
      if (!form) {
        console.log(`No se encontró formulario SmartVOC para la investigación con ID: ${researchId}`);
      }
      
      return form;
    } catch (error: any) {
      console.error('Error al obtener formulario SmartVOC por ID de investigación:', error);
      throw new Error(`Error al obtener formulario SmartVOC: ${error.message}`);
    }
  }

  /**
   * Actualiza un formulario SmartVOC
   * @param formId ID del formulario
   * @param updateData Datos actualizados
   * @returns El formulario actualizado
   */
  async updateSmartVOCForm(formId: string, updateData: Partial<SmartVOCFormData>): Promise<SmartVOCFormRecord> {
    try {
      // Verificamos si el formulario existe
      const existingForm = await this.model.getById(formId);
      
      if (!existingForm) {
        throw new Error(`No se encontró formulario SmartVOC con ID: ${formId}`);
      }
      
      return await this.model.update(formId, updateData);
    } catch (error: any) {
      console.error('Error al actualizar formulario SmartVOC:', error);
      throw new Error(`Error al actualizar formulario SmartVOC: ${error.message}`);
    }
  }

  /**
   * Elimina un formulario SmartVOC
   * @param formId ID del formulario a eliminar
   * @returns true si se eliminó correctamente
   */
  async deleteSmartVOCForm(formId: string): Promise<boolean> {
    try {
      // Verificamos si el formulario existe
      const existingForm = await this.model.getById(formId);
      
      if (!existingForm) {
        throw new Error(`No se encontró formulario SmartVOC con ID: ${formId}`);
      }
      
      await this.model.delete(formId);
      return true;
    } catch (error: any) {
      console.error('Error al eliminar formulario SmartVOC:', error);
      throw new Error(`Error al eliminar formulario SmartVOC: ${error.message}`);
    }
  }

  /**
   * Crea o actualiza un formulario SmartVOC para una investigación
   * Si ya existe un formulario para esa investigación, lo actualiza
   * Si no existe, crea uno nuevo
   * @param researchId ID de la investigación
   * @param formData Datos del formulario
   * @returns El formulario creado o actualizado
   */
  async createOrUpdateSmartVOCForm(researchId: string, formData: SmartVOCFormData): Promise<SmartVOCFormRecord> {
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
      console.error('Error al crear o actualizar formulario SmartVOC:', error);
      throw new Error(`Error al crear o actualizar formulario SmartVOC: ${error.message}`);
    }
  }

  /**
   * Clona un formulario SmartVOC existente para una nueva investigación
   * @param sourceFormId ID del formulario a clonar
   * @param targetResearchId ID de la investigación destino
   * @returns El nuevo formulario clonado
   */
  async cloneSmartVOCForm(sourceFormId: string, targetResearchId: string): Promise<SmartVOCFormRecord> {
    try {
      // Verificamos si el formulario origen existe
      const sourceForm = await this.model.getById(sourceFormId);
      
      if (!sourceForm) {
        throw new Error(`No se encontró formulario SmartVOC con ID: ${sourceFormId}`);
      }
      
      // Verificamos si ya existe un formulario para la investigación destino
      const existingTargetForm = await this.model.getByResearchId(targetResearchId);
      
      if (existingTargetForm) {
        throw new Error(`Ya existe un formulario SmartVOC para la investigación con ID: ${targetResearchId}`);
      }
      
      // Creamos un nuevo formulario con los datos del origen
      const formDataToClone: SmartVOCFormData = {
        questions: sourceForm.questions.map(q => ({
          ...q,
          id: q.id // Mantenemos los mismos IDs de preguntas
        })),
        randomizeQuestions: sourceForm.randomizeQuestions,
        smartVocRequired: sourceForm.smartVocRequired,
        metadata: sourceForm.metadata ? 
          { 
            ...sourceForm.metadata,
            clonedFrom: sourceFormId,
            clonedAt: new Date().toISOString()
          } as ExtendedMetadata : 
          {
            estimatedCompletionTime: '3-5 minutes',
            clonedFrom: sourceFormId,
            clonedAt: new Date().toISOString()
          } as ExtendedMetadata
      };
      
      return await this.model.create(formDataToClone, targetResearchId);
    } catch (error: any) {
      console.error('Error al clonar formulario SmartVOC:', error);
      throw new Error(`Error al clonar formulario SmartVOC: ${error.message}`);
    }
  }

  /**
   * Obtiene todos los formularios SmartVOC
   * @returns Lista de todos los formularios SmartVOC
   */
  async getAllForms(): Promise<SmartVOCFormRecord[]> {
    try {
      const forms = await this.model.getAll();
      return forms;
    } catch (error: any) {
      console.error('Error al obtener todos los formularios SmartVOC:', error);
      throw new Error(`Error al obtener todos los formularios SmartVOC: ${error.message}`);
    }
  }
}

// Exportamos una instancia por defecto del servicio
export default new SmartVOCFormService(); 