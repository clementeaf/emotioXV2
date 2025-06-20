import { useState } from 'react';
import type { ErrorModalData, UseCognitiveTaskModalsResult } from '../types';

/**
 * Hook para gestionar los estados de los modales en el formulario de tareas cognitivas.
 * Centraliza la lógica de visibilidad y contenido de los modales.
 */
export const useCognitiveTaskModals = (): UseCognitiveTaskModalsResult => {
  // Modal de error
  const [modalVisible, setModalVisible] = useState(false);
  const [modalError, setModalError] = useState<ErrorModalData | null>(null);

  // Modal de vista previa de JSON
  const [showJsonPreview, setShowJsonPreview] = useState(false);
  const [jsonToSend, setJsonToSend] = useState('');
  const [pendingAction, setPendingAction] = useState<'save' | 'preview' | null>(null);

  // Nuevo: Modal para la previsualización interactiva
  const [showInteractivePreview, setShowInteractivePreview] = useState(false);

  // Función para mostrar el modal de error
  const showErrorModal = (error: ErrorModalData) => {
    setModalError(error);
    setModalVisible(true);
  };

  // Función para cerrar cualquier modal
  const closeModal = () => {
    setModalVisible(false);
    setShowJsonPreview(false);
    setShowInteractivePreview(false); // Asegurarse de cerrar el nuevo modal también
    setModalError(null);
    setPendingAction(null);
  };

  // Funciones para el modal de JSON
  const openJsonModal = (jsonData: object, action: 'save' | 'preview') => {
    setJsonToSend(JSON.stringify(jsonData, null, 2));
    setPendingAction(action);
    setShowJsonPreview(true);
  };

  const closeJsonModal = () => {
    setShowJsonPreview(false);
    setPendingAction(null);
  };

  // Funciones para el modal de previsualización interactiva
  const openInteractivePreview = () => {
    setShowInteractivePreview(true);
  };

  const closeInteractivePreview = () => {
    setShowInteractivePreview(false);
  };

  return {
    // Modal de error
    modalVisible,
    modalError,
    showErrorModal,
    closeModal,
    // Modal de JSON
    showJsonPreview,
    jsonToSend,
    pendingAction,
    openJsonModal,
    closeJsonModal,
    // Modal de previsualización interactiva
    showInteractivePreview,
    openInteractivePreview,
    closeInteractivePreview,
  };
};
