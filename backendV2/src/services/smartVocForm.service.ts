import SmartVOCFormModel, { SmartVOCFormRecord } from '../models/smartVocForm.model';
import { SmartVOCFormData } from '../../../shared/interfaces/smart-voc.interface';

/**
 * Clase que proporciona servicios para gestionar formularios SmartVOC
 */
export class SmartVOCFormService {
  private model = SmartVOCFormModel;

  constructor() {}

  async getByResearchId(researchId: string): Promise<SmartVOCFormRecord | null> {
    return await this.model.getByResearchId(researchId);
  }

  async getById(id: string): Promise<SmartVOCFormRecord | null> {
    return await this.model.getById(id);
  }

  async create(formData: SmartVOCFormData): Promise<SmartVOCFormRecord> {
    return await this.model.create(formData, formData.researchId);
  }

  async update(formData: SmartVOCFormData): Promise<SmartVOCFormRecord> {
    const existingForm = await this.getByResearchId(formData.researchId);
    if (!existingForm) {
      throw new Error('SmartVOC form not found');
    }
    return await this.model.update(existingForm.id, formData);
  }

  async createOrUpdate(researchId: string, formData: SmartVOCFormData): Promise<SmartVOCFormRecord> {
    const existingForm = await this.getByResearchId(researchId);
    if (existingForm) {
      return await this.model.update(existingForm.id, formData);
    } else {
      return await this.model.create(formData, researchId);
    }
  }

  async delete(researchId: string): Promise<void> {
    const existingForm = await this.getByResearchId(researchId);
    if (!existingForm) {
      throw new Error('SmartVOC form not found');
    }
    await this.model.delete(existingForm.id);
  }

  async getAll(): Promise<SmartVOCFormRecord[]> {
    return await this.model.getAll();
  }
}

export default new SmartVOCFormService(); 