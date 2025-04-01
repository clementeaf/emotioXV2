/**
 * Definiciones de tipos para el componente CognitiveTask
 */

// Tipo para las opciones de preguntas de selección
export interface Choice {
  id: string;
  text: string;
  isQualify?: boolean;
  isDisqualify?: boolean;
}

// Tipo para la configuración de escala lineal
export interface ScaleConfig {
  startValue: number;
  endValue: number;
}

// Tipo para archivos subidos
export interface UploadedFile {
  id: string;
  name: string;
  size: number;
  type: string;
  url: string;
}

// Tipos de preguntas soportados
export type QuestionType = 
  | 'short_text' 
  | 'long_text' 
  | 'single_choice' 
  | 'multiple_choice' 
  | 'linear_scale' 
  | 'ranking' 
  | 'navigation_flow' 
  | 'preference_test';

// Definición de una pregunta
export interface Question {
  id: string;
  type: QuestionType;
  title: string;
  description?: string;
  required: boolean;
  showConditionally: boolean;
  deviceFrame: boolean;
  choices?: Choice[];
  scaleConfig?: ScaleConfig;
  files?: UploadedFile[];
}

// Tipo para errores de validación
export interface ValidationErrors {
  [key: string]: string;
}

// Tipo para los datos modales
export interface ErrorModalData {
  title: string;
  message: string;
  type: 'error' | 'info' | 'success';
}

// Tipo para los metadatos de tipos de preguntas
export interface QuestionTypeInfo {
  id: QuestionType;
  label: string;
  description: string;
}

// Datos completos del formulario
export interface CognitiveTaskFormData {
  researchId?: string;
  questions: Question[];
  randomizeQuestions: boolean;
}

// Definiciones de props para componentes

// Props para el componente principal
export interface CognitiveTaskFormProps {
  className?: string;
  researchId?: string;
  onSave?: (data: CognitiveTaskFormData) => void;
}

// Props para el encabezado
export interface CognitiveTaskHeaderProps {
  title: string;
  description: string;
}

// Props para el pie de página
export interface CognitiveTaskFooterProps {
  isSaving: boolean;
  isLoading: boolean;
  cognitiveTaskId: string | null;
  onSave: () => void;
  onPreview: () => void;
}

// Props para el modal de errores
export interface ErrorModalProps {
  isOpen: boolean;
  onClose: () => void;
  error: ErrorModalData | null;
}

// Props para la configuración principal
export interface CognitiveTaskSettingsProps {
  randomizeQuestions: boolean;
  onRandomizeChange: (checked: boolean) => void;
  disabled: boolean;
}

// Props genéricas para una tarjeta de pregunta
export interface QuestionCardProps {
  question: Question;
  onQuestionChange: (questionId: string, updates: Partial<Question>) => void;
  onAddChoice?: (questionId: string) => void;
  onRemoveChoice?: (questionId: string, choiceId: string) => void;
  onFileUpload?: (questionId: string, files: FileList) => void;
  disabled: boolean;
  validationErrors: ValidationErrors;
}

// Props para el modal de agregar pregunta
export interface AddQuestionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddQuestion: (type: QuestionType) => void;
  questionTypes: QuestionTypeInfo[];
}

// Props para los tipos específicos de preguntas
export interface TextQuestionProps {
  question: Question;
  onQuestionChange: (updates: Partial<Question>) => void;
  validationErrors: ValidationErrors;
  disabled: boolean;
}

export interface ChoiceQuestionProps {
  question: Question;
  onQuestionChange: (updates: Partial<Question>) => void;
  onAddChoice: () => void;
  onRemoveChoice: (choiceId: string) => void;
  validationErrors: ValidationErrors;
  disabled: boolean;
}

export interface ScaleQuestionProps {
  question: Question;
  onQuestionChange: (updates: Partial<Question>) => void;
  validationErrors: ValidationErrors;
  disabled: boolean;
}

export interface FileUploadQuestionProps {
  question: Question;
  onQuestionChange: (updates: Partial<Question>) => void;
  onFileUpload: (files: FileList) => void;
  validationErrors: ValidationErrors;
  disabled: boolean;
}

// Resultado del hook useCognitiveTaskForm
export interface UseCognitiveTaskFormResult {
  formData: CognitiveTaskFormData;
  cognitiveTaskId: string | null;
  validationErrors: ValidationErrors;
  isLoading: boolean;
  isSaving: boolean;
  modalError: ErrorModalData | null;
  modalVisible: boolean;
  isAddQuestionModalOpen: boolean;
  questionTypes: QuestionTypeInfo[];
  
  // Métodos de gestión
  handleQuestionChange: (questionId: string, updates: Partial<Question>) => void;
  handleAddChoice: (questionId: string) => void;
  handleRemoveChoice: (questionId: string, choiceId: string) => void;
  handleFileUpload: (questionId: string, files: FileList) => void;
  handleAddQuestion: (type: QuestionType) => void;
  handleRandomizeChange: (checked: boolean) => void;
  openAddQuestionModal: () => void;
  closeAddQuestionModal: () => void;
  
  // Métodos de acción
  handleSave: () => void;
  handlePreview: () => void;
  validateForm: () => boolean;
  closeModal: () => void;
}

// Constantes por defecto

// Plantilla por defecto para un nuevo cognitiveTask
export const DEFAULT_COGNITIVE_TASK: CognitiveTaskFormData = {
  questions: [],
  randomizeQuestions: false
}; 