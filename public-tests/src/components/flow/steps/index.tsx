import React from 'react';
import { useStepResponseManager } from '../../../hooks/useStepResponseManager';
import { MappedStepComponentProps, StepComponentMap } from '../../../types/flow.types';
import { QuestionType } from '../../../types/question-types.enum';
import NavigationFlowTask from '../../cognitiveTask/NavigationFlowTask';
import PreferenceTestTask from '../../cognitiveTask/PreferenceTestTask';
import { LinearScaleView } from '../../cognitiveTask/questions/LinearScaleView';
import { LongTextView } from '../../cognitiveTask/questions/LongTextView';
import { MultiChoiceView } from '../../cognitiveTask/questions/MultiChoiceView';
import { ShortTextView } from '../../cognitiveTask/questions/ShortTextView';
import { SingleChoiceView } from '../../cognitiveTask/questions/SingleChoiceView';
import AgreementScaleView from '../../smartVoc/AgreementScaleView';
import DifficultyScaleView from '../../smartVoc/DifficultyScaleView';

const ParticipantLogin = React.lazy(() => import('../../auth/ParticipantLogin').then(module => ({ default: module.ParticipantLogin })));
const WelcomeScreenHandler = React.lazy(() => import('../WelcomeScreenHandler'));
const CSATView = React.lazy(() => import('../../smartVoc/CSATView'));
const ThankYouView = React.lazy(() => import('../../ThankYouScreen'));
const RankingQuestion = React.lazy(() => import('../questions/RankingQuestion').then(module => ({ default: module.RankingQuestion })));
const SmartVocFeedbackQuestion = React.lazy(() => import('../questions/SmartVocFeedbackQuestion').then(module => ({ default: module.SmartVocFeedbackQuestion })));
const MultipleChoiceQuestion = React.lazy(() => import('../questions/MultipleChoiceQuestion').then(module => ({ default: module.MultipleChoiceQuestion })));
const SingleChoiceQuestion = React.lazy(() => import('../questions/SingleChoiceQuestion').then(module => ({ default: module.SingleChoiceQuestion })));
const ShortTextQuestion = React.lazy(() => import('../questions/ShortTextQuestion').then(module => ({ default: module.ShortTextQuestion })));
const DemographicStep = React.lazy(() => import('../questions/DemographicStep').then(module => ({ default: module.DemographicStep })));
const NPSView = React.lazy(() => import('../../smartVoc/NPSView'));
const EmotionSelectionView = React.lazy(() => import('../../smartVoc/EmotionSelectionView'));

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

// NUEVO: Adaptadores para componentes de Cognitive Tasks
const CognitiveShortTextAdapter: React.FC<MappedStepComponentProps> = (props) => {
  const { stepConfig, onStepComplete, questionKey, savedResponse } = props;

  const config = stepConfig as any;
  const stepType = config.type || 'cognitive_short_text';
  const stepName = config.title || 'Pregunta corta';

  const {
    responseData,
    isSaving,
    isLoading,
    error,
    saveCurrentStepResponse,
    hasExistingData
  } = useStepResponseManager<string>({
    stepId: questionKey || config.id,
    stepType,
    stepName,
    initialData: savedResponse as string | null | undefined,
    questionKey
  });

  // Handler para cambio de valor
  const handleChange = (_questionId: string, value: string) => {
    // El valor se maneja internamente por el hook
  };

  // Handler para submit (firma compatible con onContinue)
  const handleSubmit = async (responseData?: unknown) => {
    const value = typeof responseData === 'string' ? responseData : '';
    const result = await saveCurrentStepResponse(value);
    if (result.success) {
      onStepComplete?.(value);
    }
    // Si falla, el error se muestra por el hook
  };

  return (
    <ShortTextView
      config={config}
      value={typeof responseData === 'string' ? responseData : ''}
      onChange={handleChange}
      questionKey={questionKey}
      onContinue={handleSubmit}
    />
  );
};

const CognitiveSingleChoiceAdapter: React.FC<MappedStepComponentProps> = (props) => {
  const { stepConfig, onStepComplete, questionKey, savedResponse } = props;

  const config = stepConfig as any;
  const stepType = config.type || 'cognitive_single_choice';
  const stepName = config.title || 'Pregunta de opción única';

  // ADAPTAR: Si existe config.choices pero no config.options, crear options
  const options = config.options || (Array.isArray(config.choices)
    ? config.choices.map((c: any) => ({
        id: c.id,
        label: c.text || c.label || c.id,
        isQualify: c.isQualify,
        isDisqualify: c.isDisqualify
      }))
    : []);

  const {
    responseData,
    isSaving,
    isLoading,
    error,
    saveCurrentStepResponse,
    hasExistingData
  } = useStepResponseManager<string>({
    stepId: questionKey || config.id,
    stepType,
    stepName,
    initialData: savedResponse as string | null | undefined,
    questionKey
  });

  // Handler para cambio de valor y submit inmediato
  const handleChange = async (_questionId: string, value: string) => {
    const result = await saveCurrentStepResponse(value);
    if (result.success) {
      onStepComplete?.(value);
    }
    // Si falla, el error se muestra por el hook
  };

  return (
    <SingleChoiceView
      config={{ ...config, options }} // <-- Pasar options adaptado
      value={typeof responseData === 'string' ? responseData : ''}
      onChange={handleChange}
      questionKey={questionKey}
    />
  );
};

const CognitiveMultiChoiceAdapter: React.FC<MappedStepComponentProps> = (props) => {
  const { stepConfig, onStepComplete, questionKey, savedResponse } = props;

  const config = stepConfig as any;
  const stepType = config.type || 'cognitive_multiple_choice';
  const stepName = config.title || 'Pregunta de opción múltiple';

  // ADAPTAR: Si existe config.choices pero no config.options, crear options
  const options = config.options || (Array.isArray(config.choices)
    ? config.choices.map((c: any) => ({
        id: c.id,
        label: c.text || c.label || c.id,
        isQualify: c.isQualify,
        isDisqualify: c.isDisqualify
      }))
    : []);

  const {
    responseData,
    isSaving,
    isLoading,
    error,
    saveCurrentStepResponse,
    hasExistingData
  } = useStepResponseManager<string[]>({
    stepId: questionKey || config.id,
    stepType,
    stepName,
    initialData: savedResponse as string[] | null | undefined,
    questionKey
  });

  // Handler para cambio de valor y submit inmediato
  const handleChange = async (_questionId: string, value: string[]) => {
    const result = await saveCurrentStepResponse(value);
    if (result.success) {
      onStepComplete?.(value);
    }
    // Si falla, el error se muestra por el hook
  };

  return (
    <MultiChoiceView
      config={{ ...config, options }} // <-- Pasar options adaptado
      value={Array.isArray(responseData) ? responseData : []}
      onChange={handleChange}
      questionKey={questionKey}
    />
  );
};

const CognitiveLinearScaleAdapter: React.FC<MappedStepComponentProps> = (props) => {
  const { stepConfig, onStepComplete, questionKey, savedResponse } = props;

  const config = stepConfig as any;
  const stepType = config.type || 'cognitive_linear_scale';
  const stepName = config.title || 'Pregunta de escala lineal';

  const {
    responseData,
    saveCurrentStepResponse,
  } = useStepResponseManager<number | undefined>({
    stepId: questionKey || config.id,
    stepType,
    stepName,
    initialData: savedResponse as number | undefined,
    questionKey
  });

  // Handler para cambio de valor y submit inmediato
  const handleChange = async (_questionId: string, value: number) => {
    const result = await saveCurrentStepResponse(value);
    if (result.success) {
      onStepComplete?.(value);
    }
    // Si falla, el error se muestra por el hook
  };

  return (
    <LinearScaleView
      config={config}
      value={typeof responseData === 'number' ? responseData : undefined}
      onChange={handleChange}
      questionKey={questionKey}
    />
  );
};

// Adaptador para NavigationFlowTask
const CognitiveNavigationFlowAdapter: React.FC<MappedStepComponentProps> = (props) => {
  const { stepConfig, onStepComplete } = props;
  // Fallback: función vacía si onStepComplete no está definida
  const handleContinue = onStepComplete || (() => {});
  return <NavigationFlowTask config={stepConfig} onContinue={handleContinue} />;
};

export const stepComponentMap: StepComponentMap = {
    'login': ParticipantLogin,
    'welcome': WelcomeScreenHandler,
    'instruction': InstructionStep,

    // Cognitive Tasks usando ENUM QuestionType
    [QuestionType.COGNITIVE_SHORT_TEXT]: CognitiveShortTextAdapter,
    [QuestionType.COGNITIVE_LONG_TEXT]: LongTextView,
    [QuestionType.COGNITIVE_MULTIPLE_CHOICE]: CognitiveMultiChoiceAdapter,
    [QuestionType.COGNITIVE_SINGLE_CHOICE]: CognitiveSingleChoiceAdapter,
    [QuestionType.COGNITIVE_LINEAR_SCALE]: CognitiveLinearScaleAdapter,
    [QuestionType.COGNITIVE_NAVIGATION_FLOW]: CognitiveNavigationFlowAdapter,
    [QuestionType.COGNITIVE_PREFERENCE_TEST]: PreferenceTestTask,
    [QuestionType.COGNITIVE_RATING]: CognitiveLinearScaleAdapter,
    [QuestionType.COGNITIVE_RANKING]: RankingQuestion,

    // SmartVOC usando ENUM QuestionType (solo tipos válidos)
    [QuestionType.SMARTVOC_CSAT]: CSATView,
    [QuestionType.SMARTVOC_CES]: AgreementScaleView,
    [QuestionType.SMARTVOC_CV]: DifficultyScaleView,
    [QuestionType.SMARTVOC_NEV]: EmotionSelectionView,
    [QuestionType.SMARTVOC_NPS]: NPSView,
    [QuestionType.SMARTVOC_VOC]: SmartVocFeedbackQuestion,
    [QuestionType.SMARTVOC_NC]: AgreementScaleView,

    // Demographics usando ENUM QuestionType
    [QuestionType.DEMOGRAPHICS]: DemographicStep,

    // Flow types usando ENUM QuestionType
    [QuestionType.WELCOME_SCREEN]: WelcomeScreenHandler,
    [QuestionType.THANK_YOU_SCREEN]: ThankYouView,
};
