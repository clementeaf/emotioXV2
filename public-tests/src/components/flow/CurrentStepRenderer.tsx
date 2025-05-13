import React, { useState, useCallback } from 'react';
import { ParticipantLogin } from '../auth/ParticipantLogin';
import WelcomeScreenHandler from './WelcomeScreenHandler';
import { Participant } from '../../../../shared/interfaces/participant';
import { CSATView, ThankYouView, DifficultyScaleView, NPSView } from '../smartVoc';
import { RankingQuestion } from './questions/RankingQuestion';
import { RenderError } from './RenderError';
import { SmartVocFeedbackQuestion } from './questions/SmartVocFeedbackQuestion';
import { LinearScaleQuestion } from './questions/LineaScaleQuestion';
import { MultipleChoiceQuestion } from './questions/MultipleChoiceQuestion';
import { SingleChoiceQuestion } from './questions/SingleChoiceQuestion';
import { LongTextQuestion } from './questions/LongTextQuestion';
import { DemographicStep } from './questions/DemographicStep';
import { MockDataWarning } from './MockDataWarning';

interface CurrentStepRendererProps {
    stepType: string;
    stepConfig?: any;
    stepId?: string;
    stepName?: string;
    researchId: string;
    token?: string | null;
    onLoginSuccess?: (participant: Participant) => void;
    onStepComplete?: (answer?: any) => void;
    onError: (errorMessage: string, stepType: string) => void;
}

const CurrentStepRenderer: React.FC<CurrentStepRendererProps> = ({
    stepType,
    stepConfig,
    stepId,
    stepName,
    researchId,
    token,
    onLoginSuccess,
    onStepComplete,
    onError,
}) => {
    const [_loading, _setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const renderStepWithWarning = useCallback(
        (content: React.ReactNode, isMock: boolean, warningMessage?: string) => (
            <div className="relative w-full flex flex-col items-center justify-center min-h-full p-4 sm:p-8">
                {isMock && <MockDataWarning message={warningMessage} />}
                {content}
            </div>
        ),
        []
    );

    // Manejo unificado de errores
    const handleError = useCallback((message: string) => {
        setError(message);
        if (onError) {
            onError(message, stepType);
        }
    }, [onError, stepType]);

    // Función para renderizar el contenido basado en el tipo de paso
    const renderContent = useCallback(() => {
        if (error) {
            return <div className="p-6 text-center text-red-500">Error: {error}</div>;
        }

        if (_loading) {
            return <div className="p-6 text-center">Cargando...</div>;
        }

        switch (stepType) {
            case 'login':
                if (!onLoginSuccess) {
                    handleError("onLoginSuccess no fue proporcionado a CurrentStepRenderer para el paso LOGIN");
                    return <div className="p-6 text-center text-red-500">Error de configuración interna (Login).</div>;
                }
                return <ParticipantLogin researchId={researchId} onLogin={onLoginSuccess} />;
            case 'welcome': {
                if (!token || !onStepComplete) return null;
                const isWelcomeMock = !stepConfig; // Asumir que necesita config
                return renderStepWithWarning(
                    <WelcomeScreenHandler
                        researchId={researchId}
                        token={token}
                        onComplete={onStepComplete}
                        onError={(msg) => handleError(msg)}
                    />,
                    isWelcomeMock,
                    isWelcomeMock ? "Datos de bienvenida podrían ser de prueba si no se cargan." : undefined
                );
            }
            case 'instruction': {
                if (!onStepComplete) return null;
                const isInstructionMock = !stepConfig || !stepConfig.text;
                const instructionConfig = isInstructionMock
                    ? { title: 'Instrucciones (Prueba)', text: 'Texto de instrucciones de prueba.' }
                    : stepConfig;

                return renderStepWithWarning(
                    <div className="bg-white p-8 rounded-lg shadow-md max-w-lg">
                        <h1 className="text-2xl font-semibold mb-4 text-neutral-800">{instructionConfig.title}</h1>
                        <p className="text-neutral-600 mb-6">{instructionConfig.text}</p>
                        <button onClick={() => onStepComplete()} className="bg-primary-600 hover:bg-primary-700 text-white font-medium py-2 px-6 rounded-lg transition-colors">
                            Continuar
                        </button>
                    </div>,
                    isInstructionMock
                );
            }

            case 'cognitive_short_text': {
                if (!onStepComplete || !stepType) return null;
                const isMock = !stepConfig; // Es mock si no hay config real
                const configToUse = isMock
                    ? { questionText: 'Pregunta de texto corto (Prueba)?', placeholder: 'Escribe aquí...' }
                    : stepConfig;

                return renderStepWithWarning(
                    <div className="w-full max-w-xl"> {/* Asegurar consistencia con el case smartvoc_feedback */}
                        <SmartVocFeedbackQuestion
                            config={configToUse}
                            stepId={stepId}
                            stepName={stepName}
                            stepType={stepType} // Se pasará 'cognitive_short_text'
                            onStepComplete={onStepComplete}
                        />
                    </div>,
                    isMock
                );
            }

            case 'cognitive_long_text': {
                if (!onStepComplete) return null;
                const isCogLongTextMock = !stepConfig || !stepConfig.questionText;
                const cogLongTextConfig = isCogLongTextMock
                    ? { questionText: 'Pregunta de texto largo (Prueba)?', placeholder: 'Escribe tu respuesta detallada...' }
                    : stepConfig;

                return renderStepWithWarning(
                    <LongTextQuestion
                        config={cogLongTextConfig}
                        stepId={stepId}
                        stepName={stepName}
                        stepType={stepType}
                        onStepComplete={onStepComplete}
                    />,
                    isCogLongTextMock
                );
            }

            case 'cognitive_single_choice': {
                if (!onStepComplete) return null;


                // <<< INICIO CAMBIOS >>>
                // Evaluar si el stepConfig tiene la estructura mínima necesaria, aunque el contenido esté vacío.
                const hasValidQuestionSource = stepConfig && (typeof stepConfig.questionText === 'string' || typeof stepConfig.title === 'string');
                const hasValidOptionsSource = stepConfig &&
                    ((Array.isArray(stepConfig.options) && stepConfig.options.every((opt: string) => typeof opt === 'string')) ||  // <<< Añadido (opt: string)
                        (Array.isArray(stepConfig.choices) && stepConfig.choices.every((choice: { id?: string; text: string }) => choice && typeof choice.text === 'string'))); // <<< Añadido tipo para choice

                // isMock será true si no hay stepConfig, o si falta una fuente válida para la pregunta o las opciones.
                const isMockBasedOnStructure = !stepConfig || !hasValidQuestionSource || !hasValidOptionsSource;

                let configForQuestion;
                if (isMockBasedOnStructure) {
                    configForQuestion = {
                        questionText: 'Pregunta de opción única (Prueba)?',
                        options: ['Opción A', 'Opción B', 'Opción C'],
                        title: 'Pregunta de opción única (Prueba)?', // Mantener consistencia para el mock
                        savedResponses: null // Para el mock, no hay respuestas guardadas inicialmente
                    };
                } else {
                    // Transformar el stepConfig recibido al formato que espera SingleChoiceQuestion
                    const questionText = stepConfig.questionText || stepConfig.title || 'Pregunta sin texto'; // Usar title si questionText no existe
                    const options = stepConfig.options ||
                        (stepConfig.choices ?
                            stepConfig.choices.map((choice: { id?: string; text: string }, index: number) => choice.text || `Opción ${choice.id || index + 1}`) // <<< Añadido tipo para choice
                            : []);
                    configForQuestion = {
                        ...stepConfig,
                        questionText: questionText,
                        options: options,
                    };
                }

                return renderStepWithWarning(
                    <SingleChoiceQuestion
                        config={configForQuestion}
                        stepId={stepId}
                        stepName={stepName}
                        stepType={stepType}
                        onStepComplete={onStepComplete}
                        isMock={isMockBasedOnStructure}
                    />,
                    isMockBasedOnStructure
                );
            }

            case 'cognitive_multiple_choice': {
                if (!onStepComplete) return null;

                const hasValidQuestionSource = stepConfig && (typeof stepConfig.questionText === 'string' || typeof stepConfig.title === 'string');
                const hasValidOptionsSource = stepConfig &&
                    ((Array.isArray(stepConfig.options) && stepConfig.options.every((opt: string) => typeof opt === 'string')) ||
                        (Array.isArray(stepConfig.choices) && stepConfig.choices.every((choice: { id?: string; text: string }) => choice && typeof choice.text === 'string')));

                const isMockBasedOnStructure = !stepConfig || !hasValidQuestionSource || !hasValidOptionsSource;

                let configForQuestion;
                if (isMockBasedOnStructure) {
                    configForQuestion = {
                        questionText: 'Pregunta de opción múltiple (Prueba)?',
                        options: ['Opción Múltiple 1', 'Opción Múltiple 2', 'Opción Múltiple 3'],
                        title: 'Pregunta de opción múltiple (Prueba)?',
                        savedResponses: []
                    };
                } else {
                    const questionText = stepConfig.questionText || stepConfig.title || 'Pregunta múltiple sin texto';
                    const options = stepConfig.options ||
                        (stepConfig.choices ?
                            stepConfig.choices.map((choice: { id?: string; text: string }, index: number) => choice.text || `Opción ${choice.id || index + 1}`)
                            : []);
                    configForQuestion = {
                        ...stepConfig,
                        questionText: questionText,
                        options: options,
                    };
                }

                return renderStepWithWarning(
                    <MultipleChoiceQuestion
                        config={configForQuestion}
                        stepId={stepId}
                        stepName={stepName}
                        stepType={stepType}
                        onStepComplete={onStepComplete}
                        isMock={isMockBasedOnStructure}
                    />,
                    isMockBasedOnStructure
                );
            }

            case 'cognitive_linear_scale': {
                if (!onStepComplete) return null;

                const hasValidQuestionSource = stepConfig && (typeof stepConfig.questionText === 'string' || typeof stepConfig.title === 'string');
                const scaleConfig = stepConfig?.scaleConfig;
                const hasValidScaleDefinition = stepConfig &&
                    ((typeof stepConfig.minValue === 'number' && typeof stepConfig.maxValue === 'number') ||
                        (scaleConfig && typeof scaleConfig.startValue === 'number' && typeof scaleConfig.endValue === 'number') ||
                        typeof stepConfig.scaleSize === 'number' ||
                        (Array.isArray(stepConfig.scaleValues) && stepConfig.scaleValues.length > 0));

                const isMockBasedOnStructure = !stepConfig || !hasValidQuestionSource || !hasValidScaleDefinition;

                let configForQuestion;
                if (isMockBasedOnStructure) {
                    configForQuestion = {
                        questionText: 'Pregunta de escala lineal (Prueba)?',
                        title: 'Pregunta de escala lineal (Prueba)?',
                        minValue: 1,
                        maxValue: 5,
                        minLabel: 'Mín (Prueba)',
                        maxLabel: 'Máx (Prueba)',
                        savedResponses: null
                    };
                } else {
                    const questionText = stepConfig.questionText || stepConfig.title || 'Pregunta de escala sin texto';
                    const minValue = scaleConfig?.startValue ?? stepConfig.minValue ?? 1;
                    const maxValue = scaleConfig?.endValue ?? stepConfig.maxValue ?? stepConfig.scaleSize ?? 5;
                    const minLabel = scaleConfig?.startLabel ?? stepConfig.minLabel ?? stepConfig.leftLabel ?? 'Mínimo';
                    const maxLabel = scaleConfig?.endLabel ?? stepConfig.maxLabel ?? stepConfig.rightLabel ?? 'Máximo';

                    configForQuestion = {
                        ...stepConfig,
                        questionText: questionText,
                        title: questionText,
                        minValue: minValue,
                        maxValue: maxValue,
                        minLabel: minLabel,
                        maxLabel: maxLabel,
                    };
                }

                return renderStepWithWarning(
                    <LinearScaleQuestion
                        config={configForQuestion}
                        stepId={stepId}
                        stepName={stepName}
                        stepType={stepType}
                        onStepComplete={onStepComplete}
                        isMock={isMockBasedOnStructure}
                    />,
                    isMockBasedOnStructure
                );
            }

            case 'cognitive_ranking': {
                if (!onStepComplete) return null;

                // 1. Check if config structure itself suggests mock/invalidity
                const hasValidQuestionSource = stepConfig && (typeof stepConfig.questionText === 'string' || typeof stepConfig.title === 'string');
                const itemsSource = stepConfig?.items || stepConfig?.options || stepConfig?.choices;
                const hasValidItemsSource = Array.isArray(itemsSource) && itemsSource.length > 0; // Require at least one item source

                // Treat as fundamentally mock if basic structure is missing
                const isConfigBasedMock = !stepConfig || !hasValidQuestionSource || !hasValidItemsSource;

                // 2. Extract items, providing placeholders for invalid ones
                let extractedItems: string[] = [];
                if (hasValidItemsSource && !isConfigBasedMock) { // Only extract if source exists and config isn't mock
                   extractedItems = itemsSource.map((item: any, index: number) => {
                        let text = '';
                        if (typeof item === 'string') {
                            text = item.trim();
                        } else if (typeof item === 'object' && item !== null && typeof item.text === 'string') {
                            text = item.text.trim();
                        }
                        // Return placeholder ONLY if extracted text is empty after trimming
                        return text || `Item ${index + 1} (Config Inválida)`;
                    });
                }

                // 3. Check if extraction yielded ANY valid text (not just placeholders)
                const hasAnyValidItemText = extractedItems.some(text => !text.includes('(Config Inválida)'));

                // 4. Decide final items to pass to the component
                let finalItemsToPass: string[];
                let showInvalidItemWarning = false;

                if (isConfigBasedMock || !hasAnyValidItemText) {
                     // If config is fundamentally mock OR extraction yielded ONLY placeholders
                     finalItemsToPass = ['Item de Prueba Mock 1', 'Item de Prueba Mock 2', 'Item de Prueba Mock 3'];
                } else {
                    // Use extracted items (may contain a mix of valid text and placeholders)
                    finalItemsToPass = extractedItems;
                    // Set flag to show warning if *some* items are placeholders but not all
                    showInvalidItemWarning = extractedItems.some(text => text.includes('(Config Inválida)'));
                }

                 // 5. Prepare config for RankingQuestion
                 const configForQuestion = {
                     ...(stepConfig || {}), // Spread original config
                     // Use more specific question text based on situation
                     questionText: stepConfig?.questionText || stepConfig?.title || (isConfigBasedMock || !hasAnyValidItemText ? 'Pregunta de ranking (Prueba)?' : 'Ordene los siguientes items:'),
                     title: stepConfig?.title || stepConfig?.questionText || (isConfigBasedMock || !hasAnyValidItemText ? 'Pregunta de ranking (Prueba)?' : 'Ranking'),
                     items: finalItemsToPass, // Pass the final list
                     // savedResponses is handled internally by RankingQuestion
                 };

                // 6. Render RankingQuestion
                return renderStepWithWarning(
                    <RankingQuestion
                        config={configForQuestion}
                        stepId={stepId}
                        stepName={stepName}
                        stepType={stepType}
                        onStepComplete={onStepComplete}
                        // RankingQuestion's internal useEffect will decide if API call is possible/useful
                        // We don't need a separate isApiDisabled prop based on config validity here.
                        // Let RankingQuestion handle its own API logic based on IDs and received items.
                        isApiDisabled={false} // Let RankingQuestion decide based on IDs etc.
                    />,
                    // Show the overall mock data warning OR the specific invalid item warning
                    isConfigBasedMock || !hasAnyValidItemText || showInvalidItemWarning,
                    isConfigBasedMock || !hasAnyValidItemText
                        ? "Configuración de ranking inválida o faltante, usando datos de prueba."
                        : showInvalidItemWarning
                        ? 'Advertencia: Algunos textos de ítems eran inválidos en la configuración y se muestran como placeholders.'
                        : undefined // No warning needed if config is valid and all items extracted successfully
                );
            }

            case 'cognitive_navigation_flow': {
                if (!onStepComplete) return null;

                // Check for minimal required config for a non-mock view
                const hasQuestion = stepConfig && typeof stepConfig.questionText === 'string' && stepConfig.questionText.trim() !== '';
                // Optional fields
                const description = stepConfig?.description;
                const imageUrl = stepConfig?.imageUrl; // Assuming config uses imageUrl
                const deviceFrame = stepConfig?.deviceFrame; // Assuming boolean for device frame toggle

                const isMock = !hasQuestion; // Consider it mock if the main question is missing

                // Use configured values or fallbacks for mock
                const title = stepConfig?.title || stepName || (isMock ? 'Flujo de Navegación (Prueba)' : 'Flujo de Navegación');
                const questionToDisplay = hasQuestion ? stepConfig.questionText : 'Realice la siguiente tarea de navegación (Prueba).';

                return renderStepWithWarning(
                    <div className="bg-white p-8 rounded-lg shadow-md max-w-2xl w-full">
                        <h2 className="text-xl font-medium mb-1 text-neutral-800">{title}</h2>
                        {description && <p className="text-sm text-neutral-500 mb-3">{description}</p>}
                        {/* Display the main question */} 
                        <p className="text-neutral-600 mb-4">{questionToDisplay}</p>
                        
                        {/* Render image if URL exists, otherwise show placeholder */}
                        <div className={`mb-6 border rounded-md ${imageUrl ? '' : 'border-dashed border-neutral-300 min-h-[200px] flex items-center justify-center text-neutral-400'} ${deviceFrame ? 'bg-gray-200 p-2 sm:p-4' : ''}`}>
                           {imageUrl ? (
                                <img 
                                    src={imageUrl} 
                                    alt="Simulación de navegación" 
                                    className={`w-full h-auto object-contain ${deviceFrame ? 'rounded-md shadow-lg' : ''}`}
                                />
                           ) : (
                                <p>Simulación de Navegación (Imagen no configurada)</p>
                           )}
                        </div>

                        {/* Placeholder for interaction result - Button always enabled for now */}
                        <button 
                            onClick={() => onStepComplete({})} // Sending empty object for now
                            className="bg-primary-600 hover:bg-primary-700 text-white font-medium py-2 px-6 rounded-lg transition-colors"
                        >
                            Siguiente
                        </button>
                    </div>,
                    isMock, // Show warning if the main question was missing
                    isMock ? "Falta la pregunta principal para este paso." : undefined
                );
            }

            case 'smartvoc_csat': {
                if (!onStepComplete) return null;
                const isCsatMock = !stepConfig || !stepConfig.questionText;
                const csatConfig = isCsatMock
                    ? {
                        questionText: 'Pregunta CSAT (Prueba)?',
                        instructions: 'Por favor, califique su nivel de satisfacción.',
                        initialValue: null
                    }
                    : {
                        ...stepConfig,
                        initialValue: stepConfig.savedResponses
                    };

                return renderStepWithWarning(
                    <CSATView
                        questionText={csatConfig.questionText}
                        instructions={csatConfig.instructions}
                        companyName={csatConfig.companyName}
                        initialValue={csatConfig.initialValue}
                        onNext={onStepComplete}
                        stepId={stepId}
                        stepType={stepType}
                        config={csatConfig}
                    />,
                    isCsatMock
                );
            }

            case 'smartvoc_cv': {
                if (!onStepComplete) return null;
                const isMock = !stepConfig || !stepConfig.questionText;
                const config = isMock ? { questionText: 'Pregunta Customer Value (Prueba)?' } : stepConfig;
                return renderStepWithWarning(
                    <div className="bg-white p-8 rounded-lg shadow-md max-w-lg w-full text-center">
                        <h2 className="text-xl font-medium mb-3 text-neutral-700">{stepName || 'Valor Percibido'}</h2>
                        <p className="text-neutral-600 mb-4">{config.questionText}</p>
                        <p className="text-sm text-neutral-500">(Placeholder: Vista para Customer Value)</p>
                        <button onClick={() => onStepComplete({})} className="mt-4 bg-primary-600 hover:bg-primary-700 text-white font-medium py-2 px-6 rounded-lg transition-colors">Siguiente</button>
                    </div>,
                    isMock
                );
            }

            case 'smartvoc_nps': {
                if (!onStepComplete) return null;
                const isMock = !stepConfig || !stepConfig.questionText;
                const config = isMock ? {
                    questionText: 'Pregunta NPS (Prueba)?',
                    leftLabel: 'Nada probable',
                    rightLabel: 'Muy probable'
                } : stepConfig;

                return renderStepWithWarning(
                    <NPSView
                        questionText={config.questionText}
                        instructions={config.instructions}
                        leftLabel={config.leftLabel}
                        rightLabel={config.rightLabel}
                        companyName={config.companyName}
                        onNext={onStepComplete}
                        stepId={stepId}
                        stepType={stepType}
                    />,
                    isMock
                );
            }

            case 'smartvoc_nev': {
                if (!onStepComplete) return null;
                const isMock = !stepConfig || !stepConfig.questionText;
                const config = isMock ? { questionText: 'Pregunta NEV (Prueba)?' } : stepConfig;
                return renderStepWithWarning(
                    <div className="bg-white p-8 rounded-lg shadow-md max-w-lg w-full text-center">
                        <h2 className="text-xl font-medium mb-3 text-neutral-700">{stepName || 'Valor Emocional Neto'}</h2>
                        <p className="text-neutral-600 mb-4">{config.questionText}</p>
                        <p className="text-sm text-neutral-500">(Placeholder: Vista para NEV)</p>
                        <button onClick={() => onStepComplete({})} className="mt-4 bg-primary-600 hover:bg-primary-700 text-white font-medium py-2 px-6 rounded-lg transition-colors">Siguiente</button>
                    </div>,
                    isMock
                );
            }

            case 'smartvoc_feedback': {
                if (!onStepComplete || !stepType) return null;
                const isFeedbackMock = !stepConfig || !stepConfig.questionText;
                const feedbackConfig = isFeedbackMock
                    ? { questionText: 'Pregunta Feedback (Prueba)?', placeholder: 'Escribe aquí...' }
                    : stepConfig;

                return renderStepWithWarning(
                    <div className="w-full max-w-xl">
                        <SmartVocFeedbackQuestion
                            config={feedbackConfig}
                            stepId={stepId}
                            stepName={stepName}
                            stepType={stepType}
                            onStepComplete={onStepComplete}
                        />
                    </div>,
                    isFeedbackMock
                );
            }

            case 'smartvoc_ces': {
                if (!onStepComplete) return null;
                const isCesMock = !stepConfig || !stepConfig.questionText;
                const cesConfig = isCesMock
                    ? {
                        questionText: 'Pregunta CES (Prueba)?',
                        leftLabel: 'Muy Difícil',
                        rightLabel: 'Muy Fácil',
                        initialValue: null
                    }
                    : {
                        ...stepConfig,
                        initialValue: stepConfig.savedResponses
                    };

                return renderStepWithWarning(
                    <DifficultyScaleView
                        questionText={cesConfig.questionText}
                        instructions={cesConfig.instructions}
                        leftLabel={cesConfig.leftLabel}
                        rightLabel={cesConfig.rightLabel}
                        companyName={cesConfig.companyName}
                        initialValue={cesConfig.initialValue}
                        onNext={onStepComplete}
                        stepId={stepId}
                        stepType={stepType}
                        config={cesConfig}
                    />,
                    isCesMock
                );
            }

            case 'thankyou': {
                const isThankYouMock = !stepConfig;
                const responsesData = stepConfig?.responsesData;

                return renderStepWithWarning(
                    <ThankYouView
                        onContinue={() => console.log("Acción final desde ThankYou")}
                        responsesData={responsesData}
                    />,
                    isThankYouMock
                );
            }

            case 'demographic': {
                return (
                    <DemographicStep
                        researchId={researchId}
                        token={token}
                        stepConfig={stepConfig}
                        onStepComplete={onStepComplete}
                        onError={onError}
                    />
                );
            }

            // --- NUEVO CASO PARA PREFERENCE TEST ---
            case 'cognitive_preference_test': {
                if (!onStepComplete) return null;

                // Asumir campos básicos por ahora
                const title = stepConfig?.title || stepName || 'Test de Preferencia';
                const questionText = stepConfig?.questionText || 'Realice el siguiente test de preferencia (Prueba)';
                const description = stepConfig?.description;

                // Determinar si es mock (si falta la pregunta)
                const isMock = !stepConfig || !stepConfig.questionText;

                return renderStepWithWarning(
                    <div className="bg-white p-8 rounded-lg shadow-md max-w-xl w-full text-center">
                        <h2 className="text-xl font-medium mb-1 text-neutral-800">{title}</h2>
                        {description && <p className="text-sm text-neutral-500 mb-3">{description}</p>}
                        <p className="text-neutral-600 mb-4">{questionText}</p>
                        <div className="border border-dashed border-neutral-300 p-4 rounded-md mb-6 min-h-[150px] flex items-center justify-center text-neutral-400">
                             (Placeholder: Vista para Test de Preferencia - tipo '{stepType}' no implementado)
                        </div>
                         <button 
                            onClick={() => onStepComplete({})} // Enviar respuesta vacía por ahora
                            className="bg-primary-600 hover:bg-primary-700 text-white font-medium py-2 px-6 rounded-lg transition-colors"
                        >
                            Siguiente
                        </button>
                    </div>,
                    isMock,
                    isMock ? "Falta la pregunta principal para este Test de Preferencia." : undefined
                );
            }
            // --- FIN NUEVO CASO ---

            default:
                console.warn(`[CurrentStepRenderer] Tipo de paso no manejado en switch: ${stepType}`);
                return <RenderError stepType={stepType} />
        }
    }, [stepType, stepConfig, stepId, stepName, researchId, token, onLoginSuccess, onStepComplete, error, _loading, handleError, renderStepWithWarning]);

    return renderContent();
};

export default CurrentStepRenderer; 