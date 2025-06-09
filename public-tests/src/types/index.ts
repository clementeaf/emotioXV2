// Exportar todos los tipos desde un lugar centralizado
export * from './common.types';
export * from './cognitive-task.types';
export * from './hooks.types';

// Re-exportar tipos específicos para evitar conflictos
export type {
  SmartVOCQuestion as SmartVOCQuestionType,
  SmartVOCFormData,
  SmartVOCConfig,
  SmartVOCSettings,
  Answers,
  SmartVOCHandlerProps as SmartVOCHandlerPropsType,
  NPSViewProps,
  SmartVocFeedbackQuestionProps,
  UseSmartVOCDataReturn
} from './smart-voc.types';

export type {
  ExpandedStep as ExpandedStepType,
  Step as FlowStep,
  CognitiveTaskHandlerProps,
  CurrentStepProps,
  CurrentStepRendererProps,
  FlowStepContentProps,
  WelcomeStepConfig,
  WelcomeScreenHandlerProps,
  MappedStepComponentProps,
  MultipleChoiceQuestionProps,
  SingleChoiceQuestionProps,
  LongTextQuestionProps,
  ShortTextQuestionProps,
  LineaScaleQuestionProps,
  ResponsesData,
  UseFlowBuilderProps,
  UseFlowNavigationAndStateProps,
  ApiDemographicQuestion,
  ApiDemographicQuestions,
  DemographicStepProps,
  ExtendedEyeTrackingData,
  ResponsesViewerProps
} from './flow.types';

// Re-exportar tipos existentes sin conflictos
export * from './demographics'; 