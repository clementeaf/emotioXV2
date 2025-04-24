import { smartVocFormModel, SmartVOCFormRecord } from '../models/smartVocForm.model';
import { SmartVOCFormData } from '../../../shared/interfaces/smart-voc.interface';

/**
 * Clase que proporciona servicios para gestionar formularios SmartVOC
 */
export class SmartVOCFormService {
  constructor() {}

  async getByResearchId(researchId: string): Promise<SmartVOCFormRecord | null> {
    return await smartVocFormModel.getByResearchId(researchId);
  }

  async getById(id: string): Promise<SmartVOCFormRecord | null> {
    return await smartVocFormModel.getById(id);
  }

  async create(formData: SmartVOCFormData): Promise<SmartVOCFormRecord> {
    if (!formData.researchId) {
       throw new Error("researchId es requerido para crear el formulario SmartVOC.");
    }
    return await smartVocFormModel.create(formData, formData.researchId);
  }

  async update(id: string, formData: Partial<SmartVOCFormData>): Promise<SmartVOCFormRecord> {
    return await smartVocFormModel.update(id, formData);
  }

  async createOrUpdate(researchId: string, formData: SmartVOCFormData): Promise<SmartVOCFormRecord> {
    const existingForm = await this.getByResearchId(researchId);
    if (existingForm) {
      return await smartVocFormModel.update(existingForm.id, formData);
    } else {
      return await smartVocFormModel.create(formData, researchId);
    }
  }

  async delete(researchId: string): Promise<void> {
    const existingForm = await this.getByResearchId(researchId);
    if (!existingForm) {
      throw new Error('SmartVOC form not found to delete.');
    }
    await smartVocFormModel.delete(existingForm.id);
  }

  async getAll(): Promise<SmartVOCFormRecord[]> {
    return await smartVocFormModel.getAll();
  }
}

export default new SmartVOCFormService(); 