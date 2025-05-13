import React from 'react';
import imageUrl from '../../../assets/nav_flow_img.png';

const ParticipantLogin = React.lazy(() => import('../../auth/ParticipantLogin').then(module => ({ default: module.ParticipantLogin })));
const WelcomeScreenHandler = React.lazy(() => import('../WelcomeScreenHandler'));
const CSATView = React.lazy(() => import('../../smartVoc/CSATView'));
const ThankYouView = React.lazy(() => import('../../ThankYouScreen'));
const DifficultyScaleView = React.lazy(() => import('../../smartVoc/DifficultyScaleView'));
const NPSView = React.lazy(() => import('../../smartVoc/NPSView'));
const RankingQuestion = React.lazy(() => import('../questions/RankingQuestion').then(module => ({ default: module.RankingQuestion })));
const SmartVocFeedbackQuestion = React.lazy(() => import('../questions/SmartVocFeedbackQuestion').then(module => ({ default: module.SmartVocFeedbackQuestion })));
const LinearScaleQuestion = React.lazy(() => import('../questions/LineaScaleQuestion').then(module => ({ default: module.LinearScaleQuestion })));
const MultipleChoiceQuestion = React.lazy(() => import('../questions/MultipleChoiceQuestion').then(module => ({ default: module.MultipleChoiceQuestion })));
const SingleChoiceQuestion = React.lazy(() => import('../questions/SingleChoiceQuestion').then(module => ({ default: module.SingleChoiceQuestion })));
const LongTextQuestion = React.lazy(() => import('../questions/LongTextQuestion').then(module => ({ default: module.LongTextQuestion })));
const DemographicStep = React.lazy(() => import('../questions/DemographicStep').then(module => ({ default: module.DemographicStep })));

export interface MappedStepComponentProps {
    stepConfig?: any; // Configuración específica del paso, puede variar
    stepId?: string; // ID único del paso actual
    stepName?: string; // Nombre descriptivo del paso
    stepType: string; // Tipo de paso (ej. 'instruction', 'cognitive_short_text')
    researchId?: string; // ID de la investigación
    token?: string | null; // MODIFICADO: Permitir null para token
    onStepComplete: (data?: any) => void; // Función a llamar cuando el paso se completa
    onLoginSuccess?: (participant: any) => void; // MODIFICADO: Ajustar firma para coincidir con uso real
    onError?: (message: string, stepType?: string) => void; // Para reportar errores
    // Podríamos añadir más props comunes si es necesario, ej. participantId
    isInstructionMock?: boolean;
    isWelcomeMock?: boolean;
    isApiDisabled?: boolean;
    // ... otras props que puedan ser comunes o necesarias para los adaptadores
}

const InstructionStep: React.FC<MappedStepComponentProps> = ({ stepConfig, onStepComplete, isInstructionMock }) => {
    const config = isInstructionMock ? { title: 'Instrucciones (Prueba)', text: 'Texto de instrucciones de prueba.' } : stepConfig;
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

const CognitiveNavigationFlowStep: React.FC<MappedStepComponentProps> = ({ stepConfig, stepName, onStepComplete }) => {
    const hasQuestion = stepConfig && typeof stepConfig.questionText === 'string' && stepConfig.questionText.trim() !== '';
    const description = stepConfig?.description;
    const deviceFrame = stepConfig?.deviceFrame;
    const isMock = !hasQuestion;
    const title = stepConfig?.title || stepName || (isMock ? 'Flujo de Navegación (Prueba)' : 'Flujo de Navegación');
    const questionToDisplay = hasQuestion ? stepConfig.questionText : 'Realice la siguiente tarea de navegación (Prueba).';
    return (
        <div className="bg-white p-8 rounded-lg shadow-md max-w-2xl w-full">
            <h2 className="text-xl font-medium mb-1 text-neutral-800">A continuación, verás las pantallas de la nueva APP, porfavor, navega por las imágenes y completa el proceso de darte de alta. Tus datos son simulados.</h2>
            <p className="text-sm text-neutral-500 mb-3">Da clic en la imagen para realizar las instrucciones o completar la prueba</p>
            <div className={`mb-6 border rounded-md ${imageUrl ? '' : 'flex items-center justify-center text-neutral-400'} ${deviceFrame ? 'bg-gray-200' : ''}`}>
                {imageUrl ? (
                    <img 
                        src={imageUrl} 
                        alt="Simulación de navegación" 
                        className={`object-contain ${deviceFrame ? 'rounded-md shadow-lg' : ''}`}
                    />
                ) : (
                    <p>Simulación de Navegación (Imagen no configurada)</p>
                )}
            </div>
            <button type="button" onClick={() => onStepComplete?.({})} className="bg-primary-600 hover:bg-primary-700 text-white font-medium py-2 px-6 rounded-lg transition-colors">Siguiente</button>
        </div>
    );
};

const CognitivePreferenceTestStep: React.FC<MappedStepComponentProps> = ({ stepConfig, stepName, stepType, onStepComplete }) => {
    const title = stepConfig?.title || stepName || 'Test de Preferencia';
    const questionText = stepConfig?.questionText || 'Realice el siguiente test de preferencia (Prueba)';
    const description = stepConfig?.description;
    return (
        <div className="bg-white p-8 rounded-lg shadow-md max-w-xl w-full text-center">
            <h2 className="text-xl font-medium mb-1 text-neutral-800">{title}</h2>
            {description && <p className="text-sm text-neutral-500 mb-3">{description}</p>}
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

const SmartVocCvStep: React.FC<MappedStepComponentProps> = ({ stepConfig, stepName, onStepComplete }) => {
    const isMock = !stepConfig || !stepConfig.questionText;
    const config = isMock ? { questionText: 'Pregunta Customer Value (Prueba)?' } : stepConfig;
    return (
        <div className="bg-white p-8 rounded-lg shadow-md max-w-lg w-full text-center">
            <h2 className="text-xl font-medium mb-3 text-neutral-700">{stepName || 'Valor Percibido'}</h2>
            <p className="text-neutral-600 mb-4">{config.questionText}</p>
            <p className="text-sm text-neutral-500">(Placeholder: Vista para Customer Value)</p>
            <button type="button" onClick={() => onStepComplete?.({})} className="mt-4 bg-primary-600 hover:bg-primary-700 text-white font-medium py-2 px-6 rounded-lg transition-colors">Siguiente</button>
        </div>
    );
};

const SmartVocNevStep: React.FC<MappedStepComponentProps> = ({ stepConfig, stepName, onStepComplete }) => {
    const isMock = !stepConfig || !stepConfig.questionText;
    const config = isMock ? { questionText: 'Pregunta NEV (Prueba)?' } : stepConfig;
    return (
        <div className="bg-white p-8 rounded-lg shadow-md max-w-lg w-full text-center">
            <h2 className="text-xl font-medium mb-3 text-neutral-700">{stepName || 'Valor Emocional Neto'}</h2>
            <p className="text-neutral-600 mb-4">{config.questionText}</p>
            <p className="text-sm text-neutral-500">(Placeholder: Vista para NEV)</p>
            <button type="button" onClick={() => onStepComplete?.({})} className="mt-4 bg-primary-600 hover:bg-primary-700 text-white font-medium py-2 px-6 rounded-lg transition-colors">Siguiente</button>
        </div>
    );
};

type StepComponentType = React.LazyExoticComponent<React.ComponentType<any>> | React.FC<MappedStepComponentProps>; // Usamos 'any' temporalmente para LazyExoticComponent

interface StepComponentMap {
    [key: string]: StepComponentType;
}

export const stepComponentMap: StepComponentMap = {
    'login': ParticipantLogin,
    'welcome': WelcomeScreenHandler,
    'instruction': InstructionStep,
    'cognitive_short_text': SmartVocFeedbackQuestion,
    'cognitive_long_text': LongTextQuestion,
    'cognitive_single_choice': SingleChoiceQuestion,
    'cognitive_multiple_choice': MultipleChoiceQuestion,
    'cognitive_linear_scale': LinearScaleQuestion,
    'cognitive_ranking': RankingQuestion,
    'cognitive_navigation_flow': CognitiveNavigationFlowStep,
    'smartvoc_csat': CSATView,
    'smartvoc_cv': SmartVocCvStep,
    'smartvoc_nps': NPSView,
    'smartvoc_nev': SmartVocNevStep,
    'smartvoc_feedback': SmartVocFeedbackQuestion,
    'smartvoc_ces': DifficultyScaleView,
    'thankyou': ThankYouView,
    'demographic': DemographicStep,
    'cognitive_preference_test': CognitivePreferenceTestStep,
};

export {
    ParticipantLogin,
    WelcomeScreenHandler,
    CSATView,
    ThankYouView,
    DifficultyScaleView,
    NPSView,
    RankingQuestion,
    SmartVocFeedbackQuestion,
    LinearScaleQuestion,
    MultipleChoiceQuestion,
    SingleChoiceQuestion,
    LongTextQuestion,
    DemographicStep,
    InstructionStep,
    CognitiveNavigationFlowStep,
    CognitivePreferenceTestStep,
    SmartVocCvStep,
    SmartVocNevStep
}; 