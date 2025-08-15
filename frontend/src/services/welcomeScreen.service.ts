import { welcomeScreenAPI } from '@/lib/api';
import { WelcomeScreenRecord } from '../../../shared/interfaces/welcome-screen.interface';

const WelcomeScreenService = {
  async getByResearchId(researchId: string): Promise<WelcomeScreenRecord | null> {
    try {
      const response = await welcomeScreenAPI.getByResearch(researchId);
      return response as WelcomeScreenRecord | null;
    } catch (error) {
      console.error('[WelcomeScreenService] Error en getByResearchId:', error);
      throw error;
    }
  },

  async save(
    screenData: Partial<WelcomeScreenRecord>
  ): Promise<WelcomeScreenRecord> {
    const { researchId, ...data } = screenData;
    if (!researchId) {
      throw new Error('Research ID es requerido para guardar el Welcome Screen');
    }
    const response = await welcomeScreenAPI.save(researchId, data);
    return response as WelcomeScreenRecord;
  },

  async delete(id: string, researchId: string): Promise<void> {
    if (!researchId) {
      throw new Error('Research ID es requerido para eliminar el Welcome Screen');
    }
    await welcomeScreenAPI.delete(researchId);
  },

  async createForResearch(
    researchId: string,
    data: Omit<WelcomeScreenRecord, 'id' | 'researchId' | 'createdAt' | 'updatedAt'>
  ): Promise<WelcomeScreenRecord> {
    if (!researchId) {
      throw new Error('Research ID es requerido para crear el Welcome Screen');
    }
    const response = await welcomeScreenAPI.save(researchId, data);
    return response as WelcomeScreenRecord;
  }
};

export const welcomeScreenService = WelcomeScreenService;
