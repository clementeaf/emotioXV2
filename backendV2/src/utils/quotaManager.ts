/**
 * 🎯 SISTEMA DE GESTIÓN DE CUOTA SIMPLIFICADO
 *
 * Marca participantes como calificados o descalificados por overquota
 * basado en el orden de finalización de la investigación.
 */

import { eyeTrackingService } from '../services/eyeTracking.service';
import { moduleResponseService } from '../services/moduleResponse.service';

// Estados de participación
export enum ParticipantStatus {
  QUALIFIED = 'QUALIFIED',
  DISQUALIFIED_OVERQUOTA = 'DISQUALIFIED_OVERQUOTA'
}

// Interfaz para registro de calificación
export interface QuotaRecord {
  researchId: string;
  participantId: string;
  status: ParticipantStatus;
  completionOrder: number; // Orden de finalización (1, 2, 3...)
  completionTime: string;  // Timestamp de finalización
  quotaLimit: number;      // Límite configurado
  createdAt: string;
  updatedAt: string;
}

export class QuotaManager {
  constructor() {}

  /**
   * Verifica cuota y marca participante como calificado o descalificado
   * Se ejecuta cuando un participante visita thank_you_screen
   */
  async checkQuotaAndMarkParticipant(
    researchId: string,
    participantId: string
  ): Promise<{ status: ParticipantStatus; order: number; quotaLimit: number }> {
    try {
      console.log(`[QuotaManager] Verificando cuota para participante ${participantId} en investigación ${researchId}`);

      // 1. Obtener configuración de la investigación
      const eyeTrackingConfig = await eyeTrackingService.getByResearchId(researchId);
      if (!eyeTrackingConfig) {
        console.log(`[QuotaManager] ⚠️ No se encontró configuración para investigación: ${researchId}`);
        return { status: ParticipantStatus.QUALIFIED, order: 1, quotaLimit: 999 };
      }

      const quotaLimit = eyeTrackingConfig.participantLimit?.value || 30;
      console.log(`[QuotaManager] Límite de participantes: ${quotaLimit}`);

      // 2. Obtener todos los participantes que ya terminaron (ordenados por tiempo de finalización)
      const completedParticipants = await this.getCompletedParticipantsOrdered(researchId);
      console.log(`[QuotaManager] Participantes completados: ${completedParticipants.length}`);

      // 3. Verificar si el participante actual ya está en la lista
      const existingParticipant = completedParticipants.find(p => p.participantId === participantId);
      if (existingParticipant) {
        console.log(`[QuotaManager] ⚠️ Participante ${participantId} ya procesado anteriormente`);
        return {
          status: existingParticipant.status,
          order: 1, // Valor por defecto ya que no tenemos completionOrder en el objeto
          quotaLimit
        };
      }

      // 4. Agregar participante actual a la lista
      const currentParticipant = {
        participantId,
        completionTime: new Date().toISOString(),
        status: ParticipantStatus.QUALIFIED // Por defecto calificado
      };

      const allParticipants = [...completedParticipants, currentParticipant];

      // 5. Ordenar por tiempo de finalización (más antiguo primero)
      allParticipants.sort((a, b) =>
        new Date(a.completionTime).getTime() - new Date(b.completionTime).getTime()
      );

      // 6. Encontrar la posición del participante actual
      const currentOrder = allParticipants.findIndex(p => p.participantId === participantId) + 1;
      console.log(`[QuotaManager] Participante ${participantId} en posición: ${currentOrder}/${quotaLimit}`);

      // 7. Determinar si está calificado o descalificado
      let finalStatus = ParticipantStatus.QUALIFIED;
      if (currentOrder > quotaLimit) {
        finalStatus = ParticipantStatus.DISQUALIFIED_OVERQUOTA;
        console.log(`[QuotaManager] 🎯 Participante ${participantId} DESCALIFICADO por overquota (posición ${currentOrder} > ${quotaLimit})`);
      } else {
        console.log(`[QuotaManager] ✅ Participante ${participantId} CALIFICADO (posición ${currentOrder} <= ${quotaLimit})`);
      }

      // 8. Guardar registro de cuota
      await this.saveQuotaRecord(researchId, participantId, finalStatus, currentOrder, quotaLimit);

      // 9. Actualizar estados de participantes anteriores si es necesario
      await this.updatePreviousParticipantsStatus(researchId, allParticipants, quotaLimit);

      return {
        status: finalStatus,
        order: currentOrder,
        quotaLimit
      };

    } catch (error) {
      console.error(`[QuotaManager] ❌ Error verificando cuota para participante ${participantId}:`, error);
      // En caso de error, marcar como calificado por defecto
      return { status: ParticipantStatus.QUALIFIED, order: 1, quotaLimit: 999 };
    }
  }

  /**
   * Obtiene participantes completados ordenados por tiempo de finalización
   */
  private async getCompletedParticipantsOrdered(researchId: string): Promise<Array<{
    participantId: string;
    completionTime: string;
    status: ParticipantStatus;
  }>> {
    try {
      // Obtener todos los documentos de respuestas para esta investigación
      const allResponses = await moduleResponseService.getResponsesByResearch(researchId);

      const completedParticipants: Array<{
        participantId: string;
        completionTime: string;
        status: ParticipantStatus;
      }> = [];

      for (const responseDoc of allResponses) {
        // Buscar respuesta de thank_you_screen
        const thankYouResponse = responseDoc.responses?.find(r => r.questionKey === 'thank_you_screen');

        if (thankYouResponse) {
          // Verificar si ya tiene registro de cuota
          const quotaRecord = await this.getQuotaRecord();

          completedParticipants.push({
            participantId: responseDoc.participantId,
            completionTime: thankYouResponse.timestamp,
            status: quotaRecord?.status || ParticipantStatus.QUALIFIED
          });
        }
      }

      // Ordenar por tiempo de finalización (más antiguo primero)
      return completedParticipants.sort((a, b) =>
        new Date(a.completionTime).getTime() - new Date(b.completionTime).getTime()
      );

    } catch (error) {
      console.error(`[QuotaManager] Error obteniendo participantes completados para investigación ${researchId}:`, error);
      return [];
    }
  }

  /**
   * Guarda registro de cuota en DynamoDB
   */
  private async saveQuotaRecord(
    researchId: string,
    participantId: string,
    status: ParticipantStatus,
    order: number,
    quotaLimit: number
  ): Promise<void> {
    try {
      const now = new Date().toISOString();
      const quotaRecord: QuotaRecord = {
        researchId,
        participantId,
        status,
        completionOrder: order,
        completionTime: now,
        quotaLimit,
        createdAt: now,
        updatedAt: now
      };

      // Aquí guardarías en DynamoDB
      // Por ahora solo log
      console.log(`[QuotaManager] Guardando registro de cuota:`, quotaRecord);

    } catch (error) {
      console.error(`[QuotaManager] Error guardando registro de cuota:`, error);
    }
  }

  /**
   * Obtiene registro de cuota existente
   */
  private async getQuotaRecord(): Promise<QuotaRecord | null> {
    try {
      // Aquí consultarías DynamoDB
      // Por ahora retornar null
      return null;
    } catch (error) {
      console.error(`[QuotaManager] Error obteniendo registro de cuota:`, error);
      return null;
    }
  }

  /**
   * Actualiza estados de participantes anteriores si es necesario
   */
  private async updatePreviousParticipantsStatus(
    researchId: string,
    allParticipants: Array<{ participantId: string; completionTime: string; status: ParticipantStatus }>,
    quotaLimit: number
  ): Promise<void> {
    try {
      for (let i = 0; i < allParticipants.length; i++) {
        const participant = allParticipants[i];
        const order = i + 1;

        let newStatus = ParticipantStatus.QUALIFIED;
        if (order > quotaLimit) {
          newStatus = ParticipantStatus.DISQUALIFIED_OVERQUOTA;
        }

        // Solo actualizar si el estado cambió
        if (participant.status !== newStatus) {
          await this.saveQuotaRecord(researchId, participant.participantId, newStatus, order, quotaLimit);
          console.log(`[QuotaManager] Actualizado participante ${participant.participantId} a estado: ${newStatus}`);
        }
      }
    } catch (error) {
      console.error(`[QuotaManager] Error actualizando estados de participantes:`, error);
    }
  }

  /**
   * Obtiene estadísticas de cuota para una investigación
   */
  async getQuotaStats(researchId: string): Promise<{
    totalCompleted: number;
    qualified: number;
    disqualified: number;
    quotaLimit: number;
  }> {
    try {
      const completedParticipants = await this.getCompletedParticipantsOrdered(researchId);
      const eyeTrackingConfig = await eyeTrackingService.getByResearchId(researchId);
      const quotaLimit = eyeTrackingConfig?.participantLimit?.value || 30;

      const qualified = completedParticipants.filter(p => p.status === ParticipantStatus.QUALIFIED).length;
      const disqualified = completedParticipants.filter(p => p.status === ParticipantStatus.DISQUALIFIED_OVERQUOTA).length;

      return {
        totalCompleted: completedParticipants.length,
        qualified,
        disqualified,
        quotaLimit
      };
    } catch (error) {
      console.error(`[QuotaManager] Error obteniendo estadísticas de cuota:`, error);
      return {
        totalCompleted: 0,
        qualified: 0,
        disqualified: 0,
        quotaLimit: 30
      };
    }
  }
}

// Instancia singleton
export const quotaManager = new QuotaManager();

// Funciones de conveniencia para uso externo
export async function checkQuotaAndMarkParticipant(
  researchId: string,
  participantId: string
): Promise<{ status: ParticipantStatus; order: number; quotaLimit: number }> {
  return quotaManager.checkQuotaAndMarkParticipant(researchId, participantId);
}

export async function getQuotaStats(researchId: string): Promise<{
  totalCompleted: number;
  qualified: number;
  disqualified: number;
  quotaLimit: number;
}> {
  return quotaManager.getQuotaStats(researchId);
}
