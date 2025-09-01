/**
 * SmartVOC API migrada a AlovaJS
 * Simplifica el código usando las capacidades de Alova
 */

import { useRequest, useFetcher, useWatcher } from 'alova/client';
import { alovaInstance } from '../config/alova.config';
import { SmartVOCFormData } from 'shared/interfaces/smart-voc.interface';

// Tipos para SmartVOC
interface SmartVOCResponse {
  success: boolean;
  data: SmartVOCFormData;
  message?: string;
}

/**
 * Hook para obtener SmartVOC por research ID
 */
export const useSmartVOC = (researchId: string | null) => {
  return useRequest(
    alovaInstance.Get<SmartVOCResponse>(`/research/${researchId || 'null'}/smart-voc`),
    {
      initialData: undefined,
      immediate: !!researchId,
    }
  );
};

/**
 * Hook reactivo para SmartVOC (observa cambios en tiempo real)
 */
export const useWatchSmartVOC = (researchId: string | null) => {
  return useWatcher(
    () => alovaInstance.Get<SmartVOCResponse>(`/research/${researchId || 'null'}/smart-voc`),
    [researchId],
    {
      initialData: undefined,
      immediate: !!researchId,
      debounce: 1000, // Debounce de 1 segundo para evitar múltiples llamadas
    }
  );
};

/**
 * Hook para mutaciones de SmartVOC
 */
export const useSmartVOCMutations = (researchId: string | null) => {
  const { fetch } = useFetcher();

  const create = async (data: SmartVOCFormData): Promise<SmartVOCResponse> => {
    if (!researchId) {
      throw new Error('Research ID requerido para crear SmartVOC');
    }

    const response = await fetch(
      alovaInstance.Post<SmartVOCResponse>(`/research/${researchId}/smart-voc`, {
        ...data,
        researchId
      })
    );

    // Invalidar caché relacionado
    alovaInstance.snapshots.match(`/research/${researchId}/smart-voc`).forEach(method => {
      method.abort();
    });

    return response;
  };

  const update = async (data: Partial<SmartVOCFormData>): Promise<SmartVOCResponse> => {
    if (!researchId) {
      throw new Error('Research ID requerido para actualizar SmartVOC');
    }

    const response = await fetch(
      alovaInstance.Put<SmartVOCResponse>(`/research/${researchId}/smart-voc`, data)
    );

    // Invalidar caché relacionado
    alovaInstance.snapshots.match(`/research/${researchId}/smart-voc`).forEach(method => {
      method.abort();
    });

    return response;
  };

  const deleteSmartVOC = async (): Promise<{ success: boolean; message: string }> => {
    if (!researchId) {
      throw new Error('Research ID requerido para eliminar SmartVOC');
    }

    const response = await fetch(
      alovaInstance.Delete<{ success: boolean; message: string }>(`/research/${researchId}/smart-voc`)
    );

    // Limpiar caché relacionado
    alovaInstance.snapshots.match(`/research/${researchId}/smart-voc`).forEach(method => {
      method.abort();
    });

    return response;
  };

  return {
    create,
    update,
    delete: deleteSmartVOC,
  };
};

/**
 * API estática para SmartVOC usando AlovaJS (mantiene compatibilidad)
 */
export const smartVocAPI = {
  /**
   * Crea una nueva configuración SmartVOC
   */
  create: (data: SmartVOCFormData) => {
    if (!data.researchId) {
      throw new Error('Research ID requerido para crear SmartVOC');
    }

    return {
      send: async (): Promise<SmartVOCFormData> => {
        const method = alovaInstance.Post<SmartVOCResponse>(
          `/research/${data.researchId}/smart-voc`,
          data
        );
        const response = await method.send();
        
        // Invalidar caché relacionado
        alovaInstance.snapshots.match(`/research/${data.researchId}/smart-voc`).forEach(m => m.abort());
        
        return response.data;
      }
    };
  },

  /**
   * Actualiza configuración SmartVOC existente
   */
  update: (researchId: string, formId: string, data: Partial<SmartVOCFormData>) => {
    if (!researchId || !formId) {
      throw new Error('ResearchId y formId son necesarios para actualizar SmartVOC');
    }

    return {
      send: async (): Promise<SmartVOCFormData> => {
        const method = alovaInstance.Put<SmartVOCResponse>(
          `/research/${researchId}/smart-voc/${formId}`,
          data
        );
        const response = await method.send();
        
        // Invalidar caché relacionado
        alovaInstance.snapshots.match(`/research/${researchId}/smart-voc`).forEach(m => m.abort());
        
        return response.data;
      }
    };
  },

  /**
   * Obtiene SmartVOC por research ID
   */
  getByResearchId: (researchId: string) => {
    if (!researchId) {
      throw new Error('Research ID requerido');
    }

    return {
      send: async (): Promise<SmartVOCFormData | null> => {
        try {
          const method = alovaInstance.Get<SmartVOCResponse>(`/research/${researchId}/smart-voc`);
          const response = await method.send();
          return response?.data || null;
        } catch (error: any) {
          // Si es 404, devolver null (no existe configuración)
          if (error?.status === 404 || error?.statusCode === 404) {
            return null;
          }
          throw error;
        }
      }
    };
  },

  /**
   * Elimina SmartVOC por research ID
   */
  deleteByResearchId: (researchId: string) => {
    if (!researchId) {
      throw new Error('Research ID requerido para eliminar SmartVOC');
    }

    return {
      send: async (): Promise<boolean> => {
        try {
          const method = alovaInstance.Delete(`/research/${researchId}/smart-voc`);
          await method.send();
          
          // Limpiar caché relacionado
          alovaInstance.snapshots.match(`/research/${researchId}/smart-voc`).forEach(m => m.abort());
          
          return true;
        } catch (error) {
          console.error('Error eliminando SmartVOC:', error);
          return false;
        }
      }
    };
  },

  /**
   * Elimina SmartVOC específico por formId
   */
  deleteSmartVOC: (researchId: string, formId: string) => {
    if (!researchId || !formId) {
      throw new Error('ResearchId y formId son necesarios para eliminar SmartVOC');
    }

    return {
      send: async (): Promise<boolean> => {
        try {
          const method = alovaInstance.Delete(`/research/${researchId}/smart-voc/${formId}`);
          await method.send();
          
          // Limpiar caché relacionado
          alovaInstance.snapshots.match(`/research/${researchId}/smart-voc`).forEach(m => m.abort());
          
          return true;
        } catch (error) {
          console.error('Error eliminando SmartVOC:', error);
          return false;
        }
      }
    };
  },
};

/**
 * Hook completo para gestión de SmartVOC
 * Combina queries y mutations en una sola interfaz
 */
export const useSmartVOCManager = (researchId: string | null) => {
  // Query para obtener datos
  const {
    data,
    loading: queryLoading,
    error: queryError,
    send: refetch
  } = useRequest(
    alovaInstance.Get<SmartVOCResponse>(`/research/${researchId || 'null'}/smart-voc`),
    {
      initialData: undefined,
      immediate: !!researchId,
    }
  );

  // Mutations
  const { create, update, delete: deleteSmartVOC } = useSmartVOCMutations(researchId);

  // Estado de loading combinado
  const loading = queryLoading;

  return {
    // Datos
    smartVOC: data?.data || null,
    loading,
    error: queryError as Error | null,
    
    // Acciones
    refetch,
    create: async (formData: SmartVOCFormData) => {
      const response = await create(formData);
      await refetch(); // Refrescar datos después de crear
      return response;
    },
    update: async (formData: Partial<SmartVOCFormData>) => {
      const response = await update(formData);
      await refetch(); // Refrescar datos después de actualizar
      return response;
    },
    delete: async () => {
      const response = await deleteSmartVOC();
      await refetch(); // Refrescar datos después de eliminar
      return response;
    },

    // Utilidades
    hasData: !!data?.data,
    isConfigured: !!data?.data,
  };
};

// Mantener compatibilidad con el API anterior
export const smartVocFixedAPI = smartVocAPI;

export default smartVocAPI;