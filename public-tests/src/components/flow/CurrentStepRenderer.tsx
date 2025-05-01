import React from 'react';
// Eliminar ParticipantFlowStep si no se usa en onError
// import { ParticipantFlowStep } from '../../types/flow'; 
import { ParticipantLogin } from '../auth/ParticipantLogin';
// Importar componentes de vista directamente si los handlers ya no son necesarios
// O mantener los handlers si encapsulan lógica útil (ej. fetch interno)
import WelcomeScreenHandler from './WelcomeScreenHandler';
import SmartVOCHandler from './SmartVOCHandler'; // <<< Este handler maneja preguntas INTERNAMENTE
import CognitiveTaskHandler from './CognitiveTaskHandler'; // <<< Este handler maneja preguntas INTERNAMENTE
// Importar tipos
import { CurrentStepRendererProps as OldProps } from './types';
import { Participant } from '../../../../shared/interfaces/participant';
// Importar los componentes de VISTA si se usan directamente
import { CSATView, FeedbackView, ThankYouView } from '../smartVoc';
// Asumir un componente de vista para texto corto
// import { ShortTextView } from '../cognitiveTask/ShortTextView';

// <<< Añadir un componente de advertencia >>>
const MockDataWarning: React.FC<{ message?: string }> = ({ message }) => (
    <div className="absolute top-0 left-1/2 transform -translate-x-1/2 mt-2 bg-yellow-100 border border-yellow-300 text-yellow-800 px-3 py-1 rounded-md text-xs shadow z-20">
        ⚠️ {message || 'Mostrando datos de prueba'}
    </div>
);

// <<< Definir Nuevas Props >>>
interface CurrentStepRendererProps {
    stepType: string;       // Tipo del paso (e.g., 'login', 'welcome', 'cognitive_short_text')
    stepConfig?: any;       // Config específica del paso (pregunta, textos, etc.)
    stepId?: string;        // ID único del paso (opcional, para key)
    stepName?: string;      // Nombre del paso (opcional, para títulos)
    researchId: string;
    token?: string | null; 
    onLoginSuccess?: (participant: Participant) => void;
    onStepComplete?: (answer?: any) => void; // Callback general para completar paso
    // onError?: (errorMessage: string, step: ParticipantFlowStep) => void; // Opción 1: Mantener enum para contexto de error
    onError: (errorMessage: string, stepType: string) => void; // Opción 2: Usar el string type
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

    // <<< Wrapper general para aplicar advertencia si es necesario >>>
    const renderStepWithWarning = (
        content: React.ReactNode,
        isMock: boolean,
        warningMessage?: string
    ) => (
        <div className="relative w-full flex flex-col items-center justify-center min-h-full p-4 sm:p-8">
            {isMock && <MockDataWarning message={warningMessage} />}
            {content}
        </div>
    );

    // <<< Usar stepType en el switch >>>
    switch (stepType) {
        case 'login':
             // Asegurarse de que onLoginSuccess esté definido
             if (!onLoginSuccess) {
                onError("onLoginSuccess no fue proporcionado a CurrentStepRenderer para el paso LOGIN", 'login');
                return <div className="p-6 text-center text-red-500">Error de configuración interna (Login).</div>;
            }
            return <ParticipantLogin researchId={researchId} onLogin={onLoginSuccess} />;
        
        // --- Casos que usan Handlers (si mantienen lógica compleja o fetch interno) ---
        case 'welcome': { // <<< Usar bloque
            if (!token || !onStepComplete) return null;
            const isWelcomeMock = !stepConfig; // Asumir que necesita config
            // WelcomeScreenHandler puede que busque su propia config, ajustar si es necesario
            // const welcomeConfig = stepConfig || { title: 'Bienvenida (Prueba)', message: 'Mensaje de bienvenida de prueba.' }; 
            return renderStepWithWarning(
                 <WelcomeScreenHandler
                        researchId={researchId}
                        token={token}
                        onComplete={onStepComplete}
                        onError={(msg) => onError(msg, stepType)}
                    />,
                 isWelcomeMock,
                 isWelcomeMock ? "Datos de bienvenida podrían ser de prueba si no se cargan." : undefined
            );
           } // <<< Fin bloque

        // EJEMPLO: Si SmartVOC/Cognitive fueran pasos ÚNICOS que internamente manejan sus preguntas
        // case 'smartvoc_module': 
        //    if (!token || !onStepComplete) return null; 
        //    return <SmartVOCHandler researchId={researchId} token={token} onComplete={onStepComplete} onError={(msg) => onError(msg, stepType)} />;
        // case 'cognitive_module':
        //    if (!token || !onStepComplete) return null;
        //    return <CognitiveTaskHandler researchId={researchId} token={token} onComplete={onStepComplete} onError={(msg) => onError(msg, stepType)} />;

        // --- Casos que renderizan VISTAS directamente (para preguntas individuales) ---
        case 'instruction': { // <<< Usar bloque
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
            } // <<< Fin bloque

        case 'cognitive_short_text': { 
            if (!onStepComplete) return null;
            const isMock = !stepConfig; // Es mock si no hay config real
            const config = isMock
                ? { questionText: 'Pregunta de texto corto (Prueba)?' }
                : stepConfig;
            
            // Usar los campos específicos si existen en la config real
            const title = config.title || stepName || 'Pregunta'; // Usar title si existe
            const description = config.description; // Usar description si existe
            const questionText = config.questionText || (isMock ? 'Pregunta de prueba' : '');
            const placeholder = config.answerPlaceholder || 'Escribe tu respuesta...';
 
            // Placeholder - Reemplazar con componente real si existe
            // return renderStepWithWarning(<ShortTextView config={config} onNext={onStepComplete} isMock={isMock}/>, isMock);
             return renderStepWithWarning(
                 <div className="bg-white p-8 rounded-lg shadow-md max-w-lg w-full">
                    <h2 className="text-xl font-medium mb-1 text-neutral-800">{title}</h2>
                    {description && <p className="text-sm text-neutral-500 mb-3">{description}</p>} {/* Mostrar descripción si existe */}
                    <p className="text-neutral-600 mb-4">{questionText}</p> {/* Mostrar texto principal */} 
                    <input
                        type="text"
                        className="border border-neutral-300 p-2 rounded-md w-full mb-4 focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                        placeholder={placeholder} // <<< Usar placeholder de config
                    />
                    <button
                        onClick={() => onStepComplete("Respuesta placeholder...")}
                        className="bg-primary-600 hover:bg-primary-700 text-white font-medium py-2 px-6 rounded-lg transition-colors"
                    >
                        Siguiente
                    </button>
                </div>,
                 isMock // Pasar el flag de mock
             );
            } 

        case 'cognitive_long_text': { 
            if (!onStepComplete) return null;
            const isCogLongTextMock = !stepConfig || !stepConfig.questionText;
            const cogLongTextConfig = isCogLongTextMock
                ? { questionText: 'Pregunta de texto largo (Prueba)?', placeholder: 'Escribe tu respuesta detallada...' }
                : stepConfig;

            // Placeholder - Reemplazar con componente real LongTextView si existe
            // return renderStepWithWarning(<LongTextView config={cogLongTextConfig} onNext={onStepComplete} isMock={isCogLongTextMock}/>, isCogLongTextMock);
             return renderStepWithWarning(
                 <div className="bg-white p-8 rounded-lg shadow-md max-w-lg w-full">
                    <h2 className="text-xl font-medium mb-3 text-neutral-700">{stepName || 'Pregunta'}</h2>
                    <p className="text-neutral-600 mb-4">{cogLongTextConfig.questionText}</p>
                    <textarea
                        className="border border-neutral-300 p-2 rounded-md w-full mb-4 h-32 resize-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                        placeholder={cogLongTextConfig.placeholder}
                    />
                    <button
                        onClick={() => onStepComplete("Respuesta larga placeholder...")}
                        className="bg-primary-600 hover:bg-primary-700 text-white font-medium py-2 px-6 rounded-lg transition-colors"
                    >
                        Siguiente
                    </button>
                </div>,
                 isCogLongTextMock
             );
            } 

        case 'smartvoc_csat': { 
             if (!onStepComplete) return null;
             const isCsatMock = !stepConfig || !stepConfig.questionText || !stepConfig.scaleSize;
             const csatConfig = isCsatMock
                ? { questionText: 'Pregunta CSAT (Prueba)?', scaleSize: 5 }
                : stepConfig;

             return renderStepWithWarning(
                 <CSATView
                    questionText={csatConfig.questionText}
                    scaleSize={csatConfig.scaleSize}
                    onNext={onStepComplete}
                />,
                 isCsatMock
             );
            } 

        case 'smartvoc_feedback': {
             if (!onStepComplete) return null;
             const isFeedbackMock = !stepConfig || !stepConfig.questionText;
             const feedbackConfig = isFeedbackMock
                ? { questionText: 'Pregunta Feedback (Prueba)?', placeholder: 'Escribe aquí...' }
                : stepConfig;

             return renderStepWithWarning(
                 <FeedbackView
                    questionText={feedbackConfig.questionText}
                    placeholder={feedbackConfig.placeholder} 
                    onNext={onStepComplete}
                />,
                 isFeedbackMock
             );
            } 

        case 'smartvoc_ces': { 
             if (!onStepComplete) return null;
             // Asumiendo que CES usa DifficultyScaleView
             // Verificar props esperadas por DifficultyScaleView
             const isCesMock = !stepConfig || !stepConfig.questionText || !stepConfig.scaleSize;
             const cesConfig = isCesMock
                ? { questionText: 'Pregunta CES (Prueba)?', scaleSize: 7, leftLabel: 'Muy Difícil', rightLabel: 'Muy Fácil' } 
                : stepConfig;

             // Importar DifficultyScaleView si no está ya importado
             // import { DifficultyScaleView } from '../smartVoc'; 
             return renderStepWithWarning(
                 /* Reemplazar con el componente real si está disponible y las props son correctas */
                 <div className="bg-white p-8 rounded-lg shadow-md max-w-lg w-full">
                     <h2 className="text-xl font-medium mb-3 text-neutral-700">{stepName || 'Pregunta CES'}</h2>
                     <p className="text-neutral-600 mb-4">{cesConfig.questionText}</p>
                     {/* Placeholder de la vista de escala */}
                     <div className="flex justify-between text-xs text-neutral-500 mb-1">
                         <span>{cesConfig.leftLabel}</span>
                         <span>{cesConfig.rightLabel}</span>
                     </div>
                     <div className="flex justify-between space-x-2 mb-4">
                         {[...Array(cesConfig.scaleSize)].map((_, i) => (
                             <button key={i} className="w-8 h-8 border border-neutral-300 rounded-full hover:bg-neutral-100 focus:outline-none focus:ring-2 focus:ring-primary-500">{i + 1}</button>
                         ))}
                     </div>
                      <button
                        onClick={() => onStepComplete( /* valor seleccionado */ 4 )} // Simular selección
                        className="bg-primary-600 hover:bg-primary-700 text-white font-medium py-2 px-6 rounded-lg transition-colors"
                     >
                         Siguiente
                     </button>
                 </div>,
                 isCesMock
             );
            } // Fin del bloque para smartvoc_ces

        case 'thankyou': {
            const isThankYouMock = !stepConfig; // Asumir que necesita config para mensajes
             const thankYouConfig = isThankYouMock
                ? { title: '¡Gracias! (Prueba)', message: 'Mensaje de agradecimiento de prueba.'}
                : stepConfig;
            
             return renderStepWithWarning(
                 <ThankYouView
                     onContinue={() => console.log("Acción final desde ThankYou")}
                 />,
                 isThankYouMock
             );
            } 

        // Eliminar casos antiguos basados en Enum si ya no son necesarios
        /*
        case ParticipantFlowStep.DONE:
            return (...);
        case ParticipantFlowStep.LOADING_SESSION:
            return (...);
        case ParticipantFlowStep.ERROR:
            return (...);
        */
        
        default:
             // Manejar tipos no reconocidos
             console.warn(`[CurrentStepRenderer] Tipo de paso no manejado en switch: ${stepType}`);
             // NO llamar a onError aquí para evitar error de renderizado
             // Devolver un componente de error visual o null
             return (
                 <div className="flex items-center justify-center h-full w-full p-8 text-center">
                      <div className="bg-red-100 border border-red-300 text-red-700 px-4 py-3 rounded relative" role="alert">
                         <strong className="font-bold">Error de Renderizado:</strong>
                         <span className="block sm:inline"> Tipo de paso no reconocido: '{stepType}'.</span>
                     </div>
                  </div>
             );
    }
};

export default CurrentStepRenderer; 