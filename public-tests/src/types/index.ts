// Exportar todos los tipos desde un lugar centralizado
// Re-exportar common.types con específicas para evitar conflictos
export type {
  StarRatingProps,
  ProgressBarProps,
  LoadingScreenProps,
  ThankYouScreenProps,
  FormFieldProps,
  TextAreaFieldProps,
  CheckboxGroupProps,
  CharacterCounterProps,
  AppLayoutProps,
  HeaderProps,
  SidebarProps,
  ProgressSidebarProps,
  Step,
  ErrorScreenProps,
  APIResponse,
  ParticipantRegistration,
  LoginFormState,
  FormErrors,
  EyeTrackingDataPoint,
  EyeTrackingTaskProps,
  WelcomeScreenProps,
  ErrorDisplayProps,
  LoadingIndicatorProps,
  ChoiceOption,
  BasicEmoji,
  RadioButtonGroupProps,
  ResponseData as CommonResponseData,
  StepDefinition,
  DemographicDataPayload,
  Logger,
  Participant,
  LoginFormProps,
  CardProps,
  CardHeaderProps,
  CardTitleProps,
  CardDescriptionProps,
  CardContentProps,
  CardFooterProps,
  ButtonProps
} from './common.types';
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

// Re-exportar tipos de store con aliases específicos para evitar conflictos
export type {
  ModuleResponse,
  ResponsesData as StoreResponsesData,
  ExpandedStep as StoreExpandedStep,
  ParticipantInfo,
  ParticipantState
} from './store.types'; 