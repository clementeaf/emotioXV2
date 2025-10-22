import { useState } from 'react';

export interface ErrorModalData {
  type: 'error' | 'warning' | 'info' | 'success';
  title?: string;
  message: string;
}

export interface UseModalManagerResult {
  modalVisible: boolean;
  modalError: ErrorModalData | null;
  isDeleteModalOpen: boolean;
  showJsonPreview: boolean;
  jsonToSend: string;
  pendingAction: 'save' | 'preview' | null;
  showInteractivePreview: boolean;
  showErrorModal: (error: ErrorModalData) => void;
  closeModal: () => void;
  showDeleteModal: () => void;
  closeDeleteModal: () => void;
  openJsonModal: (jsonData: object, action: 'save' | 'preview') => void;
  closeJsonModal: () => void;
  showInteractivePreviewModal: () => void;
  closeInteractivePreviewModal: () => void;
}

/**
 * Hook genérico para gestión de modales
 * Centraliza la lógica de visibilidad y contenido de los modales.
 */
export const useModalManager = (): UseModalManagerResult => {
  // Modal de error
  const [modalVisible, setModalVisible] = useState(false);
  const [modalError, setModalError] = useState<ErrorModalData | null>(null);

  // Modal de vista previa de JSON
  const [showJsonPreview, setShowJsonPreview] = useState(false);
  const [jsonToSend, setJsonToSend] = useState('');
  const [pendingAction, setPendingAction] = useState<'save' | 'preview' | null>(null);

  // Nuevo: Modal para la previsualización interactiva
  const [showInteractivePreview, setShowInteractivePreview] = useState(false);

  // 🆕 Modal de confirmación para eliminar datos (igual que SmartVOC)
  const [isDeleteModalOpen, setDeleteModalOpen] = useState(false);

  // Función para mostrar el modal de error
  const showErrorModal = (error: ErrorModalData) => {
    setModalError(error);
    setModalVisible(true);
  };

  // Función para cerrar cualquier modal
  const closeModal = () => {
    setModalVisible(false);
    setShowJsonPreview(false);
    setShowInteractivePreview(false);
    setDeleteModalOpen(false); // 🆕 Cerrar también el modal de confirmación
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

  // 🆕 Funciones para el modal de confirmación de eliminación
  const openDeleteModal = () => {
    setDeleteModalOpen(true);
  };

  const closeDeleteModal = () => {
    setDeleteModalOpen(false);
  };

  return {
    modalVisible,
    modalError,
    isDeleteModalOpen,
    showJsonPreview,
    jsonToSend,
    pendingAction,
    showInteractivePreview,
    showErrorModal,
    closeModal,
    showDeleteModal: openDeleteModal,
    closeDeleteModal,
    openJsonModal,
    closeJsonModal,
    showInteractivePreviewModal: openInteractivePreview,
    closeInteractivePreviewModal: closeInteractivePreview
  };
};
