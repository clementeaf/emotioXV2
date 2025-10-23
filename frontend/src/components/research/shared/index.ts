// Hook genérico
export { useDynamicQuestionForm } from './hooks/useDynamicQuestionForm';
export type { 
  ModuleType, 
  QuestionType, 
  QuestionField, 
  QuestionTypeConfig, 
  DynamicQuestion, 
  DynamicFormData, 
  UseDynamicQuestionFormResult 
} from './hooks/useDynamicQuestionForm';

// Componentes genéricos
export { DynamicQuestionForm } from './components/DynamicQuestionForm';
export { DynamicQuestionRenderer } from './components/DynamicQuestionRenderer';
export { AddQuestionModal } from './components/AddQuestionModal';

// Schema
export { questionSchema } from './schema';