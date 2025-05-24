import React, { useState } from 'react';
import imageUrl from '../../../assets/nav_flow_img.png';
import { LongTextView } from '../../cognitiveTask/questions/LongTextView';
import { SmartVOCQuestion } from '../../../types/smart-voc.interface';

const ParticipantLogin = React.lazy(() => import('../../auth/ParticipantLogin').then(module => ({ default: module.ParticipantLogin })));
const WelcomeScreenHandler = React.lazy(() => import('../WelcomeScreenHandler'));
const CSATView = React.lazy(() => import('../../smartVoc/CSATView'));
const ThankYouView = React.lazy(() => import('../../ThankYouScreen'));
const DifficultyScaleView = React.lazy(() => import('../../smartVoc/DifficultyScaleView'));
const RankingQuestion = React.lazy(() => import('../questions/RankingQuestion').then(module => ({ default: module.RankingQuestion })));
const SmartVocFeedbackQuestion = React.lazy(() => import('../questions/SmartVocFeedbackQuestion').then(module => ({ default: module.SmartVocFeedbackQuestion })));
const LinearScaleQuestion = React.lazy(() => import('../questions/LineaScaleQuestion').then(module => ({ default: module.LinearScaleQuestion })));
const MultipleChoiceQuestion = React.lazy(() => import('../questions/MultipleChoiceQuestion').then(module => ({ default: module.MultipleChoiceQuestion })));
const SingleChoiceQuestion = React.lazy(() => import('../questions/SingleChoiceQuestion').then(module => ({ default: module.SingleChoiceQuestion })));
const DemographicStep = React.lazy(() => import('../questions/DemographicStep').then(module => ({ default: module.DemographicStep })));
const NPSView = React.lazy(() => import('../../smartVoc/NPSView'));

export interface MappedStepComponentProps {
    stepConfig?: unknown;
    stepId?: string;
    stepName?: string;
    stepType: string;
    researchId?: string;
    token?: string | null;
    onStepComplete: (data?: unknown) => void;
    onLoginSuccess?: (participant: unknown) => void;
    onError?: (message: string, stepType?: string) => void;
    isInstructionMock?: boolean;
    isWelcomeMock?: boolean;
    isApiDisabled?: boolean;
}

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

const CognitiveNavigationFlowStep: React.FC<MappedStepComponentProps> = ({ stepConfig }) => {
    const cfg = (typeof stepConfig === 'object' && stepConfig !== null) ? (stepConfig as { questionText?: string; description?: string; deviceFrame?: boolean; title?: string }) : {};
    const deviceFrame = cfg.deviceFrame;
    // Coordenadas relativas del hitzone para el botón 'Ir a Depósito Directo'
    const hitzones = [
        {
            id: 'deposito-directo',
            x: 0.783, // Más a la derecha
            y: 0.55, // Más abajo
            width: 0.121, // Más angosto
            height: 0.06, // Más bajo
        }
    ];
    const imageWidth = 747;
    const [modalOpen, setModalOpen] = useState(false);
    return (
        <div className="bg-white p-8 rounded-lg shadow-md max-w-2xl w-full">
            <h2 className="text-xl font-medium mb-1 text-neutral-800">A continuación, verás las pantallas de la nueva APP, porfavor, navega por las imágenes y completa el proceso de darte de alta. Tus datos son simulados.</h2>
            <p className="text-sm text-neutral-500 mb-3">Da clic en la imagen para realizar las instrucciones o completar la prueba</p>
            <div className={`mb-6 border rounded-md relative ${imageUrl ? '' : 'flex items-center justify-center text-neutral-400'} ${deviceFrame ? 'bg-gray-200' : ''}`} style={{ maxWidth: imageWidth, margin: '0 auto' }}>
                {imageUrl ? (
                    <>
                        <img 
                            src={imageUrl} 
                            alt="Simulación de navegación" 
                            className={`object-contain w-full ${deviceFrame ? 'rounded-md shadow-lg' : ''}`}
                            style={{ display: 'block', width: '100%', height: 'auto' }}
                        />
                        {hitzones.map(hz => (
                            <div
                                key={hz.id}
                                style={{
                                    position: 'absolute',
                                    left: `${hz.x * 100}%`,
                                    top: `${hz.y * 100}%`,
                                    width: `${hz.width * 100}%`,
                                    height: `${hz.height * 100}%`,
                                    border: '2px solid #3b82f6',
                                    background: 'rgba(59, 130, 246, 0.25)',
                                    cursor: 'pointer',
                                    borderRadius: 0,
                                    zIndex: 10,
                                    pointerEvents: 'auto',
                                }}
                                onClick={() => setModalOpen(true)}
                                title="Ir a Depósito Directo"
                            />
                        ))}
                        {/* Modal */}
                        {modalOpen && (
                            <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
                                <div className="bg-white rounded-lg shadow-lg p-8 min-w-[320px] max-w-[90vw] text-center animate-fade-in">
                                    {/* Icono animado */}
                                    <div className="flex justify-center mb-4">
                                        <svg className="w-16 h-16 text-green-500 animate-bounce" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                            <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" fill="rgba(34,197,94,0.1)" />
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2l4-4" />
                                        </svg>
                                    </div>
                                    <h3 className="text-xl font-bold mb-2 text-blue-700">¡Excelente elección!</h3>
                                    <p className="mb-4 text-neutral-700">Has presionado el hitzone de <span className="font-semibold text-blue-600">Ir a Depósito Directo</span>.<br/>¡Sigue así y completa el proceso!</p>
                                    <button
                                        onClick={() => setModalOpen(false)}
                                        className="mt-2 px-8 py-2 bg-gradient-to-r from-blue-500 to-green-500 text-white rounded shadow hover:scale-105 hover:from-green-500 hover:to-blue-500 transition-all duration-200 font-semibold"
                                    >
                                        ¡Continuar!
                                    </button>
                                </div>
                            </div>
                        )}
                    </>
                ) : (
                    <p>Simulación de Navegación (Imagen no configurada)</p>
                )}
            </div>
            <button type="button" className="bg-primary-600 hover:bg-primary-700 text-white font-medium py-2 px-6 rounded-lg transition-colors">Siguiente</button>
        </div>
    );
};

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

// Adaptador para preguntas de texto largo
const CognitiveLongTextAdapter: React.FC<MappedStepComponentProps> = ({ stepConfig, onStepComplete }) => {
  return (
    <LongTextView
      config={stepConfig as Record<string, unknown>}
      onStepComplete={onStepComplete}
    />
  );
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type StepComponentType = React.LazyExoticComponent<React.ComponentType<any>> | React.FC<MappedStepComponentProps>; // Patrón estándar en registros de componentes React
// 'any' es necesario aquí porque React.lazy y ComponentType requieren flexibilidad para props heterogéneas.
// Este patrón es estándar y seguro si se valida el uso de props al renderizar.

interface StepComponentMap {
    [key: string]: StepComponentType;
}

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
    'cognitive_navigation_flow': CognitiveNavigationFlowStep,
    'smartvoc_csat': CSATView,
    'smartvoc_cv': DifficultyScaleAdapter,
    'smartvoc_nev': DifficultyScaleAdapter,
    'smartvoc_feedback': SmartVocFeedbackQuestion,
    'smartvoc_ces': DifficultyScaleAdapter,
    'thankyou': ThankYouView,
    'demographic': DemographicStep,
    'cognitive_preference_test': CognitivePreferenceTestStep,
    'smartvoc_nps': NPSView,
}; 