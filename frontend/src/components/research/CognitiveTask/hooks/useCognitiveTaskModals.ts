import { useState, useCallback } from 'react';

// Tipos locales necesarios para este hook
interface ErrorModalData {
  title: string;
  message: string;
  type: 'error' | 'warning' | 'info' | 'success';
}

interface UseCognitiveTaskModalsResult {
  // Estado de Visibilidad
  modalVisible: boolean;
  showJsonPreview: boolean;
  showConfirmModal: boolean;

  // Contenido del Modal
  modalError: ErrorModalData | null;
  jsonToSend: string;
  pendingAction: 'save' | 'preview' | null;

  // Funciones de Control
  showModal: (errorData: ErrorModalData) => void;
  closeModal: () => void;
  showJsonModal: (jsonData: string, action: 'save' | 'preview') => void;
  closeJsonModal: () => void;
  showConfirmModalAction: () => void; // Renombrado para claridad
  closeConfirmModal: () => void;
  setPendingAction: (action: 'save' | 'preview' | null) => void;
  setJsonToSend: (json: string) => void;
}

export const useCognitiveTaskModals = (): UseCognitiveTaskModalsResult => {
  const [modalVisible, setModalVisible] = useState<boolean>(false);
  const [modalError, setModalError] = useState<ErrorModalData | null>(null);
  const [showJsonPreview, setShowJsonPreview] = useState<boolean>(false);
  const [jsonToSend, setJsonToSend] = useState<string>('');
  const [pendingAction, setPendingAction] = useState<'save' | 'preview' | null>(null);
  const [showConfirmModal, setShowConfirmModal] = useState<boolean>(false);

  const showModal = useCallback((errorData: ErrorModalData) => {
    setModalError(errorData);
    setModalVisible(true);
  }, []);

  const closeModal = useCallback(() => {
    setModalVisible(false);
    setModalError(null); // Limpiar error al cerrar
  }, []);

  const showJsonModal = useCallback((jsonData: string, action: 'save' | 'preview') => {
    setJsonToSend(jsonData);
    setPendingAction(action);
    setShowJsonPreview(true);
  }, []);

  const closeJsonModal = useCallback(() => {
    setShowJsonPreview(false);
    // No limpiar pendingAction aquí, se limpia al continuar o cancelar
  }, []);

  const showConfirmModalAction = useCallback(() => {
    setShowConfirmModal(true);
  }, []);

  const closeConfirmModal = useCallback(() => {
    setShowConfirmModal(false);
  }, []);

  return {
    modalVisible,
    showJsonPreview,
    showConfirmModal,
    modalError,
    jsonToSend,
    pendingAction,
    showModal,
    closeModal,
    showJsonModal,
    closeJsonModal,
    showConfirmModalAction,
    closeConfirmModal,
    setPendingAction,
    setJsonToSend,
  };
}; 