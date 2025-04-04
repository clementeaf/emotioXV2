import { 
  RecruitmentLinkModel,
  RecruitmentLink
} from '../models/eyeTrackingRecruit.model';

/**
 * Servicio para gestionar enlaces de reclutamiento de Eye Tracking
 * Versión simplificada para pruebas
 */
export class EyeTrackingRecruitLinkService {
  /**
   * Genera un enlace de reclutamiento
   */
  async generateRecruitmentLink(
    researchId: string,
    configId: string, 
    type: 'standard' | 'preview' | 'admin' = 'standard',
    expirationDays?: number
  ): Promise<RecruitmentLink> {
    // Calculamos la fecha de expiración si se proporciona
    let expiresAt: string | undefined;
    if (expirationDays && expirationDays > 0) {
      const expirationDate = new Date();
      expirationDate.setDate(expirationDate.getDate() + expirationDays);
      expiresAt = expirationDate.toISOString();
    }
    
    // Llamamos directamente al modelo evitando la dependencia de otros métodos
    return await RecruitmentLinkModel.create(
      researchId, 
      configId, 
      type, 
      expiresAt as any // Usamos aserción de tipo como workaround
    );
  }
}

export const eyeTrackingRecruitLinkService = new EyeTrackingRecruitLinkService(); 