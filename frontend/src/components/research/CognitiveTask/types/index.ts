/**
 * Definiciones de tipos para el componente CognitiveTask
 * Importamos los tipos base desde la interfaz compartida
 */

import React from 'react';
import { 
  QuestionType,
  Question as BaseQuestion,
  Choice,
  ScaleConfig,
  UploadedFile,
  HitZone,
  CognitiveTaskFormData,
  CognitiveTaskFormResponse,
  CognitiveTaskModel,
  DEFAULT_COGNITIVE_TASK,
  QUESTION_TYPES_INFO,
  QUESTION_TEMPLATES
} from 'shared/interfaces/cognitive-task.interface';

// Extendemos la interfaz Question para incluir propiedades adicionales
export interface Question extends BaseQuestion {
  answerPlaceholder?: string;  // Placeholder para el campo de respuesta
}

// Re-exportamos los tipos importados para mantener compatibilidad
export type { 
  QuestionType,
  Choice,
  ScaleConfig,
  UploadedFile,
  HitZone,
  CognitiveTaskFormData,
  CognitiveTaskFormResponse,
  CognitiveTaskModel
};

// Re-exportamos las constantes
export {
  DEFAULT_COGNITIVE_TASK,
  QUESTION_TYPES_INFO,
  QUESTION_TEMPLATES
};

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
  researchId?: string;
  onSave: () => void;
  onPreview: () => void;
  onDelete: () => void;
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
  onMultipleFilesUpload?: (questionId: string, files: FileList) => void;
  onFileDelete?: (questionId: string, fileId: string) => void;
  disabled: boolean;
  validationErrors: ValidationErrors;
  isUploading?: boolean;
  uploadProgress?: number;
  currentFileIndex?: number;
  totalFiles?: number;
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
  onMultipleFilesUpload?: (files: FileList) => void;
  onFileDelete?: (fileId: string) => void;
  validationErrors: ValidationErrors;
  disabled: boolean;
  isUploading?: boolean;
  uploadProgress?: number;
  currentFileIndex?: number;
  totalFiles?: number;
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
  isUploading: boolean;
  uploadProgress: number;
  currentFileIndex: number;
  totalFiles: number;
  questionTypes: QuestionTypeInfo[];
  
  // Métodos de gestión
  handleQuestionChange: (questionId: string, updates: Partial<Question>) => void;
  handleAddChoice: (questionId: string) => void;
  handleRemoveChoice: (questionId: string, choiceId: string) => void;
  handleFileUpload: (questionId: string, files: FileList) => void;
  handleMultipleFilesUpload: (questionId: string, files: FileList) => void;
  handleFileDelete: (questionId: string, fileId: string) => void;
  handleAddQuestion: (type: QuestionType) => void;
  handleRandomizeChange: (checked: boolean) => void;
  openAddQuestionModal: () => void;
  closeAddQuestionModal: () => void;
  
  // Métodos de acción
  handleSave: () => void;
  handlePreview: () => void;
  handleDelete: () => void;
  validateForm: () => boolean;
  closeModal: () => void;
  initializeDefaultQuestions: (defaultQuestions: Question[]) => void;
  
  // Nuevas propiedades para el modal JSON
  showJsonPreview: boolean;
  closeJsonModal: () => void;
}

export interface CognitiveTaskFieldsProps {
  questions: Question[];
  randomizeQuestions: boolean;
  onQuestionChange: (questionId: string, updates: Partial<Question>) => void;
  onAddChoice: (questionId: string) => void;
  onRemoveChoice: (questionId: string, choiceId: string) => void;
  onFileUpload: (questionId: string, files: FileList) => void;
  onRemoveFile: (questionId: string, fileId: string) => void;
  setRandomizeQuestions: (checked: boolean) => void;
  onAddQuestion: (type: QuestionType) => void;
  disabled: boolean;
  isUploading?: boolean;
  uploadProgress?: number;
  FileItemComponent?: React.ComponentType<any>;
  FileUploaderComponent?: React.ComponentType<any>;
} 