export interface WelcomeScreenMetadata {
  version: string;
  lastUpdated: string;
  lastModifiedBy: string;
}

export interface WelcomeScreenData {
  id?: string;
  researchId: string;
  isEnabled: boolean;
  title: string;
  message: string;
  startButtonText: string;
  subtitle?: string;
  logoUrl?: string;
  createdAt?: string;
  updatedAt?: string;
  metadata?: WelcomeScreenMetadata;
}

export interface ErrorModalData {
  title: string;
  message: string;
  type: 'error' | 'warning' | 'info';
}

export interface UseWelcomeScreenFormResult {
  formData: WelcomeScreenData;
  setFormData: (data: WelcomeScreenData) => void;
  validationErrors: { [key: string]: string };
  isLoading: boolean;
  isSaving: boolean;
  existingScreen: WelcomeScreenData | null;
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
  // Allow for other potential validation keys if needed
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