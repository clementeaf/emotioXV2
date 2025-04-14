/**
 * Tipos relacionados con el formulario de pantalla de bienvenida
 */

/**
 * Valores por defecto para la pantalla de bienvenida
 */
export const DEFAULT_WELCOME_SCREEN_CONFIG = {
  isEnabled: true,
  title: '',
  message: '',
  startButtonText: 'Start Research'
};

/**
 * Estructura de datos para la pantalla de bienvenida
 */
export interface WelcomeScreenData {
  id?: string;
  researchId: string;
  isEnabled: boolean;
  title: string;
  message: string;
  startButtonText: string;
  metadata?: {
    version?: string;
    lastUpdated?: string;
    lastModifiedBy?: string;
  };
  createdAt?: string;
  updatedAt?: string;
}

/**
 * Respuesta de la API para operaciones de pantalla de bienvenida
 */
export interface WelcomeScreenResponse {
  data?: WelcomeScreenData;
  error?: string;
  success?: boolean;
  id?: string;
}

/**
 * Datos para el modal de error
 */
export interface ErrorModalData {
  title: string;
  message: string;
  type: 'error' | 'warning' | 'info' | 'success';
}

/**
 * Props para el componente principal del formulario
 */
export interface WelcomeScreenFormProps {
  className?: string;
  researchId: string;
  onSave?: () => void;
}

/**
 * Props para el componente de encabezado
 */
export interface WelcomeScreenHeaderProps {
  title: string;
  description: string;
}

/**
 * Props para el componente de toggle
 */
export interface WelcomeScreenToggleProps {
  isEnabled: boolean;
  onChange: (enabled: boolean) => void;
  disabled?: boolean;
}

/**
 * Props para los campos del formulario
 */
export interface WelcomeScreenFieldsProps {
  formData: WelcomeScreenData;
  onChange: (field: keyof WelcomeScreenData, value: string) => void;
  validationErrors: {[key: string]: string};
  disabled?: boolean;
}

/**
 * Props para el pie del formulario
 */
export interface WelcomeScreenFooterProps {
  onSave: () => void;
  onPreview: () => void;
  isSaving: boolean;
  isLoading: boolean;
  isEnabled: boolean;
  buttonText: string;
  isExisting?: boolean;
}

/**
 * Props para el modal de JSON
 */
export interface JsonPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  onContinue: () => void;
  jsonData: string;
  pendingAction: 'save' | 'preview' | null;
}

/**
 * Props para el componente de modal de error
 */
export interface ErrorModalProps {
  isOpen: boolean;
  onClose: () => void;
  error: ErrorModalData | null;
}

// Tipos de validación
export type ValidationErrors = {
  [key: string]: string;
};

/**
 * Resultado del hook useWelcomeScreenForm
 */
export interface UseWelcomeScreenFormResult {
  formData: WelcomeScreenData;
  validationErrors: ValidationErrors;
  isLoading: boolean;
  isSaving: boolean;
  modalError: ErrorModalData | null;
  modalVisible: boolean;
  handleChange: (field: keyof WelcomeScreenData, value: any) => void;
  handleSave: () => void;
  handlePreview: () => void;
  validateForm: () => boolean;
  closeModal: () => void;
  isExisting: boolean;
  closeErrorModal: () => void;
  existingScreen: WelcomeScreenData | null;
} 