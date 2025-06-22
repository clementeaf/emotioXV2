import { ReactNode } from 'react';
import { SmartVOCFormData as BaseSmartVOCFormData, SmartVOCQuestion as BaseSmartVOCQuestion } from 'shared/interfaces/smart-voc.interface';

/**
 * Tipos relacionados con el formulario SmartVOC
 */

/**
 * Tipos de pregunta soportados
 */
export type QuestionType = 'CSAT' | 'CES' | 'CV' | 'NEV' | 'NPS' | 'VOC';

/**
 * Tipos de visualización para las preguntas
 */
export type DisplayType = 'stars' | 'numbers' | 'emojis' | 'scale' | 'text';

/**
 * Estructura para la configuración de escala
 */
export interface ScaleRange {
  start: number;
  end: number;
}

/**
 * Estructura para la configuración de pregunta
 */
export interface QuestionConfig {
  type?: DisplayType;
  scaleRange?: ScaleRange;
  companyName?: string;
  startLabel?: string;
  endLabel?: string;
}

/**
 * Extendemos la interfaz base de SmartVOCQuestion
 */
export interface SmartVOCQuestion extends BaseSmartVOCQuestion {
  instructions?: string;
}

/**
 * Valores por defecto para SmartVOC
 */
export const DEFAULT_SMART_VOC_CONFIG = {
  randomize: false,
  requireAnswers: true
};

// Las preguntas por defecto ahora se definen en constants/index.ts para evitar duplicación

/**
 * Extendemos la interfaz base de SmartVOCFormData
 */
export interface SmartVOCFormData extends BaseSmartVOCFormData {
  id?: string;
  researchId: string;
  randomizeQuestions: boolean;
  smartVocRequired: boolean;
  questions: SmartVOCQuestion[];
  metadata?: {
    createdAt: string;
    updatedAt?: string;
    estimatedCompletionTime: string;
  };
}

/**
 * Respuesta de la API para operaciones de SmartVOC
 */
export interface SmartVOCResponse {
  /**
   * Identificador único del formulario guardado
   */
  id?: string;

  /**
   * Datos del formulario
   */
  data: SmartVOCFormData;

  /**
   * Indicador de éxito
   */
  success: boolean;

  /**
   * Mensaje de error si aplica
   */
  error?: string;

  /**
   * Indica si el recurso no fue encontrado
   */
  notFound?: boolean;
}

/**
 * Tipo para datos de error modal
 */
export interface ErrorModalData {
  title: string;
  message: string | ReactNode;
  type: 'error' | 'info' | 'success' | 'warning';
}

/**
 * Props para el componente principal del formulario
 */
export interface SmartVOCFormProps {
  className?: string;
  researchId: string;
  onSave?: (data: SmartVOCFormData) => void;
}

/**
 * Props para el componente de encabezado
 */
export interface SmartVOCHeaderProps {
  title: string;
  description: string;
}

/**
 * Props para el componente de ajustes
 */
export interface SmartVOCSettingsProps {
  randomize: boolean;
  onRandomizeChange: (value: boolean) => void;
  requireAnswers: boolean;
  onRequireAnswersChange: (value: boolean) => void;
  disabled: boolean;
}

/**
 * Props para el componente de preguntas
 */
export interface SmartVOCQuestionsProps {
  questions: SmartVOCQuestion[];
  onUpdateQuestion: (id: string, updates: Partial<SmartVOCQuestion>) => void;
  onAddQuestion: (question: SmartVOCQuestion) => void;
  onRemoveQuestion: (id: string) => void;
  disabled?: boolean;
}

/**
 * Props para el pie de página
 */
export interface SmartVOCFooterProps {
  isSaving: boolean;
  isLoading: boolean;
  smartVocId: string | null;
  researchId: string;
  isExisting: boolean;
  onSave: () => void;
  onPreview?: () => void;
  onDelete?: () => void;
}

/**
 * Props para el componente de modal
 */
export interface ErrorModalProps {
  isOpen: boolean;
  onClose: () => void;
  error: ErrorModalData | null;
  onConfirm?: () => void;
}

/**
 * Estado de validación para el formulario
 */
export interface ValidationErrors {
  [key: string]: string;
}

/**
 * Resultado del hook useSmartVOCForm
 */
export interface UseSmartVOCFormResult {
  questions: SmartVOCQuestion[];
  formData: SmartVOCFormData;
  smartVocId: string | null;
  validationErrors: ValidationErrors;
  isLoading: boolean;
  isSaving: boolean;
  modalError: ErrorModalData | null;
  modalVisible: boolean;
  updateQuestion: (id: string, updates: Partial<SmartVOCQuestion>) => void;
  addQuestion: () => void;
  removeQuestion: (id: string) => void;
  handleSettingChange: (setting: keyof SmartVOCFormData, value: boolean) => void;
  handleSave: () => void;
  handlePreview: () => void;
  validateForm: () => boolean;
  closeModal: () => void;
  showJsonPreview: boolean;
  closeJsonModal: () => void;
  jsonToSend: string;
  pendingAction: 'save' | 'preview' | null;
  continueWithAction: () => void;
}

/**
 * Props para el modal de vista previa JSON
 */
export interface JsonPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  onContinue: () => void;
  jsonData: string;
  pendingAction: 'save' | 'preview' | null;
}
