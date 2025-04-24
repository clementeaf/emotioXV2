// Importar los tipos correctos desde el servicio
import { WelcomeScreenData, WelcomeScreenRecord } from '@/services/welcomeScreenService';

export interface ErrorModalData {
  title: string;
  message: string;
  type: 'error' | 'warning' | 'info';
}

export interface UseWelcomeScreenFormResult {
  formData: WelcomeScreenData; // Usa la WelcomeScreenData importada
  setFormData: React.Dispatch<React.SetStateAction<WelcomeScreenData>>;
  validationErrors: ValidationErrors;
  isLoading: boolean;
  isSaving: boolean;
  existingScreen: WelcomeScreenRecord | null; // <-- Usa WelcomeScreenRecord importada
  modalError: ErrorModalData | null;
  modalVisible: boolean;
  handleChange: (field: keyof WelcomeScreenData, value: any) => void;
  handleSubmit: () => Promise<void>;
  closeModal: () => void;
  handlePreview: () => void;
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
  onSave?: (data: WelcomeScreenData) => void; // Optional callback after save
}

/**
 * Props for the ErrorModal component.
 */
export interface ErrorModalProps {
  isOpen: boolean;
  onClose: () => void;
  error: ErrorModalData | null;
} 