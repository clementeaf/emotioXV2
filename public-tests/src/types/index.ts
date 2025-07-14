// Exportar todos los tipos desde un lugar centralizado
// Re-exportar common.types con específicas para evitar conflictos
export * from './cognitive-task.types';
export type {
    APIResponse, AppLayoutProps, BasicEmoji, ButtonProps, CardContentProps, CardDescriptionProps, CardFooterProps, CardHeaderProps, CardProps, CardTitleProps, CharacterCounterProps, CheckboxGroupProps, ChoiceOption, ResponseData as CommonResponseData, DemographicDataPayload, ErrorDisplayProps, ErrorScreenProps, EyeTrackingDataPoint,
    EyeTrackingTaskProps, FormErrors, FormFieldProps, HeaderProps, LoadingIndicatorProps, LoadingScreenProps, Logger, LoginFormProps, LoginFormState, Participant, ParticipantRegistration, ProgressBarProps, ProgressSidebarProps, RadioButtonGroupProps, SidebarProps, StarRatingProps, Step, StepDefinition, TextAreaFieldProps, ThankYouScreenProps, WelcomeScreenProps
} from './common.types';
export * from './hooks.types';

// Re-exportar tipos específicos para evitar conflictos
export type {
    Answers, NPSViewProps, SmartVOCConfig, SmartVOCFormData, SmartVOCHandlerProps as SmartVOCHandlerPropsType, SmartVOCQuestion as SmartVOCQuestionType, SmartVOCSettings, SmartVocFeedbackQuestionProps
} from './smart-voc.types';

export type {
    ApiDemographicQuestion,
    ApiDemographicQuestions, CognitiveTaskHandlerProps,
    CurrentStepProps,
    CurrentStepRendererProps, DemographicStepProps, ExpandedStep as ExpandedStepType, ExtendedEyeTrackingData, Step as FlowStep, FlowStepContentProps, LineaScaleQuestionProps, LongTextQuestionProps, MappedStepComponentProps,
    MultipleChoiceQuestionProps, ResponsesData, ResponsesViewerProps, ShortTextQuestionProps, SingleChoiceQuestionProps, UseFlowBuilderProps, WelcomeScreenHandlerProps, WelcomeStepConfig
} from './flow.types';

// Re-exportar tipos existentes sin conflictos
export * from './demographics';

// Re-exportar tipos de store con aliases específicos para evitar conflictos
export type {
    ModuleResponse, ParticipantInfo,
    ParticipantState, ExpandedStep as StoreExpandedStep, ResponsesData as StoreResponsesData
} from './store.types';
