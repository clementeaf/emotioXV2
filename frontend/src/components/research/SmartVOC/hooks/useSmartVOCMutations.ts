// Hook para operaciones de API del formulario SmartVOC
// Responsabilidad: Contener toda la lógica de TanStack Query (useQuery y useMutation)

import { smartVocFixedAPI } from '@/lib/smart-voc-api';
import { useAuth } from '@/providers/AuthProvider';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useCallback, useState } from 'react';
import toast from 'react-hot-toast';
import { SmartVOCFormData } from 'shared/interfaces/smart-voc.interface';
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
    refetchOnWindowFocus: false
  });

  // Mutación para guardar datos
  const saveMutation = useMutation({
    mutationFn: async (data: SmartVOCFormData): Promise<SmartVOCFormData> => {
      // Limpiar y preparar los datos para cumplir con la validación del backend
      const cleanedData: SmartVOCFormData = {
        ...data,
        questions: data.questions.map((q) => {
          // 1. Asegurar que 'description' no esté vacío
          const description = q.description || q.title || ' '; // Usar título como fallback

          // 2. Añadir el campo 'required'
          const required = q.type !== 'VOC'; // Todas son requeridas excepto VOC

          // 3. Limpiar 'companyName' si está vacío en la configuración
          const config = { ...q.config };
          if ('companyName' in config && config.companyName === '') {
            delete config.companyName;
          }

          return {
            ...q,
            description,
            required,
            config,
          };
        }),
      };

      // Lógica condicional: Si tenemos un ID, actualizamos (PUT). Si no, creamos (POST).
      if (smartVocId) {
        console.log(`[SmartVOCForm] Actualizando (PUT) formulario existente con ID: ${smartVocId}`);
        return smartVocFixedAPI.update(smartVocId, cleanedData);
      } else {
        console.log(`[SmartVOCForm] Creando (POST) nuevo formulario para researchId: ${researchId}`);
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
        console.log('[SmartVOCForm] SmartVOC ID actualizado/obtenido:', responseWithId.id);
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
      showModal({
        title: UI_TEXTS.MODAL.ERROR_TITLE,
        message: error.message || 'Error al guardar los datos',
        type: 'error'
      });
    }
  });

  // Mutación para eliminar datos
  const deleteMutation = useMutation({
    mutationFn: async () => {
      if (!window.confirm('⚠️ ¿Estás seguro de que quieres eliminar TODOS los datos SmartVOC de esta investigación?\n\nEsta acción no se puede deshacer.')) {
        throw new Error('Operación cancelada por el usuario');
      }

      let success = false;

      if (smartVocId) {
        success = await smartVocFixedAPI.deleteSmartVOC(researchId, smartVocId);
      } else {
        success = await smartVocFixedAPI.deleteByResearchId(researchId);
      }

      if (!success) {
        // Si la API devuelve false (ej. por un 404), lanzamos un error para que lo capture el catch
        throw new Error('El recurso a eliminar no fue encontrado en el servidor (404).');
      }

      return success;
    },
    onSuccess: () => {
      // Invalidar queries
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.SMART_VOC, researchId] });

      showModal({
        title: 'Éxito',
        message: 'Datos SmartVOC eliminados correctamente',
        type: 'success'
      });
    },
    onError: (error: any) => {
      if (error.message !== 'Operación cancelada por el usuario') {
        console.error('[SmartVOCForm] Error al eliminar:', error);
        showModal({
          title: 'Error',
          message: error.message || 'Error al eliminar los datos SmartVOC',
          type: 'error'
        });
      }
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
