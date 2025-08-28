import type { CognitiveTaskFormData } from 'shared/interfaces/cognitive-task.interface';
import { apiClient, ApiError } from '../config/api';

export const cognitiveTaskAPI = {
  async getByResearchId(researchId: string): Promise<CognitiveTaskFormData | null> {
    try {
      const data = await apiClient.get('cognitiveTask', 'getByResearch', { researchId }) as CognitiveTaskFormData;

      // Si data es null (404 manejado por handleResponse), devolver null
      if (data === null) {
        return null;
      }

      return data ? cognitiveTaskAPI.processDataFromBackend(data) : null;
    } catch (error) {
      if (error instanceof ApiError && error.statusCode === 404) {
        return null;
      }
      throw error;
    }
  },

  async create(researchId: string, data: CognitiveTaskFormData): Promise<CognitiveTaskFormData> {
    const payload = { ...data, researchId };
    const result = await apiClient.post('cognitiveTask', 'create', payload, { researchId }) as CognitiveTaskFormData;
    return result;
  },

  async update(researchId: string, data: Partial<CognitiveTaskFormData>): Promise<CognitiveTaskFormData> {
    const result = await apiClient.put('cognitiveTask', 'update', data, { researchId }) as CognitiveTaskFormData;
    return result;
  },

  async deleteByResearchId(researchId: string): Promise<void> {
    await apiClient.delete('cognitiveTask', 'delete', { researchId });
  },

  async save(researchId: string, data: CognitiveTaskFormData): Promise<CognitiveTaskFormData> {
    const sanitizedData = cognitiveTaskAPI.sanitizeDataForSave(data);
    const payload = { ...sanitizedData, researchId };

    // Log detallado del payload que se enviará al backend

    // Log específico para hitzones
    if (payload.questions) {
      payload.questions.forEach((question, qIndex) => {
        if (question.files && question.files.length > 0) {
          question.files.forEach((file, fIndex) => {
            if (file.hitZones && file.hitZones.length > 0) {
              //   questionId: question.id,
              //   questionType: question.type,
              //   fileId: file.id,
              //   fileName: file.name,
              //   hitZonesCount: file.hitZones.length,
              // });
            }
          });
        }
      });
    }

    const result = await apiClient.put('cognitiveTask', 'update', payload, { researchId }) as CognitiveTaskFormData;
    return result;
  },

  sanitizeDataForSave(data: CognitiveTaskFormData): CognitiveTaskFormData {
    const sanitized = { ...data };
    if (sanitized.questions && Array.isArray(sanitized.questions)) {
      sanitized.questions = sanitized.questions.map(question => {
        if (question.files && Array.isArray(question.files)) {
          const mappedFiles = cognitiveTaskAPI.mapHitzoneAreasToHitZones(question.files);
          const validFiles = mappedFiles.filter(file =>
            file &&
            file.status !== 'error' &&
            file.status !== 'pending-delete' &&
            file.id &&
            file.name &&
            file.s3Key
          );
          return {
            ...question,
            files: validFiles
          };
        }
        return question;
      });
    }
    return sanitized;
  },

  mapHitzoneAreasToHitZones(files: any[]): any[] {

    return files.map(file => {

      const hitzonesData = file.hitZones || file.hitzones;

      if (!hitzonesData || !Array.isArray(hitzonesData)) {
        return file;
      }

      const hitZones = hitzonesData.map((area: any) => {

        // Verificar si ya está en formato HitZone (tiene region)
        if (area.region && typeof area.region === 'object') {
          return area;
        }

        // Si no tiene region, convertir de HitzoneArea a HitZone
        const converted = {
          id: area.id,
          name: `Hitzone-${area.id}`,
          region: {
            x: area.x,
            y: area.y,
            width: area.width,
            height: area.height
          },
          fileId: file.id
        };
        return converted;
      });

      const result = {
        ...file,
        hitZones,
        hitzones: undefined
      };

      return result;
    });
  },

  mapHitZonesToHitzoneAreas(files: any[]): any[] {
    return files.map(file => {
      if (!file.hitZones || !Array.isArray(file.hitZones)) {
        return file;
      }
      const hitZones = file.hitZones
        .filter((zone: any) => zone && zone.region)
        .map((zone: any) => ({
          id: zone.id,
          x: zone.region.x,
          y: zone.region.y,
          width: zone.region.width,
          height: zone.region.height
        }));
      return {
        ...file,
        hitZones
      };
    });
  },

  processDataFromBackend(data: CognitiveTaskFormData): CognitiveTaskFormData {
    const processed = { ...data };
    if (processed.questions && Array.isArray(processed.questions)) {
      processed.questions = processed.questions.map(question => {
        if (question.files && Array.isArray(question.files)) {
          const mappedFiles = cognitiveTaskAPI.mapHitZonesToHitzoneAreas(question.files);
          return {
            ...question,
            files: mappedFiles
          };
        }
        return question;
      });
    }
    return processed;
  }
};
