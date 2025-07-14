import { QuestionType } from '@shared/interfaces/question-types.enum';
import React from 'react';
import { useStepResponseManager } from '../../../hooks/useStepResponseManager';
import { MappedStepComponentProps, StepComponentMap } from '../../../types/flow.types';
import NavigationFlowTask from '../../cognitiveTask/NavigationFlowTask';
import PreferenceTestTask from '../../cognitiveTask/PreferenceTestTask';
import { LinearScaleView } from '../../cognitiveTask/questions/LinearScaleView';
import { LongTextView } from '../../cognitiveTask/questions/LongTextView';
import { MultiChoiceView } from '../../cognitiveTask/questions/MultiChoiceView';
import { ShortTextView } from '../../cognitiveTask/questions/ShortTextView';
import { SingleChoiceView } from '../../cognitiveTask/questions/SingleChoiceView';
import AgreementScaleView from '../../smartVoc/AgreementScaleView';
import DifficultyScaleView from '../../smartVoc/DifficultyScaleView';

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

  // Construir questionKey combinado correcto
  const combinedQuestionKey = config.id && stepType ? `${config.id}_${stepType}` : questionKey;

  // Usar useStepResponseManager igual que los componentes SmartVOC
  const {
    responseData,
    isSaving,
    isLoading,
    error,
    saveCurrentStepResponse,
    hasExistingData
  } = useStepResponseManager<string>({
    stepId: combinedQuestionKey || config.id,
    stepType,
    stepName,
    initialData: savedResponse as string | null | undefined,
    questionKey: combinedQuestionKey
  });

  // Handler para cambio de valor
  const handleChange = (_questionId: string, value: string) => {
    // El valor se maneja internamente por el hook
  };

  // Handler para submit (igual que SmartVOC)
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
      stepConfig={config}
      onStepComplete={onStepComplete}
      savedResponse={responseData}
      questionKey={config.id} // Solo el id
      stepType={stepType}
      researchId=""
      participantId=""
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
      stepConfig={{ ...config, options }} // <-- Pasar stepConfig con options adaptado
      onStepComplete={onStepComplete}
      savedResponse={responseData}
      questionKey={questionKey}
      stepType={stepType}
      researchId=""
      participantId=""
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
      stepConfig={{ ...config, options }} // <-- Pasar stepConfig con options adaptado
      onStepComplete={onStepComplete}
      savedResponse={responseData}
      questionKey={questionKey}
      stepType={stepType}
      researchId=""
      participantId=""
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
      stepConfig={config}
      onStepComplete={onStepComplete}
      savedResponse={responseData}
      questionKey={questionKey}
      stepType={stepType}
      researchId=""
      participantId=""
    />
  );
};

// Adaptador para NavigationFlowTask
const CognitiveNavigationFlowAdapter: React.FC<MappedStepComponentProps> = (props) => {
  let { stepConfig, ...rest } = props;

  // Si stepConfig es un objeto plano de navigation_flow, lo envolvemos en questions[]
  if (
    stepConfig &&
    typeof stepConfig === 'object' &&
    (!('questions' in stepConfig) || !Array.isArray(stepConfig.questions)) &&
    (stepConfig.type === 'navigation_flow' || stepConfig.type === 'cognitive_navigation_flow')
  ) {
    stepConfig = { questions: [stepConfig] };
  }

  return (
    <NavigationFlowTask
      stepConfig={stepConfig}
      {...rest}
    />
  );
};

export const stepComponentMap: StepComponentMap = {
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
