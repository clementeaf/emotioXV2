/**
 * Eye Tracking API migrada a AlovaJS
 * Simplifica el código usando las capacidades de Alova
 */

import { useRequest, useFetcher } from 'alova/client';
import { alovaInstance } from '../config/alova.config';

// Tipos para Eye Tracking
interface EyeTrackingConfig {
  id?: string;
  researchId: string;
  [key: string]: unknown;
}

interface EyeTrackingResponse {
  success: boolean;
  data: EyeTrackingConfig;
  message?: string;
}

/**
 * Hook para obtener configuración de Eye Tracking por research
 */
export const useEyeTrackingByResearch = (researchId: string | null) => {
  return useRequest(
    alovaInstance.Get<EyeTrackingResponse>(`/research/${researchId || 'null'}/eye-tracking`),
    {
      initialData: undefined,
      immediate: !!researchId,
    }
  );
};

/**
 * Hook para observar cambios en Eye Tracking en tiempo real
 */
export const useWatchEyeTracking = (researchId: string | null) => {
  const { data, loading, error } = useRequest(
    alovaInstance.Get<EyeTrackingResponse>(`/research/${researchId || 'null'}/eye-tracking`),
    {
      initialData: undefined,
      immediate: !!researchId,
      // Refresco automático cada 30 segundos para datos en tiempo real
      pollingTime: 30000,
    }
  );

  return {
    eyeTracking: data?.data || null,
    loading,
    error: error as Error | null,
  };
};

/**
 * API estática para Eye Tracking usando AlovaJS
 */
export const eyeTrackingAPI = {
  /**
   * Obtiene configuración por research ID
   */
  getByResearchId: (researchId: string) => {
    if (!researchId) {
      throw new Error('Se requiere un ID de investigación para obtener la configuración de EyeTracking');
    }

    return {
      send: async (): Promise<EyeTrackingResponse | null> => {
        try {
          const method = alovaInstance.Get<EyeTrackingResponse>(`/research/${researchId}/eye-tracking`);
          const response = await method.send();
          return response;
        } catch (error) {
          // Si es 404, devolver null (no hay configuración)
          if ((error as any)?.statusCode === 404 || (error as any)?.status === 404) {
            return null;
          }
          throw error;
        }
      }
    };
  },

  /**
   * Crea nueva configuración
   */
  create: (data: EyeTrackingConfig) => {
    if (!data || !data.researchId) {
      throw new Error('Se requieren datos y un ID de investigación para crear el EyeTracking');
    }

    return {
      send: async (): Promise<EyeTrackingResponse> => {
        const method = alovaInstance.Post<EyeTrackingResponse>(
          `/research/${data.researchId}/eye-tracking`,
          data
        );
        const response = await method.send();
        
        // Invalidar caché relacionado
        alovaInstance.snapshots.match(`/research/${data.researchId}/eye-tracking`).forEach(m => m.abort());
        
        return response;
      }
    };
  },

  /**
   * Actualiza configuración existente
   */
  update: (researchId: string, data: Partial<EyeTrackingConfig>) => {
    if (!researchId) {
      throw new Error('Se requiere un ID de investigación para actualizar el EyeTracking');
    }

    if (!data) {
      throw new Error('Se requieren datos para actualizar el EyeTracking');
    }

    return {
      send: async (): Promise<EyeTrackingResponse> => {
        const method = alovaInstance.Put<EyeTrackingResponse>(
          `/research/${researchId}/eye-tracking`,
          data
        );
        const response = await method.send();
        
        // Invalidar caché relacionado
        alovaInstance.snapshots.match(`/research/${researchId}/eye-tracking`).forEach(m => m.abort());
        
        return response;
      }
    };
  },

  /**
   * Elimina configuración
   */
  delete: (researchId: string) => {
    if (!researchId) {
      throw new Error('Se requiere un ID de investigación para eliminar el EyeTracking');
    }

    return {
      send: async (): Promise<{ success: boolean; message: string }> => {
        const method = alovaInstance.Delete<{ success: boolean; message: string }>(
          `/research/${researchId}/eye-tracking`
        );
        const response = await method.send();
        
        // Limpiar caché relacionado
        alovaInstance.snapshots.match(`/research/${researchId}/eye-tracking`).forEach(m => m.abort());
        
        return response;
      }
    };
  },
};

/**
 * Hook para mutaciones de Eye Tracking (crear, actualizar, eliminar)
 */
export const useEyeTrackingMutations = (researchId: string | null) => {
  const { fetch } = useFetcher();

  const createConfig = async (data: EyeTrackingConfig) => {
    if (!researchId) throw new Error('Research ID requerido');
    
    const response = await fetch(
      alovaInstance.Post<EyeTrackingResponse>(`/research/${researchId}/eye-tracking`, {
        ...data,
        researchId
      })
    );
    
    // Invalidar caché
    alovaInstance.snapshots.match(`/research/${researchId}/eye-tracking`).forEach(m => m.abort());
    
    return response;
  };

  const updateConfig = async (data: Partial<EyeTrackingConfig>) => {
    if (!researchId) throw new Error('Research ID requerido');
    
    const response = await fetch(
      alovaInstance.Put<EyeTrackingResponse>(`/research/${researchId}/eye-tracking`, data)
    );
    
    // Invalidar caché
    alovaInstance.snapshots.match(`/research/${researchId}/eye-tracking`).forEach(m => m.abort());
    
    return response;
  };

  const deleteConfig = async () => {
    if (!researchId) throw new Error('Research ID requerido');
    
    const response = await fetch(
      alovaInstance.Delete<{ success: boolean; message: string }>(
        `/research/${researchId}/eye-tracking`
      )
    );
    
    // Limpiar caché
    alovaInstance.snapshots.match(`/research/${researchId}/eye-tracking`).forEach(m => m.abort());
    
    return response;
  };

  return {
    createConfig,
    updateConfig,
    deleteConfig,
  };
};

/**
 * Eye Tracking Recruit API - Funcionalidades de reclutamiento
 */
export const eyeTrackingRecruitAPI = {
  /**
   * Obtiene configuración de reclutamiento
   */
  getConfigByResearch: (researchId: string) => {
    return {
      send: async () => {
        const method = alovaInstance.Get(`/eye-tracking-recruit/research/${researchId}/config`);
        return method.send();
      }
    };
  },

  /**
   * Crea configuración de reclutamiento
   */
  createConfig: (researchId: string, data: any) => {
    return {
      send: async () => {
        const method = alovaInstance.Post(
          `/eye-tracking-recruit/research/${researchId}/config`,
          data
        );
        const response = await method.send();
        
        // Invalidar caché relacionado
        alovaInstance.snapshots.match(`/eye-tracking-recruit/research/${researchId}`).forEach(m => m.abort());
        
        return response;
      }
    };
  },

  /**
   * Actualiza configuración de reclutamiento
   */
  updateConfig: (researchId: string, data: any) => {
    return {
      send: async () => {
        const method = alovaInstance.Put(
          `/eye-tracking-recruit/research/${researchId}/config`,
          data
        );
        const response = await method.send();
        
        // Invalidar caché relacionado
        alovaInstance.snapshots.match(`/eye-tracking-recruit/research/${researchId}`).forEach(m => m.abort());
        
        return response;
      }
    };
  },

  /**
   * Genera link de reclutamiento
   */
  generateLink: (configId: string) => {
    return {
      send: async () => {
        const method = alovaInstance.Post(
          `/eye-tracking-recruit/config/${configId}/link`,
          {}
        );
        return method.send();
      }
    };
  },

  /**
   * Obtiene participantes
   */
  getParticipants: (configId: string) => {
    return {
      send: async () => {
        const method = alovaInstance.Get(
          `/eye-tracking-recruit/config/${configId}/participants`
        );
        return method.send();
      }
    };
  },

  /**
   * Obtiene estadísticas
   */
  getStats: (configId: string) => {
    return {
      send: async () => {
        const method = alovaInstance.Get(
          `/eye-tracking-recruit/config/${configId}/stats`
        );
        return method.send();
      }
    };
  },

  /**
   * Obtiene links activos
   */
  getActiveLinks: (configId: string) => {
    return {
      send: async () => {
        const method = alovaInstance.Get(
          `/eye-tracking-recruit/config/${configId}/links`
        );
        return method.send();
      }
    };
  },

  /**
   * Desactiva un link
   */
  deactivateLink: (token: string) => {
    return {
      send: async () => {
        const method = alovaInstance.Put(
          `/eye-tracking-recruit/link/${token}/deactivate`,
          {}
        );
        return method.send();
      }
    };
  },
};

/**
 * Hook para reclutamiento de Eye Tracking
 */
export const useEyeTrackingRecruit = (researchId: string | null) => {
  // Configuración de reclutamiento
  const configQuery = useRequest(
    alovaInstance.Get(`/eye-tracking-recruit/research/${researchId || 'null'}/config`),
    {
      initialData: undefined,
      immediate: !!researchId,
    }
  );

  const { fetch } = useFetcher();

  // Mutaciones para reclutamiento
  const mutations = {
    createConfig: async (data: any) => {
      if (!researchId) throw new Error('Research ID requerido');
      
      const response = await fetch(
        alovaInstance.Post(`/eye-tracking-recruit/research/${researchId}/config`, data)
      );
      
      // Refrescar configuración
      configQuery.send();
      
      return response;
    },

    updateConfig: async (data: any) => {
      if (!researchId) throw new Error('Research ID requerido');
      
      const response = await fetch(
        alovaInstance.Put(`/eye-tracking-recruit/research/${researchId}/config`, data)
      );
      
      // Refrescar configuración
      configQuery.send();
      
      return response;
    },

    generateLink: async (configId: string) => {
      const response = await fetch(
        alovaInstance.Post(`/eye-tracking-recruit/config/${configId}/link`, {})
      );
      
      return response;
    },

    deactivateLink: async (token: string) => {
      const response = await fetch(
        alovaInstance.Put(`/eye-tracking-recruit/link/${token}/deactivate`, {})
      );
      
      return response;
    },
  };

  return {
    config: configQuery.data,
    loading: configQuery.loading,
    error: configQuery.error,
    refetchConfig: configQuery.send,
    ...mutations,
  };
};

// Mantener compatibilidad con el API anterior
export const eyeTrackingFixedAPI = eyeTrackingAPI;

export default eyeTrackingAPI;