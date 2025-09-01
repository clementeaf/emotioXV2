/**
 * Servicio de investigaciones migrado a AlovaJS
 * Mantiene la misma interfaz pero usa Alova internamente
 */

import { alovaApiClient, invalidateApiCache } from '../config/api';
import { alovaInstance } from '../config/alova.config';
import { useRequest, useFetcher } from 'alova/client';

/**
 * Interfaz que representa una investigación en el sistema
 */
export interface Research {
  id: string;
  name: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
  status: 'draft' | 'active' | 'completed';
  userId: string;
  // Otros campos relacionados con la investigación
}

/**
 * Interfaz para la creación de una nueva investigación
 */
export interface CreateResearchData {
  name: string;
  description?: string;
  // Otros campos necesarios para crear una investigación
}

/**
 * Respuesta estándar de la API
 */
interface APIResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  error?: string;
}

/**
 * Hook para obtener todas las investigaciones
 */
export const useResearchList = () => {
  return useRequest(
    alovaInstance.Get<APIResponse<Research[]>>('/research'),
    {
      initialData: { success: false, data: [] },
      cacheFor: 1000 * 60 * 2, // Cache por 2 minutos
    }
  );
};

/**
 * Hook para obtener una investigación específica
 */
export const useResearch = (id: string | null) => {
  return useRequest(
    alovaInstance.Get<APIResponse<Research>>(`/research/${id || 'null'}`),
    {
      initialData: undefined,
    }
  );
};

/**
 * Hook para mutaciones de investigaciones
 */
export const useResearchMutations = () => {
  const { fetch } = useFetcher();

  const create = async (data: CreateResearchData): Promise<Research> => {
    const response = await fetch(
      alovaInstance.Post<APIResponse<Research>>('/research', data)
    );
    
    // Invalidar caché de la lista de investigaciones
    invalidateApiCache('research', 'getAll');
    
    return response.data;
  };

  const update = async (id: string, data: Partial<CreateResearchData>): Promise<Research> => {
    const response = await fetch(
      alovaInstance.Put<APIResponse<Research>>(`/research/${id}`, data)
    );
    
    // Invalidar caché relacionado
    invalidateApiCache('research');
    
    return response.data;
  };

  const deleteResearch = async (id: string): Promise<void> => {
    await fetch(
      alovaInstance.Delete(`/research/${id}`)
    );
    
    // Invalidar caché relacionado
    invalidateApiCache('research');
  };

  const updateStatus = async (id: string, status: Research['status']): Promise<Research> => {
    const response = await fetch(
      alovaInstance.Put<APIResponse<Research>>(`/research/${id}/status`, { status })
    );
    
    // Invalidar caché relacionado
    invalidateApiCache('research');
    
    return response.data;
  };

  const updateStage = async (id: string, stage: string, progress: number = 0): Promise<Research> => {
    const response = await fetch(
      alovaInstance.Put<APIResponse<Research>>(`/research/${id}/stage`, { stage, progress })
    );
    
    // Invalidar caché relacionado
    invalidateApiCache('research');
    
    return response.data;
  };

  return {
    create,
    update,
    delete: deleteResearch,
    updateStatus,
    updateStage,
  };
};

/**
 * Servicio para manejar operaciones relacionadas con investigaciones usando AlovaJS
 */
export const researchService = {
  /**
   * Obtiene todas las investigaciones del usuario
   * @returns Lista de investigaciones
   */
  async getAll(): Promise<Research[]> {
    const response = await alovaApiClient.get('research', 'getAll') as APIResponse<Research[]>;
    return response.data || [];
  },

  /**
   * Obtiene una investigación por su ID
   * @param id ID de la investigación
   * @returns Investigación solicitada
   */
  async getById(id: string): Promise<Research> {
    const response = await alovaApiClient.get('research', 'getById', { id }) as APIResponse<Research>;
    return response.data;
  },

  /**
   * Crea una nueva investigación
   * @param data Datos de la nueva investigación
   * @returns Investigación creada
   */
  async create(data: CreateResearchData): Promise<Research> {
    const response = await alovaApiClient.post('research', 'create', data) as APIResponse<Research>;
    
    // Invalidar caché de la lista
    invalidateApiCache('research', 'getAll');
    
    return response.data;
  },

  /**
   * Actualiza una investigación existente
   * @param id ID de la investigación
   * @param data Datos a actualizar
   * @returns Investigación actualizada
   */
  async update(id: string, data: Partial<CreateResearchData>): Promise<Research> {
    const response = await alovaApiClient.put('research', 'update', data, { id }) as APIResponse<Research>;
    
    // Invalidar caché relacionado
    invalidateApiCache('research');
    
    return response.data;
  },

  /**
   * Elimina una investigación
   * @param id ID de la investigación
   * @returns Confirmación de eliminación
   */
  async delete(id: string): Promise<void> {
    await alovaApiClient.delete('research', 'delete', { id });
    
    // Invalidar caché relacionado
    invalidateApiCache('research');
  },

  /**
   * Actualiza el estado de una investigación
   * @param id ID de la investigación
   * @param status Nuevo estado
   * @returns Investigación actualizada
   */
  async updateStatus(id: string, status: Research['status']): Promise<Research> {
    const response = await alovaApiClient.put('research', 'updateStatus', { status }, { id }) as APIResponse<Research>;
    
    // Invalidar caché relacionado
    invalidateApiCache('research');
    
    return response.data;
  },

  /**
   * Actualiza la etapa de una investigación
   * @param id ID de la investigación
   * @param stage Nueva etapa
   * @param progress Progreso (opcional)
   * @returns Investigación actualizada
   */
  async updateStage(id: string, stage: string, progress: number = 0): Promise<Research> {
    const response = await alovaApiClient.put('research', 'updateStage', { stage, progress }, { id }) as APIResponse<Research>;
    
    // Invalidar caché relacionado
    invalidateApiCache('research');
    
    return response.data;
  },

  /**
   * Obtiene estadísticas de una investigación
   * @param id ID de la investigación
   * @returns Estadísticas
   */
  async getStats(id: string): Promise<any> {
    return alovaApiClient.get('researchInProgress', 'getOverviewMetrics', { researchId: id });
  },

  /**
   * Obtiene participantes de una investigación
   * @param id ID de la investigación
   * @returns Lista de participantes
   */
  async getParticipants(id: string): Promise<any[]> {
    const response = await alovaApiClient.get('researchInProgress', 'getParticipantsWithStatus', { researchId: id }) as APIResponse<any[]>;
    return response.data || [];
  },

  /**
   * Pre-carga datos de una investigación en caché
   * @param id ID de la investigación
   */
  async prefetchResearch(id: string): Promise<void> {
    try {
      const method = alovaInstance.Get<APIResponse<Research>>(`/research/${id}`);
      await method.send();
    } catch (error) {
      console.warn('Error prefetching research:', error);
    }
  },

  /**
   * Limpia caché relacionado con investigaciones
   */
  clearCache(): void {
    invalidateApiCache('research');
  },

  /**
   * Obtiene datos desde caché sin hacer petición HTTP
   * @param id ID de la investigación (opcional)
   * @returns Datos cacheados o null
   */
  getCachedData(id?: string): Research | Research[] | null {
    if (id) {
      const method = alovaInstance.Get<APIResponse<Research>>(`/research/${id}`);
      // Alova no expone directamente snapshots.get()
      const cached = null;
      return null;
    } else {
      const method = alovaInstance.Get<APIResponse<Research[]>>('/research');
      // Alova no expone directamente snapshots.get()
      const cached = null;
      return null;
    }
  }
};

/**
 * Hook completo para gestión de investigaciones
 * Combina queries y mutations en una sola interfaz
 */
export const useResearchManager = () => {
  // Lista de investigaciones
  const {
    data: listData,
    loading: listLoading,
    error: listError,
    send: refetchList
  } = useRequest(
    alovaInstance.Get<APIResponse<Research[]>>('/research'),
    {
      initialData: { success: false, data: [] },
      cacheFor: 1000 * 60 * 2,
    }
  );

  // Mutations
  const mutations = useResearchMutations();

  return {
    // Datos
    researches: listData?.data || [],
    loading: listLoading,
    error: listError as Error | null,
    
    // Acciones
    refetchList,
    create: async (data: CreateResearchData) => {
      const research = await mutations.create(data);
      await refetchList(); // Refrescar lista
      return research;
    },
    update: async (id: string, data: Partial<CreateResearchData>) => {
      const research = await mutations.update(id, data);
      await refetchList(); // Refrescar lista
      return research;
    },
    delete: async (id: string) => {
      await mutations.delete(id);
      await refetchList(); // Refrescar lista
    },
    updateStatus: async (id: string, status: Research['status']) => {
      const research = await mutations.updateStatus(id, status);
      await refetchList(); // Refrescar lista
      return research;
    },
    updateStage: async (id: string, stage: string, progress?: number) => {
      const research = await mutations.updateStage(id, stage, progress);
      await refetchList(); // Refrescar lista
      return research;
    },

    // Utilidades
    clearCache: () => invalidateApiCache('research'),
    hasData: (listData?.data?.length || 0) > 0,
  };
};

export default researchService;