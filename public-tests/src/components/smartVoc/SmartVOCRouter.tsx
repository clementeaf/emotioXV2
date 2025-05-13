import React, { useState, useCallback, useEffect } from 'react';
// --- Importar Interfaces Compartidas --- 
import { 
    SmartVOCFormData, 
    SmartVOCQuestion, 
    CSATConfig as ConfigCSAT, 
    NEVConfig as ConfigNEV, 
    VOCConfig as ConfigVOC, 
    CESConfig 
} from '../../../../shared/interfaces/smart-voc.interface';
// --- Exportar Interfaces para componentes hijos --- 
export type { SmartVOCQuestion, ConfigCSAT, ConfigNEV, ConfigVOC, CESConfig };

// --- Interfaz de Props Actualizada --- 
interface SmartVOCRouterProps {
  researchId: string; 
  stepId: string; // ID del paso general SmartVOC (no de la pregunta individual)
  title?: string; // Título del paso general
  instructions?: string; // Instrucciones del paso general
  stepConfig: SmartVOCFormData; // La configuración específica parseada (contiene questions)
  onComplete: (answers: Record<string, any>) => void; 
  onError: (error: string) => void; 
}

// --- Componentes de Preguntas (Importaciones) ---
import { ScaleQuestion } from './questions/ScaleQuestion'; 
// Eliminar: import { CSATQuestion } from './questions/CSATQuestion'; 
import CSATView from './CSATView'; // <<< IMPORTAR CSATView directamente
import { NEVQuestion } from './questions/NEVQuestion'; 
import { VOCTextQuestion } from './questions/VOCTextQuestion'; 
import { useResponseAPI } from '../../hooks/useResponseAPI';
// <<< IMPORTAR useParticipantStore >>>
import { useParticipantStore } from '../../stores/participantStore'; // Ajusta la ruta si es diferente

// --- Componente Principal SmartVOCRouter --- 

export const SmartVOCRouter: React.FC<SmartVOCRouterProps> = ({ 
    researchId, 
    stepId: generalStepId, // Renombrar para evitar confusión con question.id
    title, 
    instructions, 
    stepConfig, 
    onComplete, 
    onError 
}) => {

  const participantIdFromStore = useParticipantStore(state => state.participantId);
  const tokenFromStore = useParticipantStore(state => state.token); 

  if (!participantIdFromStore) {
    return <div className="p-6 text-center text-gray-600">Cargando información del participante...</div>;
  }
  // <<< FIN DE CAMBIO >>>

  console.log('[SmartVOCRouter] Received Props & Store State (participantId available):', { researchId, participantId: participantIdFromStore, generalStepId, title, instructions, stepConfig });

  const [answers, setAnswers] = useState<Record<string, any>>({}); 
  const [errors, setErrors] = useState<Record<string, string>>({}); 
  // Almacenar los IDs de las respuestas de la API para cada pregunta, para PUT subsecuentes
  const [moduleResponseIds, setModuleResponseIds] = useState<Record<string, string>>({});

  // <<< NUEVO useEffect para inicializar answers y moduleResponseIds >>>
  useEffect(() => {
    if (stepConfig && Array.isArray(stepConfig.questions)) {
      const initialAnswers: Record<string, any> = {};
      const initialModuleResponseIds: Record<string, string> = {};
      let foundInitialData = false;

      stepConfig.questions.forEach(question => {
        // ASUNCIÓN: `question` ahora tiene una propiedad `savedResponseData` (nombre de ejemplo)
        // que contiene el objeto de respuesta individual de la API module-responses para esta pregunta.
        const savedResponse = (question as any).savedResponseData; // Usar `as any` temporalmente hasta actualizar interfaces

        if (savedResponse && savedResponse.id) { // 'id' del nivel superior del objeto de respuesta es el moduleResponseId
          initialModuleResponseIds[question.id] = savedResponse.id;
          foundInitialData = true;
          
          // Acceder al valor de la respuesta anidado
          if (savedResponse.response?.data?.response?.value !== undefined) {
            initialAnswers[question.id] = savedResponse.response.data.response.value;
          }
        }
      });

      if (foundInitialData) {
        console.log('[SmartVOCRouter] Initializing with SAVED RESPONSE data from stepConfig questions:', { initialAnswers, initialModuleResponseIds });
        setAnswers(prevAnswers => ({ ...prevAnswers, ...initialAnswers }));
        setModuleResponseIds(prevModuleResponseIds => ({ ...prevModuleResponseIds, ...initialModuleResponseIds }));
      }
    }
  }, [stepConfig]);

  const {
    saveOrUpdateResponse,
    isLoading: isApiLoading,
    error: apiError,        
    setError: setApiError   
  } = useResponseAPI({ 
      researchId, 
      participantId: participantIdFromStore as string 
  });


  const handleAnswerChange = useCallback(async (question: SmartVOCQuestion, answer: any) => {
    setAnswers(prevAnswers => ({
      ...prevAnswers,
      [question.id]: answer
    }));
    if (errors[question.id]) {
      setErrors(prevErrors => {
        const newErrors = { ...prevErrors };
        delete newErrors[question.id];
        return newErrors;
      });
    }
    if (apiError) setApiError(null); 

    if (!participantIdFromStore) { 
        setApiError("Participant ID no disponible. No se puede guardar la respuesta.");
        console.error("[SmartVOCRouter] Participant ID no disponible en handleAnswerChange.");
        return;
    }

    const stepIdForApi = question.id;
    const stepTypeForApi = question.type;
    const stepNameForApi = question.title || question.id; 
    const existingResponseId = moduleResponseIds[question.id] || (question as any).savedResponseData?.id; // Fallback a la info de la respuesta guardada

    const result = await saveOrUpdateResponse(
      stepIdForApi,
      stepTypeForApi,
      stepNameForApi,
      answer, 
      existingResponseId
    );

    if (result && result.id && !existingResponseId) { 
      setModuleResponseIds(prev => ({ ...prev, [question.id]: result.id }));
    }
    // Si apiError se setea en el hook, ya estará disponible.

  }, [errors, apiError, researchId, participantIdFromStore, saveOrUpdateResponse, moduleResponseIds, setApiError, stepConfig.questions]); // Añadido stepConfig.questions como dependencia

  const validateForm = (): boolean => {
    if (apiError) {
        console.warn('[SmartVOCRouter] Intento de completar con error de API pendiente:', apiError);
        return false;
    }
    const validationErrors: Record<string, string> = {};
    let isValid = true;
    if (!stepConfig?.questions) {
        onError('Error interno: No se encontraron preguntas en la configuración.');
        return false;
    }
    stepConfig.questions.forEach(question => {
      // No validar CSAT aquí si CSATView maneja su propia validación y submit
      if (question.type !== 'CSAT' && question.required && (answers[question.id] === undefined || answers[question.id] === null || answers[question.id] === '')) {
        validationErrors[question.id] = 'Esta pregunta es obligatoria.';
        isValid = false;
      }
    });
    setErrors(validationErrors);
    return isValid;
  };

  const handleCompleteClick = () => {
    if (validateForm()) {
      console.log('[SmartVOCRouter] Formulario válido. Respuestas:', answers);
      onComplete(answers); 
    } else {
      console.warn('[SmartVOCRouter] Formulario inválido. Errores:', errors);
    }
  };

  if (!stepConfig || !Array.isArray(stepConfig.questions)) {
     onError("Error interno: Configuración inválida o faltan preguntas para SmartVOC.");
     return <div className="p-4 text-red-600 bg-red-100 border border-red-300 rounded">Error configuración.</div>;
  }

  const questionsToRender = stepConfig.questions;

  return (
    <div className="p-4 md:p-6 border rounded shadow-md w-full max-w-3xl flex flex-col space-y-6">
      <div>
          <h2 className="text-xl md:text-2xl font-bold mb-2">{title || 'Encuesta Rápida'}</h2>
          {instructions && <p className="text-sm md:text-base text-gray-600 mb-4">{instructions}</p>}
      </div>
      
      <div className="space-y-8">
          {questionsToRender.map((question, index) => {
              let QuestionComponent: React.FC<any>;
              let questionProps: any = { key: question.id || index }; 

              switch (question.type) {
                  case 'CSAT':
                      QuestionComponent = CSATView; 
                      questionProps = {
                          ...questionProps,
                          researchId: researchId,
                          token: tokenFromStore, 
                          stepId: question.id,
                          stepName: question.title || question.id,
                          stepType: question.type, 
                          questionText: question.title || 'Por favor, califica tu satisfacción.',
                          instructions: question.description, 
                          companyName: question.config?.companyName,
                          initialValue: answers[question.id], 
                          config: question.config, 
                          onStepComplete: (dataFromCSAT?: { success: boolean, data?: any, value?: any }) => {
                              console.log(`[SmartVOCRouter] CSAT Question ${question.id} completed:`, dataFromCSAT);
                              if (dataFromCSAT?.success) {
                                  const answervalue = dataFromCSAT.data?.value !== undefined ? dataFromCSAT.data.value : dataFromCSAT.value;
                                  if (answervalue !== undefined) {
                                      setAnswers(prevAnswers => ({
                                          ...prevAnswers,
                                          [question.id]: answervalue
                                      }));
                                  }
                                  if (dataFromCSAT.data?.id) {
                                      setModuleResponseIds(prev => ({ ...prev, [question.id]: dataFromCSAT.data.id }));
                                  }
                              }
                          },
                      };
                      console.log(`[SmartVOCRouter] Para CSAT question ${question.id}, props a enviar A CSATVIEW (sin participantId directo):`, 
                                  { researchId: questionProps.researchId, stepId: questionProps.stepId });
                      break;
                  case 'CES':
                  case 'CV':
                  case 'NPS': 
                      QuestionComponent = ScaleQuestion; 
                      questionProps = {
                          ...questionProps,
                          questionConfig: question,
                          value: answers[question.id],
                          onChange: (answerValue: any) => handleAnswerChange(question, answerValue)
                      };
                      break;
                  case 'NEV': 
                      QuestionComponent = NEVQuestion;
                      questionProps = {
                          ...questionProps,
                          questionConfig: question,
                          value: answers[question.id],
                          onChange: (answerValue: any) => handleAnswerChange(question, answerValue)
                      };
                      break;
                  case 'VOC': 
                      QuestionComponent = VOCTextQuestion;
                      questionProps = {
                          ...questionProps,
                          questionConfig: question,
                          value: answers[question.id],
                          onChange: (answerValue: any) => handleAnswerChange(question, answerValue)
                      };
                      break;
                  default:
                       return (
                            <div key={question.id || index} className="p-4 bg-red-50 border border-red-200 rounded">
                                <p className="font-semibold text-red-700">Error: Tipo de pregunta no soportado '{question.type}'</p>
                                <pre className="text-xs text-red-600 mt-2">{JSON.stringify(question, null, 2)}</pre>
                            </div>
                       );
              }

              return (
                  <div className={`p-4 border rounded-lg shadow-sm ${errors[question.id] || (apiError && question.type !== 'CSAT' && moduleResponseIds[question.id] === undefined) ? 'border-red-400 bg-red-50' : 'border-gray-200'}`}>
                      <QuestionComponent {...questionProps} />
                      {errors[question.id] && <p className="text-xs text-red-600 mt-1">{errors[question.id]}</p>}
                  </div>
              );
          })}
      </div>

      <div className="mt-6 pt-6 border-t border-gray-200 flex justify-end">
          <button 
            onClick={handleCompleteClick} 
            className={`px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 ${
                (isApiLoading && Object.values(answers).some(ans => ans !== undefined)) ? 'opacity-50 cursor-not-allowed' : '' // Deshabilitar si el hook general está ocupado Y hay alguna respuesta pendiente (evita deshabilitar si es CSATView el que está ocupado)
            }`}
            disabled={isApiLoading && Object.values(answers).some(ans => ans !== undefined) && stepConfig.questions.some(q => q.type !== 'CSAT')} // Más preciso
          >
            {isApiLoading && stepConfig.questions.some(q => q.type !== 'CSAT') ? 'Guardando...' : 'Siguiente'}
          </button>
      </div>
    </div>
  );
}; 