import React, { useState, useCallback, useEffect, useMemo } from 'react';
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
import { ApiClient, APIStatus } from '../../lib/api'; // <<< AÑADIR ApiClient y APIStatus

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
  const apiClient = useMemo(() => new ApiClient(), []); // <<< AÑADIR instancia de ApiClient

  // <<< ESTADO PARA CARGA DE DATOS PROPIOS >>>
  const [isLoadingInitialData, setIsLoadingInitialData] = useState<boolean>(true);

  if (!participantIdFromStore) {
    return <div className="p-6 text-center text-gray-600">Cargando información del participante... (SmartVOCRouter)</div>;
  }

  const [answers, setAnswers] = useState<Record<string, any>>({}); 
  const [errors, setErrors] = useState<Record<string, string>>({}); 
  // Almacenar los IDs de las respuestas de la API para cada pregunta, para PUT subsecuentes
  const [moduleResponseIds, setModuleResponseIds] = useState<Record<string, string>>({});

  // <<< useEffect MODIFICADO para cargar datos directamente >>>
  useEffect(() => {
    if (!researchId || !participantIdFromStore || !stepConfig?.questions || stepConfig.questions.length === 0) {
      setIsLoadingInitialData(false);
      console.warn('[SmartVOCRouter] No se cargaron datos iniciales: faltan researchId, participantId o preguntas en stepConfig.');
      return;
    }

    setIsLoadingInitialData(true);
    console.log('[SmartVOCRouter] Iniciando carga de datos iniciales desde API...');

    apiClient.getModuleResponses(researchId, participantIdFromStore)
      .then(apiResponse => {
        const initialAnswers: Record<string, any> = {};
        const initialModuleResponseIds: Record<string, string> = {};
        let foundInitialData = false;

        if (apiResponse.data?.data && Array.isArray(apiResponse.data.data.responses)) {
          const allSavedResponses = apiResponse.data.data.responses;
          console.log('[SmartVOCRouter] Respuestas obtenidas de API:', allSavedResponses);

          stepConfig.questions.forEach(question => {
            // Intenta encontrar la respuesta guardada para esta pregunta.
            // Asumimos que `question.id` es el `stepId` usado al guardar la respuesta individual.
            // O que `question.type` (ej. 'smartvoc_csat') es el `stepType` y `generalStepId` es el `moduleId`.
            const savedResponse = allSavedResponses.find(
              (r: any) => (r.stepType === question.type && r.moduleId === generalStepId) || // Preferido si hay moduleId
                           (r.stepId === question.id) // Fallback si no hay moduleId y stepId es el ID de la pregunta
            );

            if (savedResponse && savedResponse.id) { 
              initialModuleResponseIds[question.id] = savedResponse.id;
              foundInitialData = true;
              
              let valueToSet;
              if (question.type === 'CSAT' && savedResponse.response?.data?.response?.value !== undefined) {
                valueToSet = savedResponse.response.data.response.value;
              } else if (savedResponse.response?.value !== undefined) { // Intento genérico para otros tipos
                valueToSet = savedResponse.response.value;
              } else if (typeof savedResponse.response === 'string' || typeof savedResponse.response === 'number' || Array.isArray(savedResponse.response)) {
                valueToSet = savedResponse.response; // Si la respuesta es el valor mismo
              }

              if (valueToSet !== undefined) {
                initialAnswers[question.id] = valueToSet;
                console.log(`[SmartVOCRouter] Pregunta ${question.id} (${question.type}): Valor inicial seteado a`, valueToSet, `desde responseId: ${savedResponse.id}`);
              } else {
                console.warn(`[SmartVOCRouter] Pregunta ${question.id} (${question.type}): Se encontró respuesta (id: ${savedResponse.id}) pero no se pudo extraer el valor.`);
              }
            }
          });
        } else {
          if (apiResponse.apiStatus !== APIStatus.NOT_FOUND) {
            console.error('[SmartVOCRouter] Error obteniendo respuestas de API o formato inesperado:', apiResponse.message);
            // Considerar setear un error global para el router si es necesario.
          }
        }

        if (foundInitialData) {
          console.log('[SmartVOCRouter] Datos iniciales procesados:', { initialAnswers, initialModuleResponseIds });
          setAnswers(prevAnswers => ({ ...prevAnswers, ...initialAnswers }));
          setModuleResponseIds(prevModuleResponseIds => ({ ...prevModuleResponseIds, ...initialModuleResponseIds }));
        }
      })
      .catch(err => {
        console.error('[SmartVOCRouter] Excepción cargando datos iniciales:', err);
      })
      .finally(() => {
        setIsLoadingInitialData(false);
        console.log('[SmartVOCRouter] Carga de datos iniciales finalizada.');
      });

  }, [researchId, participantIdFromStore, stepConfig.questions, apiClient, generalStepId]); // generalStepId añadido

  const {
    saveOrUpdateResponse,
    isLoading: isApiLoading,
    error: apiError,        
    setError: setApiError   
  } = useResponseAPI({ 
      researchId,
      // Asegurarse que participantIdFromStore no sea null/undefined aquí. Si lo es, el hook podría fallar.
      // El if de participantIdFromStore al inicio del componente debería prevenir esto para renderizado, pero no para la inicialización del hook.
      participantId: participantIdFromStore || '' // O manejar de otra forma si es null al inicio
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

  // <<< ESTADO DE CARGA PARA LA UI >>>
  if (isLoadingInitialData) {
    return <div className="p-6 text-center text-gray-600">Cargando datos del formulario SmartVOC...</div>;
  }

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
                      const csatInitialValue = answers[question.id];
                      const csatModuleResponseId = moduleResponseIds[question.id];

                      // <<< INICIO DEL CONSOLE.LOG AÑADIDO >>>
                      console.log(`[SmartVOCRouter - Pre-render CSATView] Para question.id: ${question.id}`, {
                          questionType: question.type,
                          researchId: researchId,
                          stepIdForCSAT: question.id, // Este es el stepId que CSATView usará
                          generalStepIdForModule: generalStepId, // ID del módulo SmartVOCRouter
                          titleForCSAT: question.title || question.id,
                          initialValueToPass: csatInitialValue,
                          moduleResponseIdToPass: csatModuleResponseId,
                          fullAnswersState: answers,
                          fullModuleResponseIdsState: moduleResponseIds
                      });
                      // <<< FIN DEL CONSOLE.LOG AÑADIDO >>>

                      questionProps = {
                          ...questionProps,
                          researchId: researchId,
                          token: tokenFromStore, 
                          stepId: question.id, // ID de la pregunta CSAT individual
                          stepName: question.title || question.id,
                          stepType: question.type, 
                          questionText: question.title || 'Por favor, califica tu satisfacción.',
                          instructions: question.description, 
                          companyName: question.config?.companyName,
                          initialValue: csatInitialValue, 
                          config: { ...(question.config || {}), moduleResponseId: csatModuleResponseId }, 
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
                                  if (dataFromCSAT.data?.id) { // Asumiendo que data.id es el moduleResponseId actualizado/creado
                                      setModuleResponseIds(prev => ({ ...prev, [question.id]: dataFromCSAT.data.id }));
                                  }
                              }
                          },
                      };
                      // console.log(`[SmartVOCRouter] Para CSAT question ${question.id}, props a enviar A CSATVIEW (sin participantId directo):`,
                      //             { researchId: questionProps.researchId, stepId: questionProps.stepId });
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
                  <div className={`p-4 border rounded-lg shadow-sm ${errors[question.id] || (apiError && question.type !== 'CSAT' /*&& moduleResponseIds[question.id] === undefined*/) ? 'border-red-400 bg-red-50' : 'border-gray-200'}`}>
                      <QuestionComponent {...questionProps} />
                      {errors[question.id] && <p className="text-xs text-red-600 mt-1">{errors[question.id]}</p>}
                      {/* Mostrar error de API general para preguntas no CSAT si aplica */}
                      {apiError && question.type !== 'CSAT' && <p className="text-xs text-red-600 mt-1">Error API: {apiError}</p>}
                  </div>
              );
          })}
      </div>

      <div className="mt-6 pt-6 border-t border-gray-200 flex justify-end">
          <button 
            onClick={handleCompleteClick} 
            className={`px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 ${
                (isApiLoading && Object.values(answers).some(ans => ans !== undefined)) ? 'opacity-50 cursor-not-allowed' : ''
            }`}
            disabled={isApiLoading && Object.values(answers).some(ans => ans !== undefined) && stepConfig.questions.some(q => q.type !== 'CSAT')} 
          >
            {isApiLoading && stepConfig.questions.some(q => q.type !== 'CSAT') ? 'Guardando...' : 'Siguiente'}
          </button>
      </div>
    </div>
  );
}; 