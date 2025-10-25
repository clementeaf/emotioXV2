/**
 * Tipos para el hook universal useFormManager
 */

export interface ErrorModalData {
  type: 'error' | 'warning' | 'info' | 'success';
  title?: string;
  message: string;
}

export interface UseFormManagerResult {
  formData: any;
  isLoading: boolean;
  isSaving: boolean;
  modalError: ErrorModalData | null;
  modalVisible: boolean;
  handleSave: () => Promise<void>;
  handlePreview: () => void;
  handleDelete: () => Promise<void>;
  closeModal: () => void;
  isExisting: boolean;
  isDeleteModalOpen: boolean;
  confirmDelete: () => Promise<void>;
  closeDeleteModal: () => void;
}

export interface ApiHookResult {
  data: any;
  isLoading: boolean;
  updateData: (data: any) => Promise<void>;
  createData: (data: any) => Promise<void>;
  deleteData: () => Promise<void>;
  isCreating: boolean;
  isUpdating: boolean;
}
