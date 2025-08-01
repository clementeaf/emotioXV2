// <<< Eliminar la re-exportación >>>
// Tipos importados desde shared/interfaces/welcome-screen.interface

// <<< Usar el alias importado abajo >>>
export const DEFAULT_WELCOME_SCREEN_CONFIG: Partial<WelcomeScreenServiceData> = {
  isEnabled: false,
  title: 'Bienvenido/a a la Investigación',
  message: 'Gracias por tu interés en participar. Por favor, lee la información y haz clic en \'Continuar\' cuando estés listo/a.',
  startButtonText: 'Continuar'
};

// Importar los tipos correctos desde el servicio (con alias)
import { WelcomeScreenRecord, WelcomeScreenFormData as WelcomeScreenServiceData } from '../../../../../shared/interfaces/welcome-screen.interface';

export interface ErrorModalData {
  title: string;
  message: string;
  type: 'error' | 'warning' | 'info';
}

export interface UseWelcomeScreenFormResult {
  formData: WelcomeScreenServiceData;
  setFormData: React.Dispatch<React.SetStateAction<WelcomeScreenServiceData>>;
  validationErrors: ValidationErrors;
  isLoading: boolean;
  isSaving: boolean;
  existingScreen: WelcomeScreenRecord | null;
  modalError: ErrorModalData | null;
  modalVisible: boolean;
  handleChange: (field: keyof WelcomeScreenServiceData, value: any) => void;
  handleSubmit: () => Promise<void>;
  closeModal: () => void;
  handlePreview: () => void;
  isEmpty: boolean;
  handleDelete?: () => Promise<void>;
  isDeleting?: boolean;
  showDelete?: boolean;
}

/**
 * Type definition for validation errors in the Welcome Screen form.
 */
export interface ValidationErrors {
  title?: string;
  message?: string;
  startButtonText?: string;
  subtitle?: string;
  logoUrl?: string;
  backgroundImageUrl?: string;
  backgroundColor?: string;
  textColor?: string;
  theme?: string;
  disclaimer?: string;
  customCss?: string;
  [key: string]: string | undefined;
}

/**
 * Props for the main WelcomeScreenForm component.
 */
export interface WelcomeScreenFormProps {
  className?: string;
  researchId: string;
  onSave?: (data: WelcomeScreenServiceData) => void;
}

/**
 * Props for the ErrorModal component.
 */
export interface ErrorModalProps {
  isOpen: boolean;
  onClose: () => void;
  error: ErrorModalData | null;
}
