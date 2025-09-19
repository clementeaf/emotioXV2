import {
    ThankYouScreenFormData as BaseThankYouScreenFormData,
    DEFAULT_THANK_YOU_SCREEN_CONFIG,
    DEFAULT_THANK_YOU_SCREEN_VALIDATION,
    ThankYouScreenConfig,
    ThankYouScreenResponse
} from '@/types';

// Extendemos el tipo base para agregar campos específicos para el formulario
export interface ThankYouScreenFormData extends BaseThankYouScreenFormData {
  questionKey: string;
}

// Tipo para errores de validación
export interface ValidationErrors {
  [key: string]: string;
}

// Tipo para los datos modales
export interface ErrorModalData {
  title: string;
  message: string;
  type: 'error' | 'info' | 'success' | 'warning';
}

// Props para el componente principal
export interface ThankYouScreenFormProps {
  className?: string;
  researchId: string;
  onSave?: (data: ThankYouScreenFormData) => void;
}

// Props para el encabezado
export interface ThankYouScreenHeaderProps {
  title: string;
  description: string;
}

// Props para el pie de página
export interface ThankYouScreenFooterProps {
  isSaving: boolean;
  isLoading: boolean;
  isEnabled: boolean;
  thankYouScreenId: string | null;
  onSave: () => void;
  onPreview: () => void;
  // NUEVO: Props para eliminar
  onDelete?: () => void;
  isDeleting?: boolean;
  showDelete?: boolean;
}

// Props para el modal de errores
export interface ErrorModalProps {
  isOpen: boolean;
  onClose: () => void;
  error: ErrorModalData | null;
}

// Props para la configuración principal
export interface ThankYouScreenSettingsProps {
  isEnabled: boolean;
  onEnabledChange: (checked: boolean) => void;
  disabled: boolean;
}

// Props para el contenido del formulario
export interface ThankYouScreenContentProps {
  title: string;
  message: string;
  redirectUrl: string;
  onTitleChange: (value: string) => void;
  onMessageChange: (value: string) => void;
  onRedirectUrlChange: (value: string) => void;
  validationErrors: ValidationErrors;
  disabled: boolean;
}

// Resultado del hook useThankYouScreenForm
export interface UseThankYouScreenFormResult {
  formData: ThankYouScreenFormData;
  thankYouScreenId: string | null;
  validationErrors: ValidationErrors;
  isLoading: boolean;
  isSaving: boolean;
  modalError: ErrorModalData | null;
  modalVisible: boolean;
  handleChange: (field: string | number | symbol, value: string | boolean) => void;
  handleSave: () => void;
  handlePreview: () => void;
  validateForm: () => boolean;
  closeModal: () => void;
  isExisting: boolean;
  // NUEVO: Props para eliminar
  handleDelete?: () => Promise<void>;
  isDeleting?: boolean;
  showDelete?: boolean;
  confirmModalVisible: boolean;
  showConfirmModal: () => void;
  closeConfirmModal: () => void;
  confirmDelete: () => Promise<void>;
}

// Exportamos tipos y constantes para acceso más fácil
export {
    DEFAULT_THANK_YOU_SCREEN_CONFIG,
    DEFAULT_THANK_YOU_SCREEN_VALIDATION,
    type ThankYouScreenConfig,
    type ThankYouScreenResponse
};
