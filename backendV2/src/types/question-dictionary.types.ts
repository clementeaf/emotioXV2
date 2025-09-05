/**
 * 🚀 EmotioXV2 Backend - Tipos para Question Dictionary
 * 
 * Tipos específicos para el diccionario de preguntas y formularios
 * 
 * ❌ PROHIBIDO usar tipos 'any' o 'unknown' 
 * ✅ OBLIGATORIO usar tipos específicos siempre
 */

import { QuestionModule } from '../../../shared/interfaces/question-dictionary.interface';

// =====================================
// 📋 TIPOS DE PREGUNTA
// =====================================
export interface BaseQuestion {
  id?: string;
  module?: QuestionModule;
  type?: string;
  title?: string;
  description?: string;
  placeholder?: string;
  labels?: string[];
  images?: string[];
  hitzones?: HitZone[];
  config?: QuestionConfig;
  renderComponent?: string;
}

export interface ProcessedQuestion extends BaseQuestion {
  questionId?: string;
  name?: string;
}

export interface HitZone {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  label: string;
}

export interface QuestionConfig {
  type?: string;
  required?: boolean;
  minValue?: number;
  maxValue?: number;
  scale?: number;
  options?: QuestionOption[];
  validation?: ValidationRule[];
  styling?: StylingConfig;
}

export interface QuestionOption {
  id: string;
  label: string;
  value: string | number;
  description?: string;
}

export interface ValidationRule {
  type: 'required' | 'minLength' | 'maxLength' | 'pattern' | 'range';
  value?: string | number;
  message: string;
}

export interface StylingConfig {
  theme?: string;
  layout?: 'horizontal' | 'vertical' | 'grid';
  columns?: number;
  spacing?: string;
}

// =====================================
// 📄 TIPOS DE FORMULARIO
// =====================================
export interface FormData {
  id?: string;
  questionId?: string;
  name?: string;
  title?: string;
  description?: string;
  module?: QuestionModule;
  type?: string;
  placeholder?: string;
  labels?: string[];
  images?: string[];
  hitzones?: HitZone[];
  config?: QuestionConfig;
  renderComponent?: string;
  questions?: BaseQuestion[];
}

export interface ProcessedForm extends FormData {
  formIndex: number;
  totalQuestions: number;
  processedQuestions: ProcessedQuestion[];
}

// =====================================
// 🔧 TIPOS DE PROCESAMIENTO
// =====================================
export interface QuestionKeyInfo {
  module: string;
  type: string;
  id: string;
}

export interface QuestionProcessor {
  inferModule: (question: BaseQuestion) => QuestionModule;
  inferType: (question: BaseQuestion) => string;
  buildQuestionKey: (module: string, type: string, id: string) => string;
  inferRenderComponent: (type: string, module: string) => string;
}

// =====================================
// 📊 TIPOS DE MAPEO
// =====================================
export interface ModuleTypeMap {
  [key: string]: QuestionModule;
}

export interface ComponentMap {
  [key: string]: string;
}

export const DEFAULT_MODULE_MAP: ModuleTypeMap = {
  'voc': 'smartvoc',
  'cognitive': 'cognitive_task',
  'demographic': 'demographic',
  'eye': 'eye_tracking'
} as const;

export const DEFAULT_COMPONENT_MAP: ComponentMap = {
  'VOC': 'VOCTextQuestion',
  'CSAT': 'CSATView',
  'CES': 'DifficultyScaleView',
  'CV': 'AgreementScaleView',
  'NPS': 'NPSView',
  'NEV': 'EmotionSelectionView',
  'SHORT_TEXT': 'ShortTextQuestion',
  'LONG_TEXT': 'LongTextQuestion',
  'MULTIPLE_CHOICE': 'MultipleChoiceQuestion',
  'RANKING': 'RankingQuestion',
  'LINEAR_SCALE': 'LinearScaleQuestion'
} as const;

// =====================================
// ✅ TIPOS DE VALIDACIÓN
// =====================================
export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
}

export interface ValidationError {
  field: string;
  message: string;
  code: string;
  context?: Record<string, string | number>;
}

export interface ValidationWarning {
  field: string;
  message: string;
  suggestion: string;
  context?: Record<string, string | number>;
}