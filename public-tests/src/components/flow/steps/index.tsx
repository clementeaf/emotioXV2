import React from 'react';
import { CognitiveQuestion } from '../../../types/cognitive-task.types';
import { MappedStepComponentProps, StepComponentMap } from '../../../types/flow.types';
import { SmartVOCQuestion } from '../../../types/smart-voc.types';
import CognitiveNavigationFlowStep from '../../cognitiveTask/CognitiveNavigationFlowStep';
import { LongTextView } from '../../cognitiveTask/questions/LongTextView';

const ParticipantLogin = React.lazy(() => import('../../auth/ParticipantLogin').then(module => ({ default: module.ParticipantLogin })));
const WelcomeScreenHandler = React.lazy(() => import('../WelcomeScreenHandler'));
const CSATView = React.lazy(() => import('../../smartVoc/CSATView'));
const ThankYouView = React.lazy(() => import('../../ThankYouScreen'));
const DifficultyScaleView = React.lazy(() => import('../../smartVoc/DifficultyScaleView'));
const RankingQuestion = React.lazy(() => import('../questions/RankingQuestion').then(module => ({ default: module.RankingQuestion })));
const SmartVocFeedbackQuestion = React.lazy(() => import('../questions/SmartVocFeedbackQuestion').then(module => ({ default: module.SmartVocFeedbackQuestion })));
const LinearScaleQuestion = React.lazy(() => import('../questions/LineaScaleQuestion').then(module => ({ default: module.LineaScaleQuestion })));
const MultipleChoiceQuestion = React.lazy(() => import('../questions/MultipleChoiceQuestion').then(module => ({ default: module.MultipleChoiceQuestion })));
const SingleChoiceQuestion = React.lazy(() => import('../questions/SingleChoiceQuestion').then(module => ({ default: module.SingleChoiceQuestion })));
const DemographicStep = React.lazy(() => import('../questions/DemographicStep').then(module => ({ default: module.DemographicStep })));
const NPSView = React.lazy(() => import('../../smartVoc/NPSView'));

// eslint-disable-next-line react-refresh/only-export-components
const DifficultyScaleAdapter: React.FC<MappedStepComponentProps> = (props) => {
  const { stepConfig, researchId, stepType, stepId, onStepComplete, stepName } = props;

  if (!stepConfig) {
    console.error(`[DifficultyScaleAdapter] stepConfig no está definido para el paso. StepID: ${stepId || 'N/A'}, Type: ${stepType}, Name: ${stepName || 'N/A'}`);
    return (
      <div className="bg-white p-8 rounded-lg shadow-md max-w-lg w-full text-center">
        <h2 className="text-xl font-medium mb-3 text-neutral-700">Error de Configuración</h2>
        <p className="text-neutral-600 mb-4">
          La configuración para este paso ({stepName || stepType}) no se pudo cargar.
        </p>
        <p className="text-sm text-neutral-500">Por favor, revisa la configuración de la investigación o contacta al soporte.</p>
      </div>
    );
  }

  const moduleTypeParts = stepType.split('_');
  const moduleIdForComponent = moduleTypeParts.length > 1 && moduleTypeParts[0] === 'smartvoc'
    ? moduleTypeParts[1]
    : stepId || 'unknown_module';

  return (
    <DifficultyScaleView
      questionConfig={stepConfig as SmartVOCQuestion}
      researchId={researchId || ''}
      moduleId={moduleIdForComponent}
      onNext={(data) => onStepComplete(data)}
    />
  );
};

// eslint-disable-next-line react-refresh/only-export-components
const InstructionStep: React.FC<MappedStepComponentProps> = ({ stepConfig, onStepComplete, isInstructionMock }) => {
    const config = isInstructionMock ? { title: 'Instrucciones (Prueba)', text: 'Texto de instrucciones de prueba.' } : (stepConfig as { title?: string; text?: string } | undefined) || {};
    return (
        <div className="bg-white p-8 rounded-lg shadow-md max-w-lg">
            <h1 className="text-2xl font-semibold mb-4 text-neutral-800">{config.title}</h1>
            <p className="text-neutral-600 mb-6">{config.text}</p>
            <button type="button" onClick={() => onStepComplete?.()} className="bg-primary-600 hover:bg-primary-700 text-white font-medium py-2 px-6 rounded-lg transition-colors">
                Continuar
            </button>
        </div>
    );
};

// eslint-disable-next-line react-refresh/only-export-components
const CognitiveNavigationFlowStepAdapter: React.FC<MappedStepComponentProps> = (props) => {
  // Si props.stepConfig es una pregunta individual, envolverla en { questions: [...] }
  const config = Array.isArray((props.stepConfig as any)?.questions)
    ? props.stepConfig as { questions: any[] }
    : { questions: [props.stepConfig] };
  console.log('[CognitiveNavigationFlowStepAdapter] config usado:', config);
  return (
    <CognitiveNavigationFlowStep
      config={config}
      onContinue={props.onStepComplete}
    />
  );
};

// eslint-disable-next-line react-refresh/only-export-components
const CognitivePreferenceTestStep: React.FC<MappedStepComponentProps> = ({ stepConfig, stepName, stepType, onStepComplete }) => {
    const cfg = (typeof stepConfig === 'object' && stepConfig !== null) ? (stepConfig as { title?: string; questionText?: string; description?: string }) : {};
    const questionText = cfg.questionText || 'Realice el siguiente test de preferencia (Prueba)';
    return (
        <div className="bg-white p-8 rounded-lg shadow-md max-w-xl w-full text-center">
            <h2 className="text-xl font-medium mb-1 text-neutral-800">{cfg.title || stepName || 'Test de Preferencia'}</h2>
            {cfg.description && <p className="text-sm text-neutral-500 mb-3">{cfg.description}</p>}
            <p className="text-neutral-600 mb-4">{questionText}</p>
            <div className="border border-dashed border-neutral-300 p-4 rounded-md mb-6 min-h-[150px] flex items-center justify-center text-neutral-400">
                 (Placeholder: Vista para Test de Preferencia - tipo '{stepType}' no implementado)
            </div>
            <button type="button" onClick={() => onStepComplete?.({})} className="bg-primary-600 hover:bg-primary-700 text-white font-medium py-2 px-6 rounded-lg transition-colors">
                Siguiente
            </button>
        </div>
    );
};

// eslint-disable-next-line react-refresh/only-export-components
const CognitiveLongTextAdapter: React.FC<MappedStepComponentProps> = ({ stepConfig, onStepComplete }) => {
  return (
    <LongTextView
      config={stepConfig as CognitiveQuestion}
      onStepComplete={onStepComplete}
    />
  );
};

export const stepComponentMap: StepComponentMap = {
    'login': ParticipantLogin,
    'welcome': WelcomeScreenHandler,
    'instruction': InstructionStep,
    'cognitive_short_text': SmartVocFeedbackQuestion,
    'cognitive_long_text': CognitiveLongTextAdapter,
    'cognitive_single_choice': SingleChoiceQuestion,
    'cognitive_multiple_choice': MultipleChoiceQuestion,
    'cognitive_linear_scale': LinearScaleQuestion,
    'cognitive_ranking': RankingQuestion,
    'cognitive_navigation_flow': CognitiveNavigationFlowStepAdapter,
    'smartvoc_csat': CSATView,
    'smartvoc_cv': DifficultyScaleAdapter,
    'smartvoc_nev': DifficultyScaleAdapter,
    'smartvoc_feedback': SmartVocFeedbackQuestion,
    'smartvoc_ces': DifficultyScaleAdapter,
    'smartvoc_nps': NPSView,
    'multiple_choice': MultipleChoiceQuestion,
    'single_choice': SingleChoiceQuestion,
    'demographic': DemographicStep,
    'thankyou': ThankYouView,
    'feedback': SmartVocFeedbackQuestion,
    'image_feedback': SmartVocFeedbackQuestion,
    'cognitive_preference_test': CognitivePreferenceTestStep,
};
