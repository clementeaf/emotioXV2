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
 * Estructura de una pregunta SmartVOC
 */
export interface SmartVOCQuestion {
  id: string;
  type: QuestionType;
  title: string;
  description: string;
  instructions?: string;
  required: boolean;
  showConditionally: boolean;
  config: QuestionConfig;
}

/**
 * Valores por defecto para SmartVOC
 */
export const DEFAULT_SMART_VOC_CONFIG = {
  randomize: false,
  requireAnswers: true
};

/**
 * Preguntas predeterminadas para SmartVOC
 */
export const DEFAULT_QUESTIONS: SmartVOCQuestion[] = [
  {
    id: 'csat',
    type: 'CSAT',
    title: 'Customer Satisfaction Score (CSAT)',
    description: '¿Cómo calificaría su nivel general de satisfacción con [empresa]?',
    instructions: '',
    required: true,
    showConditionally: false,
    config: {
      type: 'stars',
      companyName: ''
    }
  },
  {
    id: 'ces',
    type: 'CES',
    title: 'Customer Effort Score (CES)',
    description: 'Fue fácil para mí resolver mi problema hoy.',
    instructions: '',
    required: true,
    showConditionally: false,
    config: {
      type: 'scale',
      scaleRange: { start: 1, end: 7 }
    }
  },
  {
    id: 'cv',
    type: 'CV',
    title: 'Cognitive Value (CV)',
    description: 'Ejemplo: Esta fue la mejor aplicación que mis ojos han visto.',
    instructions: '',
    required: true,
    showConditionally: false,
    config: {
      type: 'scale',
      scaleRange: { start: 1, end: 7 },
      startLabel: '',
      endLabel: ''
    }
  },
  {
    id: 'nev',
    type: 'NEV',
    title: 'Net Emotional Value (NEV)',
    description: '¿Cómo se siente acerca de la experiencia ofrecida por [empresa]?',
    instructions: '',
    required: true,
    showConditionally: false,
    config: {
      type: 'emojis',
      companyName: ''
    }
  },
  {
    id: 'nps',
    type: 'NPS',
    title: 'Net Promoter Score (NPS)',
    description: 'En una escala de 0-10, ¿qué tan probable es que recomiende [empresa] a un amigo o colega?',
    instructions: '',
    required: true,
    showConditionally: false,
    config: {
      type: 'scale',
      scaleRange: { start: 0, end: 10 },
      companyName: ''
    }
  },
  {
    id: 'voc',
    type: 'VOC',
    title: 'Voice of Customer (VOC)',
    description: '¿Cómo podemos mejorar el servicio?',
    instructions: '',
    required: true,
    showConditionally: false,
    config: {
      type: 'text'
    }
  }
];

/**
 * Datos del formulario SmartVOC
 */
export interface SmartVOCFormData {
  id?: string;
  researchId?: string;
  randomize: boolean;
  requireAnswers: boolean;
  CSAT?: boolean;
  CES?: boolean;
  CV?: boolean;
  NEV?: boolean;
  NPS?: boolean;
  VOC?: boolean;
}

/**
 * Respuesta de la API para operaciones de SmartVOC
 */
export interface SmartVOCResponse {
  data?: SmartVOCFormData;
  error?: boolean;
  message?: string;
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
export interface SmartVOCFormProps {
  className?: string;
  researchId: string;
  onSave?: (data: any) => void;
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
  onAddQuestion: (customQuestion?: SmartVOCQuestion) => void;
  onRemoveQuestion: (id: string) => void;
  disabled: boolean;
}

/**
 * Props para el pie de página
 */
export interface SmartVOCFooterProps {
  isSaving: boolean;
  isLoading: boolean;
  smartVocId: string | null;
  onSave: () => void;
  onPreview?: () => void;
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