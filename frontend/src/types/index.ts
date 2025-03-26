/**
 * Archivo central para exportar todas las interfaces de formularios desde el directorio shared.
 * Este enfoque proporciona un único punto de importación para todos los componentes del frontend,
 * facilitando el mantenimiento y la coherencia de tipos.
 */

// Interfaces de investigación
// Enums exportados normalmente
export {
  ResearchType,
  ResearchStatus,
  ResearchStage
} from 'shared/interfaces/research.interface';

// Interfaces y tipos exportados como tipos
export type {
  ResearchConfig,
  ResearchValidation,
  ResearchRecord,
  ResearchFormData,
  ResearchUpdate,
  ResearchCreationResponse
} from 'shared/interfaces/research.interface';

// Interfaces de nueva investigación
export {
  DEFAULT_NEW_RESEARCH,
  FORM_STEPS
} from 'shared/interfaces/newResearch.interface';

export type {
  NewResearch
} from 'shared/interfaces/newResearch.interface';

// Interfaces de Pantalla de Bienvenida
export {
  DEFAULT_WELCOME_SCREEN_CONFIG,
  DEFAULT_WELCOME_SCREEN_VALIDATION
} from 'shared/interfaces/welcome-screen.interface';

export type {
  WelcomeScreenConfig,
  WelcomeScreenRecord,
  WelcomeScreenFormData,
  WelcomeScreenUpdate,
  WelcomeScreenValidation
} from 'shared/interfaces/welcome-screen.interface';

// Interfaces de SmartVOC
export {
  DEFAULT_SMART_VOC_FORM
} from 'shared/interfaces/smart-voc.interface';

export type {
  QuestionConfigBase,
  CSATConfig,
  CESConfig,
  CVConfig,
  NEVConfig, 
  NPSConfig,
  VOCConfig,
  QuestionConfig,
  SmartVOCQuestion,
  ConditionalLogic,
  SmartVOCFormData,
  SmartVOCFormResponse
} from 'shared/interfaces/smart-voc.interface';

// Interfaces de Eye Tracking
// Constantes y valores por defecto
export {
  EYE_TRACKING_VALIDATION,
  DEFAULT_EYE_TRACKING_CONFIG,
  // Exportamos los tipos como parte del namespace
  type TrackingDeviceType,
  type PresentationSequenceType
} from 'shared/interfaces/eye-tracking.interface';

// Type aliases exportados como tipos
export type {
  EyeTrackingConfig,
  EyeTrackingStimulus,
  EyeTrackingAreaOfInterest,
  EyeTrackingStimuliConfig,
  EyeTrackingAreaOfInterestConfig,
  EyeTrackingFormData,
  EyeTrackingModel,
  EyeTrackingFormResponse
} from 'shared/interfaces/eye-tracking.interface';

// Interfaces de Pantalla de Agradecimiento
export {
  DEFAULT_THANK_YOU_SCREEN_CONFIG,
  DEFAULT_THANK_YOU_SCREEN_VALIDATION
} from 'shared/interfaces/thank-you-screen.interface';

export type {
  ThankYouScreenConfig,
  ThankYouScreenModel,
  ThankYouScreenFormData,
  ThankYouScreenResponse
} from 'shared/interfaces/thank-you-screen.interface'; 