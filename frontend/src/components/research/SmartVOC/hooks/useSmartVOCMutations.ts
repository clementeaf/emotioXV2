// Hook para operaciones de API del formulario SmartVOC
// Responsabilidad: Contener toda la lógica de TanStack Query (useQuery y useMutation)

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useCallback, useState } from 'react';
import toast from 'react-hot-toast';
import { QuestionType } from 'shared/interfaces/question-types.enum';
import { SmartVOCFormData } from 'shared/interfaces/smart-voc.interface';

import { smartVocFixedAPI } from '@/lib/smart-voc-api';
import { useAuth } from '@/providers/AuthProvider';

import { QUERY_KEYS, SUCCESS_MESSAGES, UI_TEXTS } from '../constants';
import { ErrorModalData } from '../types';

/**
 * Hook para operaciones de API del formulario SmartVOC
 * Responsabilidad: Contener toda la lógica de TanStack Query (useQuery y useMutation)
 */
export const useSmartVOCMutations = (researchId: string, smartVocId?: string) => {
  const queryClient = useQueryClient();
  const { user, token, authLoading } = useAuth();
  const isAuthenticated = !!user && !!token;
  const [modalError, setModalError] = useState<ErrorModalData | null>(null);
  const [modalVisible, setModalVisible] = useState<boolean>(false);

  // Restaurar Handlers para el modal de error
  const closeModal = useCallback(() => setModalVisible(false), []);
  const showModal = useCallback((errorData: ErrorModalData) => {
    setModalError(errorData);
    setModalVisible(true);
  }, []);

  // Consulta para obtener datos existentes
  const { data: smartVocData, isLoading } = useQuery({
    queryKey: [QUERY_KEYS.SMART_VOC, researchId],
    queryFn: async () => {
      if (!isAuthenticated || !token) {
        throw new Error('No autenticado');
      }

      let currentToken = token;
      if (!currentToken && typeof window !== 'undefined') {
        const localStorageToken = localStorage.getItem('token');
        if (localStorageToken) {
          currentToken = localStorageToken;
        }
      }

      if (!currentToken) {
        throw new Error('No se pudo recuperar un token válido');
      }

      const response = await smartVocFixedAPI.getByResearchId(researchId);
      return response;
    },
    enabled: !!researchId && isAuthenticated && !authLoading,
    refetchOnWindowFocus: false,
    retry: false,
  });

  // Mutación para guardar datos
  const saveMutation = useMutation({
    mutationFn: async (data: SmartVOCFormData & { smartVocId?: string | null }): Promise<SmartVOCFormData> => {
      // Limpiar y preparar los datos para cumplir con la validación del backend
      const cleanedData: SmartVOCFormData = {
        ...data,
        questions: data.questions.map((q) => {
          // 1. Asegurar que 'description' no esté vacío
          const description = q.description || q.title || ' ';
          // 2. Añadir el campo 'required'
          const required = q.type !== QuestionType.SMARTVOC_VOC;
          // 3. Preservar configuración existente y limpiar solo companyName si está vacío
          const config = { ...q.config };
          if ('companyName' in config && config.companyName === '') {
            delete config.companyName;
          }
          // 4. Asegurar que CSAT tenga el tipo correcto
          if (q.type === QuestionType.SMARTVOC_CSAT && (!config.type || config.type === 'scale')) {
            config.type = 'stars';
          }
          return {
            ...q,
            description,
            required,
            config,
          };
        }),
      };
      // Lógica condicional: Si tenemos un smartVocId, actualizamos (PUT). Si no, creamos (POST).
      if (data.smartVocId) {
        // console.log(`[SmartVOCForm] Actualizando (PUT) formulario existente con ID: ${data.smartVocId}`);
        return smartVocFixedAPI.update(researchId, data.smartVocId, cleanedData);
      } else {
        // console.log(`[SmartVOCForm] Creando (POST) nuevo formulario para researchId: ${researchId}`);
        return smartVocFixedAPI.create(cleanedData);
      }
    },
    onSuccess: (savedData) => {
      toast.success(SUCCESS_MESSAGES.SAVE_SUCCESS);

      // Actualizar el cache local directamente para reflejar los cambios en la UI
      queryClient.setQueryData([QUERY_KEYS.SMART_VOC, researchId], savedData);

      // Invalidar la query también para asegurar consistencia a futuro
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.SMART_VOC, researchId] });

      const responseWithId = savedData as SmartVOCFormData & { id?: string };
      if (responseWithId?.id) {
        // console.log('[SmartVOCForm] SmartVOC ID actualizado/obtenido:', responseWithId.id);
      }

      showModal({
        title: 'Éxito',
        message: smartVocId ? SUCCESS_MESSAGES.UPDATE_SUCCESS : SUCCESS_MESSAGES.CREATE_SUCCESS,
        type: 'info'
      });
    },
    onError: (error: any, data) => {
      if (process.env.NODE_ENV === 'development') {
        console.error('[SmartVOCForm] Error al guardar. Datos enviados:', data);
      }

      let displayMessage = 'Ocurrió un error al guardar los datos. Por favor, intenta de nuevo.';
      const rawMessage = error?.message || '';

      if (rawMessage.includes('Body:')) {
        try {
          const bodyString = rawMessage.substring(rawMessage.indexOf('Body: ') + 6);
          const bodyJson = JSON.parse(bodyString);
          const serverMessage = bodyJson.message || '';

          if (serverMessage.includes('requiere companyName')) {
            displayMessage = "Error de validación: Una o más preguntas (CSAT, NPS, NEV) requieren un 'Nombre de la empresa'. Por favor, completa ese campo para poder guardar.";
          } else if (serverMessage.includes('INVALID_SMART_VOC_DATA')) {
            displayMessage = 'Se encontraron errores de validación en el formulario. Por favor, revisa los datos de las preguntas.';
          }
        } catch (e) {
          console.error('Error al parsear el mensaje de la API:', e);
        }
      }

      showModal({
        title: UI_TEXTS.MODAL.ERROR_TITLE,
        message: displayMessage,
        type: 'error'
      });
    }
  });

  // Mutación para eliminar datos - SIN confirmación interna
  const deleteMutation = useMutation({
    mutationFn: async () => {
      // Usar deleteByResearchId que solo requiere researchId, no un formId específico
      // console.log(`[SmartVOCForm] Eliminando SmartVOC para researchId: ${researchId}`);
      const success = await smartVocFixedAPI.deleteByResearchId(researchId);

      if (!success) {
        throw new Error('El recurso a eliminar no fue encontrado en el servidor (404).');
      }
      return success;
    },
    onSuccess: () => {
      // Limpiar el cache para forzar la recarga y reflejar el estado "sin configuración"
      queryClient.setQueryData([QUERY_KEYS.SMART_VOC, researchId], { notFound: true });
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.SMART_VOC, researchId] });

      toast.success('Datos SmartVOC eliminados correctamente.');
    },
    onError: (error: any) => {
      console.error('[SmartVOCForm] Error al eliminar:', error);
      showModal({
        title: 'Error',
        message: error.message || 'Error al eliminar los datos SmartVOC',
        type: 'error'
      });
    }
  });

  return {
    // Datos de la consulta
    smartVocData,
    isLoading,

    // Mutación de guardado
    saveMutation,
    isSaving: saveMutation.isPending,

    // Mutación de borrado
    deleteMutation,
    isDeleting: deleteMutation.isPending,

    // Modal handlers
    modalError,
    modalVisible,
    closeModal,
    showModal
  };
};
