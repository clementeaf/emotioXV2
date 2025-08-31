import { useRequest } from 'alova/client';
import { toast } from 'react-hot-toast';
import { transformFormDataToAPI } from '../utils/formHelpers';
import { EyeTrackingRecruitFormData } from '../types/formData.types';
import { alovaInstance } from '@/config/alova.config';

export function useEyeTrackingRecruitMutations(
  researchId: string,
  onError: (error: { visible: boolean; title: string; message: string }) => void
) {
  const actualResearchId = researchId === 'current' ? '1234' : researchId;

  // Save configuration mutation
  const saveConfigMutation = useRequest(
    (data: EyeTrackingRecruitFormData) => {
      const apiData = transformFormDataToAPI(data);
      return alovaInstance.Post('/eye-tracking-recruit/config', { ...apiData, researchId: actualResearchId });
    },
    {
      immediate: false,
      onSuccess: () => {
        toast.success('Configuración guardada exitosamente');
      },
      onError: (error: unknown) => {
        const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
        onError({
          visible: true,
          title: 'Error al guardar',
          message: errorMessage
        });
      }
    }
  );

  // Generate link mutation
  const generateLinkMutation = useRequest(
    (configId: string) => 
      alovaInstance.Get(`/eye-tracking-recruit/config/${configId}`),
    {
      immediate: false,
      onSuccess: (data: unknown) => {
        toast.success('Enlace generado exitosamente');
        return data;
      },
      onError: (error: unknown) => {
        const errorMessage = error instanceof Error ? error.message : 'Error al generar enlace';
        onError({
          visible: true,
          title: 'Error',
          message: errorMessage
        });
      }
    }
  );

  // Delete configuration mutation
  const deleteConfigMutation = useRequest(
    (configId: string) => 
      alovaInstance.Delete(`/eye-tracking-recruit/config/${configId}`),
    {
      immediate: false,
      onSuccess: () => {
        toast.success('Configuración eliminada');
      },
      onError: (error: unknown) => {
        const errorMessage = error instanceof Error ? error.message : 'Error al eliminar';
        onError({
          visible: true,
          title: 'Error',
          message: errorMessage
        });
      }
    }
  );

  return {
    saveConfigMutation: {
      mutate: saveConfigMutation.send,
      isPending: saveConfigMutation.loading
    },
    generateLinkMutation: {
      mutate: generateLinkMutation.send,
      isPending: generateLinkMutation.loading
    },
    deleteConfigMutation: {
      mutate: deleteConfigMutation.send,
      isPending: deleteConfigMutation.loading
    },
    isLoading: saveConfigMutation.loading || generateLinkMutation.loading || deleteConfigMutation.loading,
  };
}