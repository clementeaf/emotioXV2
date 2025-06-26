import type { CognitiveTaskFormData, HitZone, UploadedFile } from 'shared/interfaces/cognitive-task.interface';

export interface Choice {
  id: string;
  text: string;
  isQualify?: boolean;
  isDisqualify?: boolean;
}

export interface FileInfo {
  id: string;
  name: string;
  size: number;
  type: string;
  url: string;
  s3Key?: string;
  isLoading?: boolean;
  progress?: number;
  error?: boolean;
  status?: 'uploading' | 'uploaded' | 'pending-delete' | 'error';
  questionId?: string;
}

export interface ScaleConfig {
  startValue: number;
  endValue: number;
  startLabel?: string;
  endLabel?: string;
}

export interface Question {
  id: string;
  type: 'short_text' | 'long_text' | 'single_choice' | 'multiple_choice' | 'linear_scale' | 'ranking' | 'navigation_flow' | 'preference_test';
  title: string;
  description?: string;
  required: boolean;
  showConditionally: boolean;
  choices?: Choice[];
  scaleConfig?: ScaleConfig;
  files?: UploadedFile[];
  deviceFrame: boolean;
  answerPlaceholder?: string;
  hitZones?: HitZone[];
}

export type ValidationErrors = Record<string, string>;

export interface ErrorModalData {
  title: string;
  message: string;
  type: 'error' | 'warning' | 'info' | 'success';
}

export interface CognitiveTaskFormProps {
  className?: string;
  researchId?: string;
  onSave?: (data: any) => void;
}

export interface CognitiveTaskFieldsProps {
  questions: Question[];
  randomizeQuestions: boolean;
  onQuestionChange: (questionId: string, updates: Partial<Question>) => void;
  onAddChoice: (questionId: string) => void;
  onRemoveChoice: (questionId: string, choiceId: string) => void;
  onFileUpload: (questionId: string, files: FileList) => void;
  onFileDelete: (questionId: string, fileId: string) => void;
  setRandomizeQuestions: (value: boolean) => void;
  onAddQuestion: (type: Question['type']) => void;
  disabled?: boolean;
  isUploading?: boolean;
  uploadProgress?: number;
}

export interface QuestionCardProps {
  question: Question;
  onQuestionChange: (questionId: string, updates: Partial<Question>) => void;
  onAddChoice: (questionId: string) => void;
  onRemoveChoice: (questionId: string, choiceId: string) => void;
  onFileUpload: (questionId: string, files: FileList) => void;
  onFileDelete: (questionId: string, fileId: string) => void;
  disabled?: boolean;
  validationErrors?: { [key: string]: string } | null;
  isUploading?: boolean;
  uploadProgress?: number;
}

export interface CognitiveTaskHeaderProps {
  title: string;
  description: string;
}

export interface CognitiveTaskFooterProps {
  completionTimeText: string;
  previewButtonText: string;
  saveButtonText: string;
  onPreview: () => void;
  onSave: () => void;
  isSaving: boolean;
  disabled: boolean;
}

export interface ErrorModalProps {
  isOpen: boolean;
  onClose: () => void;
  error: ErrorModalData | null;
}

export interface AddQuestionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddQuestion: (type: Question['type']) => void;
}

export interface UseCognitiveTaskFormResult {
  formData: CognitiveTaskFormData;
  cognitiveTaskId: string | null;
  validationErrors: { [key: string]: string } | null;
  isLoading: boolean;
  isSaving: boolean;
  modalError: ErrorModalData | null;
  modalVisible: boolean;
  handleQuestionChange: (questionId: string, updates: Partial<Question>) => void;
  handleAddChoice: (questionId: string) => void;
  handleRemoveChoice: (questionId: string, choiceId: string) => void;
  handleFileUpload: (questionId: string, files: FileList) => void;
  handleFileDelete: (questionId: string, fileId: string) => void;
  handleAddQuestion: (type: Question['type']) => void;
  handleRandomizeChange: (value: boolean) => void;
  handleSave: () => void;
  validateForm: () => boolean;
  closeModal: () => void;
}

export interface TextQuestionProps {
  question: Question;
  onQuestionChange: (updates: Partial<Question>) => void;
  validationErrors: { [key: string]: string } | null;
  disabled?: boolean;
}

export interface ChoiceQuestionProps {
  question: Question;
  onQuestionChange: (updates: Partial<Question>) => void;
  onAddChoice?: () => void;
  onRemoveChoice?: (choiceId: string) => void;
  validationErrors: { [key: string]: string } | null;
  disabled?: boolean;
}

export interface ScaleQuestionProps {
  question: Question;
  onQuestionChange: (updates: Partial<Question>) => void;
  validationErrors: { [key: string]: string } | null;
  disabled?: boolean;
}

export interface FileUploadQuestionProps {
  question: Question;
  onQuestionChange: (updates: Partial<Question>) => void;
  onFileUpload?: (files: FileList) => void;
  onFileDelete?: (fileId: string) => void;
  validationErrors?: { [key: string]: string } | null;
  disabled?: boolean;
  isUploading?: boolean;
  uploadProgress?: number;
}

// Formularios ahora empiezan vacíos sin preguntas predeterminadas

export const DEFAULT_COGNITIVE_TASK_CONFIG: CognitiveTaskFormData = {
  researchId: '',
  questions: [],
  randomizeQuestions: false
};

export const QUESTION_TYPES = [
  { id: 'short_text', label: 'Short Text', description: 'Short text' },
  { id: 'long_text', label: 'Long Text', description: 'Long text' },
  { id: 'single_choice', label: 'Single Choice', description: 'Pick one option' },
  { id: 'multiple_choice', label: 'Multiple Choice', description: 'Pick multiple options' },
  { id: 'linear_scale', label: 'Linear Scale', description: 'For numerical scale' },
  { id: 'ranking', label: 'Ranking', description: 'Rank options in order' },
  { id: 'navigation_flow', label: 'Navigation Flow', description: 'Navigation flow test' },
  { id: 'preference_test', label: 'Preference Test', description: 'A/B testing' }
];

export interface UseCognitiveTaskModalsResult {
  // Modal de error
  modalVisible: boolean;
  modalError: ErrorModalData | null;
  showErrorModal: (error: ErrorModalData) => void;
  closeModal: () => void;
  // Modal de JSON
  showJsonPreview: boolean;
  jsonToSend: string;
  pendingAction: 'save' | 'preview' | null;
  openJsonModal: (jsonData: object, action: 'save' | 'preview') => void;
  closeJsonModal: () => void;
  // Modal de previsualización interactiva
  showInteractivePreview: boolean;
  openInteractivePreview: () => void;
  closeInteractivePreview: () => void;
  // Modal de confirmación de eliminación
  isDeleteModalOpen: boolean;
  openDeleteModal: () => void;
  closeDeleteModal: () => void;
}
