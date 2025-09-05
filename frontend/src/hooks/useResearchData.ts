/**
 * Hook para gestionar datos de investigación usando AlovaJS
 * Migrado de React Query a AlovaJS
 */

import { useRequest, useWatcher, useFetcher } from 'alova/client';
import { alovaInstance } from '@/config/alova.config';
import { Research } from '../../../shared/interfaces/research.model';
import { useState, useEffect } from 'react';

interface UseResearchDataReturn {
  research: Research | null;
  loading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
  updateResearch: (data: Partial<Research>) => Promise<void>;
  deleteResearch: () => Promise<void>;
}

/**
 * Hook principal para datos de investigación con Alova
 */
export const useResearchData = (researchId: string | null): UseResearchDataReturn => {
  const [localData, setLocalData] = useState<Research | null>(null);
  
  // useRequest de Alova para cargar los datos iniciales
  const {
    loading,
    data: research,
    error,
    send: refetch,
    update
  } = useRequest(
    alovaInstance.Get<{ success: boolean; data: Research }>(`/research/${researchId || 'null'}`),
    {
      initialData: undefined,
      immediate: !!researchId, // Solo ejecutar si hay researchId
    }
  );
  
  // useFetcher para operaciones de mutación
  const { fetch: fetchUpdate } = useFetcher();
  
  // Actualizar datos locales cuando cambie la respuesta
  useEffect(() => {
    if (research) {
      setLocalData(research.data || research);
    }
  }, [research]);
  
  // Función para actualizar investigación
  const updateResearch = async (data: Partial<Research>) => {
    if (!researchId) throw new Error('No research ID provided');
    
    try {
      const response = await fetchUpdate(
        alovaInstance.Put<{ success: boolean; data: Research }>(
          `/research/${researchId}`,
          data
        )
      );
      
      if (response.success && response.data) {
        // Actualizar datos locales optimistamente
        setLocalData(response.data);
        // Actualizar caché de Alova
        update({
          data: {
            success: true,
            data: response.data
          }
        });
      }
    } catch (err) {
      console.error('Error updating research:', err);
      throw err;
    }
  };
  
  // Función para eliminar investigación
  const deleteResearch = async () => {
    if (!researchId) throw new Error('No research ID provided');
    
    try {
      await fetchUpdate(
        alovaInstance.Delete(`/research/${researchId}`)
      );
      
      // Limpiar datos locales
      setLocalData(null);
      // Invalidar caché
      alovaInstance.snapshots.match(`/research/${researchId}`).forEach(method => {
        method.abort();
      });
    } catch (err) {
      console.error('Error deleting research:', err);
      throw err;
    }
  };
  
  return {
    research: localData,
    loading,
    error: error as Error | null,
    refetch: async () => {
      await refetch();
    },
    updateResearch,
    deleteResearch,
  };
};

/**
 * Hook para lista de investigaciones con Alova
 */
export const useResearchList = () => {
  const {
    loading,
    data,
    error,
    send: refetch,
  } = useRequest(
    alovaInstance.Get<{ success: boolean; data: Research[] }>('/research'),
    {
      initialData: { success: false, data: [] },
      cacheFor: 1000 * 60 * 5, // Cache por 5 minutos
    }
  );
  
  return {
    researches: data?.data || [],
    loading,
    error: error as Error | null,
    refetch,
  };
};

/**
 * Hook reactivo para observar cambios en una investigación
 * Útil para actualizaciones en tiempo real
 */
export const useWatchResearch = (researchId: string | null) => {
  const {
    loading,
    data,
    error,
  } = useWatcher(
    alovaInstance.Get<{ success: boolean; data: Research }>(`/research/${researchId || 'null'}`),
    [researchId], // Dependencias que disparan re-fetch
    {
      initialData: undefined,
      immediate: !!researchId,
      debounce: 500, // Debounce de 500ms para evitar múltiples llamadas
    }
  );
  
  return {
    research: data?.data || null,
    loading,
    error: error as Error | null,
  };
};

/**
 * Hook para gestionar el estado de la investigación
 */
export const useResearchStatus = (researchId: string | null) => {
  const { fetch } = useFetcher();
  
  const updateStatus = async (status: string) => {
    if (!researchId) throw new Error('No research ID provided');
    
    const response = await fetch(
      alovaInstance.Put<{ success: boolean; data: Research }>(
        `/research/${researchId}/status`,
        { status }
      )
    );
    
    // Invalidar caché para forzar actualización
    alovaInstance.snapshots.match(`/research/${researchId}`).forEach(method => {
      method.abort();
    });
    
    return response;
  };
  
  const updateStage = async (stage: string, progress: number) => {
    if (!researchId) throw new Error('No research ID provided');
    
    const response = await fetch(
      alovaInstance.Put<{ success: boolean; data: Research }>(
        `/research/${researchId}/stage`,
        { stage, progress }
      )
    );
    
    // Invalidar caché
    alovaInstance.snapshots.match(`/research/${researchId}`).forEach(method => {
      method.abort();
    });
    
    return response;
  };
  
  return {
    updateStatus,
    updateStage,
  };
};

/**
 * Hook para gestionar módulos de investigación con Alova
 */
export const useResearchModules = (researchId: string | null) => {
  // SmartVOC
  const smartVoc = useRequest(
    alovaInstance.Get(`/research/${researchId || 'null'}/smart-voc`),
    {
      initialData: undefined,
      immediate: false, // Cargar bajo demanda
    }
  );
  
  // Eye Tracking
  const eyeTracking = useRequest(
    alovaInstance.Get(`/research/${researchId || 'null'}/eye-tracking`),
    {
      initialData: undefined,
      immediate: false,
    }
  );
  
  // Cognitive Task
  const cognitiveTask = useRequest(
    alovaInstance.Get(`/research/${researchId || 'null'}/cognitive-task`),
    {
      initialData: undefined,
      immediate: false,
    }
  );
  
  // ❌ ELIMINADO: Welcome Screen duplicado - usar useWelcomeScreenData() desde /hooks/useWelcomeScreenData.ts
  const welcomeScreen = { 
    data: null, 
    loading: false, 
    error: null, 
    send: async () => Promise.resolve(null) 
  }; // Placeholder para mantener compatibilidad
  
  // Thank You Screen
  const thankYouScreen = useRequest(
    alovaInstance.Get(`/research/${researchId || 'null'}/thank-you-screen`),
    {
      initialData: undefined,
      immediate: false,
    }
  );
  
  // Función para cargar todos los módulos
  const loadAllModules = async () => {
    await Promise.all([
      smartVoc.send(),
      eyeTracking.send(),
      cognitiveTask.send(),
      welcomeScreen.send(),
      thankYouScreen.send(),
    ]);
  };
  
  return {
    modules: {
      smartVoc: {
        data: smartVoc.data,
        loading: smartVoc.loading,
        error: smartVoc.error,
        load: smartVoc.send,
      },
      eyeTracking: {
        data: eyeTracking.data,
        loading: eyeTracking.loading,
        error: eyeTracking.error,
        load: eyeTracking.send,
      },
      cognitiveTask: {
        data: cognitiveTask.data,
        loading: cognitiveTask.loading,
        error: cognitiveTask.error,
        load: cognitiveTask.send,
      },
      welcomeScreen: {
        data: welcomeScreen.data,
        loading: welcomeScreen.loading,
        error: welcomeScreen.error,
        load: welcomeScreen.send,
      },
      thankYouScreen: {
        data: thankYouScreen.data,
        loading: thankYouScreen.loading,
        error: thankYouScreen.error,
        load: thankYouScreen.send,
      },
    },
    loadAllModules,
    isLoadingAny: smartVoc.loading || eyeTracking.loading || cognitiveTask.loading || 
                  welcomeScreen.loading || thankYouScreen.loading,
  };
};

export default useResearchData;