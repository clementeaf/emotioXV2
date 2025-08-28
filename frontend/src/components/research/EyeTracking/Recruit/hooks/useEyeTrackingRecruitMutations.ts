import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';
import { eyeTrackingFixedAPI } from '@/lib/eye-tracking-api';
import { transformFormDataToAPI } from '../utils/formHelpers';
import { EyeTrackingRecruitFormData } from '../types/formData.types';

export function useEyeTrackingRecruitMutations(
  researchId: string,
  onError: (error: { visible: boolean; title: string; message: string }) => void
) {
  const queryClient = useQueryClient();
  const actualResearchId = researchId === 'current' ? '1234' : researchId;

  // Save configuration mutation
  const saveConfigMutation = useMutation({
    mutationFn: async (data: EyeTrackingRecruitFormData) => {
      const apiData = transformFormDataToAPI(data);
      return await eyeTrackingFixedAPI.saveRecruitConfig(apiData).send();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ 
        queryKey: ['eyeTrackingRecruit', actualResearchId] 
      });
      toast.success('Configuración guardada exitosamente');
    },
    onError: (error: unknown) => {
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
      onError({
        visible: true,
        title: 'Error al guardar',
        message: errorMessage
      });
    },
  });

  // Generate link mutation
  const generateLinkMutation = useMutation({
    mutationFn: async (configId: string) => {
      return await eyeTrackingFixedAPI.generateRecruitLink(configId).send();
    },
    onSuccess: (data) => {
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
    },
  });

  // Delete configuration mutation
  const deleteConfigMutation = useMutation({
    mutationFn: async (configId: string) => {
      return await eyeTrackingFixedAPI.deleteRecruitConfig(configId).send();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ 
        queryKey: ['eyeTrackingRecruit', actualResearchId] 
      });
      toast.success('Configuración eliminada');
    },
    onError: (error: unknown) => {
      const errorMessage = error instanceof Error ? error.message : 'Error al eliminar';
      onError({
        visible: true,
        title: 'Error',
        message: errorMessage
      });
    },
  });

  return {
    saveConfigMutation,
    generateLinkMutation,
    deleteConfigMutation,
    isLoading: saveConfigMutation.isPending || generateLinkMutation.isPending || deleteConfigMutation.isPending,
  };
}