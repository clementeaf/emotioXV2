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

// <<< Añadir URL base de S3 (¡Idealmente desde variables de entorno!) >>>
const S3_BASE_URL = 'https://your-s3-bucket-name.s3.amazonaws.com/'; // <<< REEMPLAZAR con tu URL base real

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

        case 'cognitive_single_choice': { 
            if (!onStepComplete) return null;
            const isMock = !stepConfig || !stepConfig.questionText || !Array.isArray(stepConfig.options) || stepConfig.options.length === 0;
            const config = isMock
                ? { questionText: 'Pregunta de opción única (Prueba)?', options: ['Opción A', 'Opción B', 'Opción C'] }
                : stepConfig;
            
            const title = config.title || stepName || 'Selecciona una opción';
            const description = config.description;
            const questionText = config.questionText || (isMock ? 'Pregunta de prueba' : '');
            const options = config.options || [];

            // Placeholder - Reemplazar con componente real SingleChoiceView si existe
            // return renderStepWithWarning(<SingleChoiceView config={config} onNext={onStepComplete} isMock={isMock}/>, isMock);
             return renderStepWithWarning(
                 <div className="bg-white p-8 rounded-lg shadow-md max-w-lg w-full">
                    <h2 className="text-xl font-medium mb-1 text-neutral-800">{title}</h2>
                    {description && <p className="text-sm text-neutral-500 mb-3">{description}</p>}
                    <p className="text-neutral-600 mb-4">{questionText}</p>
                    <div className="space-y-3 mb-6">
                        {options.map((option: string, index: number) => (
                            <label key={index} className="flex items-center space-x-3 p-3 border border-neutral-200 rounded-md hover:bg-neutral-50 cursor-pointer">
                                <input type="radio" name={`single-choice-${stepId}`} value={option} className="form-radio h-4 w-4 text-primary-600 border-neutral-300 focus:ring-primary-500" />
                                <span className="text-neutral-700">{option}</span>
                            </label>
                        ))}
                    </div>
                    <button
                        onClick={() => onStepComplete(options[0])} // Simular selección de la primera opción
                        className="bg-primary-600 hover:bg-primary-700 text-white font-medium py-2 px-6 rounded-lg transition-colors"
                    >
                        Siguiente
                    </button>
                </div>,
                 isMock // Pasar el flag de mock
             );
            } 

        // <<< NUEVO CASE para cognitive_multiple_choice >>>
        case 'cognitive_multiple_choice': { 
            if (!onStepComplete) return null;
            const isMock = !stepConfig || !stepConfig.questionText || !Array.isArray(stepConfig.options) || stepConfig.options.length === 0;
            const config = isMock
                ? { questionText: 'Pregunta de opción múltiple (Prueba)?', options: ['Opción 1', 'Opción 2', 'Opción 3'] }
                : stepConfig;
            
            const title = config.title || stepName || 'Selecciona una o más opciones';
            const description = config.description;
            const questionText = config.questionText || (isMock ? 'Pregunta de prueba' : '');
            const options = config.options || [];

            // Placeholder - Reemplazar con componente real MultipleChoiceView
             return renderStepWithWarning(
                 <div className="bg-white p-8 rounded-lg shadow-md max-w-lg w-full">
                    <h2 className="text-xl font-medium mb-1 text-neutral-800">{title}</h2>
                    {description && <p className="text-sm text-neutral-500 mb-3">{description}</p>}
                    <p className="text-neutral-600 mb-4">{questionText}</p>
                    <div className="space-y-3 mb-6">
                        {options.map((option: string, index: number) => (
                            <label key={index} className="flex items-center space-x-3 p-3 border border-neutral-200 rounded-md hover:bg-neutral-50 cursor-pointer">
                                <input type="checkbox" name={`multiple-choice-${stepId}-${index}`} value={option} className="form-checkbox h-4 w-4 text-primary-600 border-neutral-300 rounded focus:ring-primary-500" />
                                <span className="text-neutral-700">{option}</span>
                            </label>
                        ))}
                    </div>
                    <button
                        onClick={() => onStepComplete([options[0]])} // Simular selección de la primera opción
                        className="bg-primary-600 hover:bg-primary-700 text-white font-medium py-2 px-6 rounded-lg transition-colors"
                    >
                        Siguiente
                    </button>
                </div>,
                 isMock
             );
            } 

        // <<< NUEVO CASE para cognitive_linear_scale >>>
        case 'cognitive_linear_scale': { 
             if (!onStepComplete) return null;
             const isMock = !stepConfig || !stepConfig.questionText || !stepConfig.scaleSize;
             const config = isMock
                ? { questionText: 'Pregunta escala lineal (Prueba)?', scaleSize: 5, leftLabel: 'Izquierda', rightLabel: 'Derecha' }
                : stepConfig;

            const title = config.title || stepName || 'Valora en la escala';
            const description = config.description;
            const questionText = config.questionText || (isMock ? 'Pregunta de prueba' : '');

             return renderStepWithWarning(
                 <div className="bg-white p-8 rounded-lg shadow-md max-w-lg w-full">
                     <h2 className="text-xl font-medium mb-1 text-neutral-800">{title}</h2>
                    {description && <p className="text-sm text-neutral-500 mb-3">{description}</p>}
                    <p className="text-neutral-600 mb-4">{questionText}</p>
                     <div className="flex justify-between text-xs text-neutral-500 mb-1">
                         <span>{config.leftLabel}</span>
                         <span>{config.rightLabel}</span>
                     </div>
                     <div className="flex justify-between space-x-2 mb-4">
                         {[...Array(config.scaleSize)].map((_, i) => (
                             <button key={i} className="w-8 h-8 border border-neutral-300 rounded-full hover:bg-neutral-100 focus:outline-none focus:ring-2 focus:ring-primary-500">{i + 1}</button>
                         ))}
                     </div>
                     <button onClick={() => onStepComplete(3)} className="bg-primary-600 hover:bg-primary-700 text-white font-medium py-2 px-6 rounded-lg transition-colors">Siguiente</button>
                 </div>,
                 isMock
             );
            } 
        
        // <<< NUEVO CASE para cognitive_ranking >>>
        case 'cognitive_ranking': {
            if (!onStepComplete) return null;
            const isMock = !stepConfig || !stepConfig.questionText || !Array.isArray(stepConfig.items) || stepConfig.items.length === 0;
            const config = isMock
                ? { questionText: 'Pregunta de ranking (Prueba)?', items: ['Item 1', 'Item 2', 'Item 3'] }
                : stepConfig;

            const title = config.title || stepName || 'Ordena los elementos';
            const description = config.description;
            const questionText = config.questionText || (isMock ? 'Pregunta de prueba' : '');
            const items = config.items || [];

            return renderStepWithWarning(
                 <div className="bg-white p-8 rounded-lg shadow-md max-w-lg w-full">
                     <h2 className="text-xl font-medium mb-1 text-neutral-800">{title}</h2>
                     {description && <p className="text-sm text-neutral-500 mb-3">{description}</p>}
                     <p className="text-neutral-600 mb-4">{questionText}</p>
                     <p className="text-sm text-neutral-500 mb-4">(Placeholder: Arrastra y suelta para ordenar)</p>
                     <div className="space-y-2 border border-dashed border-neutral-300 p-4 rounded-md mb-6 min-h-[100px]">
                         {items.map((item: string, index: number) => (
                             <div key={index} className="bg-neutral-100 p-2 rounded border border-neutral-200 cursor-grab">{item}</div>
                         ))}
                     </div>
                     <button onClick={() => onStepComplete(items)} className="bg-primary-600 hover:bg-primary-700 text-white font-medium py-2 px-6 rounded-lg transition-colors">Siguiente</button>
                 </div>,
                 isMock
            );
        }

        // <<< NUEVO CASE para cognitive_navigation_flow >>>
        case 'cognitive_navigation_flow': {
            if (!onStepComplete) return null;
            const isMock = !stepConfig || !stepConfig.taskDescription;
            const config = isMock ? { taskDescription: 'Tarea de flujo de navegación (Prueba).' } : stepConfig;

            const title = config.title || stepName || 'Flujo de Navegación';
            const description = config.description;
            const taskDescription = config.taskDescription || (isMock ? 'Descripción de prueba' : '');

             return renderStepWithWarning(
                 <div className="bg-white p-8 rounded-lg shadow-md max-w-2xl w-full">
                     <h2 className="text-xl font-medium mb-1 text-neutral-800">{title}</h2>
                     {description && <p className="text-sm text-neutral-500 mb-3">{description}</p>}
                     <p className="text-neutral-600 mb-4">{taskDescription}</p>
                     <p className="text-sm text-neutral-500 mb-4">(Placeholder: Aquí iría la interfaz/simulación para la tarea de navegación)</p>
                     <div className="border border-dashed border-neutral-300 p-4 rounded-md mb-6 min-h-[200px] flex items-center justify-center text-neutral-400">
                         Simulación de Navegación
                     </div>
                     <button onClick={() => onStepComplete({})} className="bg-primary-600 hover:bg-primary-700 text-white font-medium py-2 px-6 rounded-lg transition-colors">Siguiente</button>
                 </div>,
                 isMock
             );
        }

        // <<< CASE MODIFICADO para cognitive_preference_test >>>
        case 'cognitive_preference_test': {
            if (!onStepComplete) return null;
            
            // Check for real config, specifically the files array and s3Key
            const hasRealFiles = stepConfig && Array.isArray(stepConfig.files) && stepConfig.files.length > 0 && stepConfig.files[0].s3Key;
            const isMock = !hasRealFiles;
            
            // Use mock config only if real files are missing
            const config = isMock ? { 
                questionText: 'Test de preferencia (Prueba)?', 
                options: ['Opción A Placeholder', 'Opción B Placeholder'], // Placeholder text/options for mock
                files: [] // Mock has no files
            } : stepConfig;

            const title = config.title || stepName || 'Test de Preferencia';
            const description = config.description;
            const questionText = config.questionText || (isMock ? '¿Cuál de estas opciones prefieres?' : '');
            
            // Get image URL from the first file if available
            const imageUrl = !isMock && config.files && config.files.length > 0 && config.files[0].s3Key 
                                ? `${S3_BASE_URL}${config.files[0].s3Key}` 
                                : null;
            
            // Get device frame flag
            const useDeviceFrame = !isMock && config.deviceFrame === true;
            
            // --- Renderizado --- 
            return renderStepWithWarning(
                 <div className="bg-white p-8 rounded-lg shadow-md max-w-3xl w-full">
                     <h2 className="text-xl font-medium mb-1 text-neutral-800 text-center">{title}</h2>
                     {description && <p className="text-sm text-neutral-500 mb-3 text-center">{description}</p>}
                     <p className="text-neutral-600 mb-6 text-center">{questionText || 'Elige la opción que prefieras'}</p>
                     
                     {/* Área para mostrar las opciones (imágenes o mocks) */}
                     <div className="flex justify-center items-center mb-6 min-h-[250px]"> {/* Centered container */}
                         {isMock ? (
                             // Mock display (e.g., text placeholders)
                             <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full">
                                 {(config.options || ['Mock A', 'Mock B']).slice(0, 2).map((optionText: string, index: number) => (
                                     <div key={index} className="border border-dashed border-neutral-300 rounded-md p-4 flex items-center justify-center min-h-[150px]">
                                         <span className="text-neutral-500 italic">{optionText}</span> 
                                     </div>
                                 ))}
                            </div>
                         ) : imageUrl ? (
                             // Real image display
                             <div className={`p-2 ${useDeviceFrame ? 'border-4 border-neutral-700 rounded-lg shadow-lg' : ''}`}> {/* Optional frame */}
                                <img 
                                    src={imageUrl} 
                                    alt={`Opción preferencia ${config.files[0].name || 1}`}
                                    className="max-w-sm md:max-w-md max-h-[400px] object-contain rounded" // Adjust size as needed
                                />
                             </div>
                         ) : (
                             // Fallback if image URL is somehow missing despite not being mock
                             <div className="text-neutral-500 italic">No se pudo cargar la imagen de preferencia.</div>
                         )}
                     </div>
                     
                     {/* Botón Siguiente (Simulado) */}
                     <div className="flex justify-center">
                        <button 
                             onClick={() => onStepComplete(isMock ? config.options[0] : config.files[0]?.id || 'selected_image')} // Pass mock option or file id
                             className="bg-primary-600 hover:bg-primary-700 text-white font-medium py-2 px-6 rounded-lg transition-colors">
                             Siguiente
                        </button>
                     </div>
                 </div>,
                 isMock // Pass the mock flag
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

        // <<< NUEVO CASE para smartvoc_cv >>>
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
        
        // <<< NUEVO CASE para smartvoc_nps >>>
        case 'smartvoc_nps': { 
             if (!onStepComplete) return null;
             const isMock = !stepConfig || !stepConfig.questionText;
             const config = isMock ? { questionText: 'Pregunta NPS (Prueba)?', leftLabel: 'Nada probable', rightLabel: 'Muy probable' } : stepConfig;

            return renderStepWithWarning(
                 <div className="bg-white p-8 rounded-lg shadow-md max-w-lg w-full">
                     <h2 className="text-xl font-medium mb-3 text-neutral-700">{stepName || 'NPS'}</h2>
                     <p className="text-neutral-600 mb-4">{config.questionText}</p>
                     <div className="flex justify-between text-xs text-neutral-500 mb-1">
                         <span>{config.leftLabel}</span>
                         <span>{config.rightLabel}</span>
                     </div>
                     <div className="flex flex-wrap justify-center gap-2 mb-4">
                         {[...Array(11)].map((_, i) => (
                             <button key={i} className="w-8 h-8 border border-neutral-300 rounded-full hover:bg-neutral-100 focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm">{i}</button>
                         ))}
                     </div>
                     <button onClick={() => onStepComplete(8)} className="bg-primary-600 hover:bg-primary-700 text-white font-medium py-2 px-6 rounded-lg transition-colors">Siguiente</button>
                 </div>,
                 isMock
             );
            } 
        
        // <<< NUEVO CASE para smartvoc_nev >>>
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