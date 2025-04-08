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
  isEnabled: boolean;
  title: string;
  message: string;
  startButtonText: string;
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
 * Tipo para datos de error modal
 */
export interface ErrorModalData {
  title: string;
  message: string | React.ReactNode;
  type: 'error' | 'info' | 'success';
}

/**
 * Props para el componente principal del formulario
 */
export interface WelcomeScreenFormProps {
  className?: string;
  researchId: string;
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
  onChange: (checked: boolean) => void;
  disabled: boolean;
}

/**
 * Props para los campos del formulario
 */
export interface WelcomeScreenFieldsProps {
  formData: WelcomeScreenData;
  onChange: (field: keyof WelcomeScreenData, value: any) => void;
  validationErrors: {[key: string]: string};
  disabled: boolean;
}

/**
 * Props para el pie de página
 */
export interface WelcomeScreenFooterProps {
  isSaving: boolean;
  isLoading: boolean;
  welcomeScreenId: string | null;
  isEnabled: boolean;
  onSave: () => void;
  onPreview: () => void;
}

/**
 * Props para el componente de modal
 */
export interface ErrorModalProps {
  isOpen: boolean;
  onClose: () => void;
  error: ErrorModalData | null;
}

/**
 * Resultado del hook useWelcomeScreenForm
 */
export interface UseWelcomeScreenFormResult {
  formData: WelcomeScreenData;
  welcomeScreenId: string | null;
  realWelcomeScreenId: string | null;
  validationErrors: {[key: string]: string};
  isLoading: boolean;
  isSaving: boolean;
  modalError: ErrorModalData | null;
  modalVisible: boolean;
  handleChange: (field: keyof WelcomeScreenData, value: any) => void;
  handleSave: () => void;
  handlePreview: () => void;
  validateForm: () => boolean;
  closeModal: () => void;
  showJsonPreview: boolean;
  closeJsonModal: () => void;
} 