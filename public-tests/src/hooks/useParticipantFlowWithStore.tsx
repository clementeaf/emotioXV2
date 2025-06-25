import { useCallback, useEffect } from 'react';
import type { ParticipantInfo } from '../stores/participantStore';
import { useParticipantStore } from '../stores/participantStore';
import { ExpandedStep, ParticipantFlowStep } from '../types/flow';

// API URL constante
const API_BASE_URL = 'https://d5x2q3te3j.execute-api.us-east-1.amazonaws.com/dev';

// Mapeo de tipos SmartVOC a tipos frontend
const smartVOCTypeMap: { [key: string]: string } = {
  'CSAT': 'smartvoc_csat',
  'CES': 'smartvoc_ces',
  'CV': 'smartvoc_cv',
  'NPS': 'smartvoc_nps',
  'NEV': 'smartvoc_nev',
  'VOC': 'smartvoc_feedback',
};

// Nuevo mapeo para tipos de eye-tracking
const eyeTrackingTypeMap: { [key: string]: string } = {
  'HEATMAP': 'eye_tracking_heatmap',
  'GAZE': 'eye_tracking_gaze',
  'FIXATION': 'eye_tracking_fixation',
  'SACCADE': 'eye_tracking_saccade',
  'GENERAL': 'eye_tracking_general',
};

/**
 * Hook para gestionar el flujo de participantes utilizando la tienda Zustand
 */
export const useParticipantFlowWithStore = (researchId: string | undefined) => {
  // Obtener el estado y las acciones de la tienda
  const {
    token,
    setToken,
    currentStep,
    setCurrentStep,
    error,
    setError,
    expandedSteps,
    setExpandedSteps,
    currentStepIndex,
    setCurrentStepIndex,
    isFlowLoading,
    setResearchId,
    maxVisitedIndex,
    goToNextStep,
    navigateToStep,
    getStepResponse,
    hasStepBeenAnswered,
    getAnsweredStepIndices,
    getResponsesJson,
    completedRelevantSteps,
    totalRelevantSteps,
    resetStore,
    handleLoginSuccess: storeHandleLoginSuccess,
    responsesData
  } = useParticipantStore();

  // Función para manejar errores
  const handleError = useCallback((errorMessage: string, step: ParticipantFlowStep | string) => {
    const stepName = typeof step === 'string' ? step : ParticipantFlowStep[step];
    console.error(`[useParticipantFlowWithStore] Error en ${stepName}:`, errorMessage);
    setError(`Error en ${stepName}: ${errorMessage}`);
    setCurrentStep(ParticipantFlowStep.ERROR);
  }, [setError, setCurrentStep]);

  // Función para construir los pasos expandidos según la secuencia requerida
  const buildExpandedSteps = useCallback(async (currentResearchId: string, currentToken: string) => {
    console.log("[useParticipantFlowWithStore] Iniciando construcción de pasos expandidos...");
    const finalSteps: ExpandedStep[] = [];

    try {
      // 1. Añadir Preguntas demográficas
      finalSteps.push({
        id: 'demographic',
        name: 'Preguntas demográficas',
        type: 'demographic',
        config: {
          title: 'Preguntas demográficas',
          description: 'Por favor, responde a unas breves preguntas demográficas antes de comenzar.'
        }
      });

      // 2. PRIMERO: Obtener datos de eye-tracking
      try {
        const eyeTrackingUrl = `${API_BASE_URL}/research/${currentResearchId}/eye-tracking`;
        console.log(`[useParticipantFlowWithStore] Fetching Eye Tracking: ${eyeTrackingUrl}`);
        const eyeTrackingResponse = await fetch(eyeTrackingUrl, {
          headers: { 'Authorization': `Bearer ${currentToken}` }
        });

        if (eyeTrackingResponse.ok) {
          const eyeTrackingData = await eyeTrackingResponse.json();
          const eyeTrackingQuestions = eyeTrackingData?.questions || eyeTrackingData?.data?.questions || [];
          console.log(`[useParticipantFlowWithStore] Eye Tracking: ${eyeTrackingQuestions.length} elementos recibidos.`);

          // Iterar sobre elementos de eye-tracking
          for (const question of eyeTrackingQuestions) {
            const frontendType = eyeTrackingTypeMap[question.type?.toUpperCase()] || 'eye_tracking_general';
            finalSteps.push({
              id: question.id || `${frontendType}_${finalSteps.length}`,
              name: question.title || `Eye Tracking: ${question.type || 'Elemento'}`,
              type: frontendType,
              config: question
            });
          }
        } else {
          console.warn(`[useParticipantFlowWithStore] Fetch Eye Tracking falló (${eyeTrackingResponse.status}), continuando con el flujo.`);
        }
      } catch (eyeTrackingError: unknown) {
        console.error('[useParticipantFlowWithStore] Error obteniendo datos de eye-tracking:', eyeTrackingError);
        // No detenemos el flujo por este error
      }

      // 3. SEGUNDO: Añadir Bienvenida
      finalSteps.push({
        id: 'welcome',
        name: 'Bienvenida',
        type: 'welcome',
        config: {
          title: '¡Bienvenido!',
          message: 'Gracias por tu tiempo.'
        }
      });

      // 4. Obtener estructura de flujo completo (todos los módulos)
      try {
        const flowUrl = `${API_BASE_URL}/research/${currentResearchId}/flow`;
        console.log(`[useParticipantFlowWithStore] Fetching Research Flow: ${flowUrl}`);
        const flowResponse = await fetch(flowUrl, { headers: { 'Authorization': `Bearer ${currentToken}` } });

        if (flowResponse.ok) {
          const flowData = await flowResponse.json();
          const moduleSteps = flowData?.data || [];
          console.log(`[useParticipantFlowWithStore] Estructura de flujo recibida: ${moduleSteps.length} módulos encontrados`);

          // Procesar cada módulo según su tipo
          for (const step of moduleSteps) {
            console.log(`[useParticipantFlowWithStore] Procesando módulo: ${step.type}`);
            // Añadir lógica para procesar otros tipos de módulos aquí
          }
        }
      } catch (flowError: unknown) {
        console.error('[useParticipantFlowWithStore] Error obteniendo estructura de flujo:', flowError);
        // Continuar con los módulos conocidos sin detener por error
      }

      // 5. TERCERO: Procesar Cognitive Task (después de welcome-screen)
      try {
        const url = `${API_BASE_URL}/research/${currentResearchId}/cognitive-task`;
        console.log(`[useParticipantFlowWithStore] Fetching Cognitive Task: ${url}`);
        const response = await fetch(url, { headers: { 'Authorization': `Bearer ${currentToken}` } });
        if (response.ok) {
          const data = await response.json();
          const realCognitiveQuestions = data?.questions || [];
          console.log(`[useParticipantFlowWithStore] Cognitive Task: ${realCognitiveQuestions.length} preguntas recibidas.`);

          // LOG ESPECÍFICO PARA DEPURAR HITZONES
          console.log('[useParticipantFlowWithStore] 🎯 HITZONE DEBUG - Raw backend data:', JSON.stringify(data, null, 2));

          // Verificar preguntas navigation_flow específicamente
          const navigationQuestions = realCognitiveQuestions.filter((q: any) => q.type === 'navigation_flow');
          if (navigationQuestions.length > 0) {
            console.log(`[useParticipantFlowWithStore] 🎯 Found ${navigationQuestions.length} navigation_flow questions`);
            navigationQuestions.forEach((q: any, idx: number) => {
              console.log(`[useParticipantFlowWithStore] 🎯 Navigation Question ${idx}:`, q);
              if (q.files && q.files.length > 0) {
                q.files.forEach((file: any, fileIdx: number) => {
                  console.log(`[useParticipantFlowWithStore] 🎯 File ${fileIdx} hitZones:`, file.hitZones);
                  console.log(`[useParticipantFlowWithStore] 🎯 File ${fileIdx} keys:`, Object.keys(file));
                });
              }
            });
          }

          // Iterar sobre preguntas cognitivas
          for (const question of realCognitiveQuestions) {
            const frontendType = `cognitive_${question.type}`;
            finalSteps.push({
              id: question.id || `${frontendType}_${finalSteps.length}`,
              name: question.title || `Cognitiva: ${question.type || 'Desconocido'}`,
              type: frontendType,
              config: question
            });
          }
        } else {
          console.error(`[useParticipantFlowWithStore] Fetch Cognitive Task falló (${response.status} ${response.statusText}).`);
          // Mostrar error pero no detener el flujo
          console.warn(`Error al cargar tareas cognitivas (${response.status})`);
        }
      } catch (fetchError: unknown) {
        console.error('[useParticipantFlowWithStore] Excepción fetching Cognitive Task:', fetchError);
        const errorMsg = (fetchError && typeof fetchError === 'object' && 'message' in fetchError)
          ? (fetchError as { message?: string }).message
          : 'Error de red cargando tareas cognitivas';
        console.warn(errorMsg);
      }

      // 6. CUARTO: Procesar SmartVOC (después de cognitive-task)
      try {
        const url = `${API_BASE_URL}/research/${currentResearchId}/smart-voc`;
        console.log(`[useParticipantFlowWithStore] Fetching SmartVOC: ${url}`);
        const response = await fetch(url, { headers: { 'Authorization': `Bearer ${currentToken}` } });
        if (response.ok) {
          const data = await response.json();
          const realSmartVOCQuestions = data?.data?.questions || data?.questions || [];
          console.log(`[useParticipantFlowWithStore] SmartVOC: ${realSmartVOCQuestions.length} preguntas recibidas.`);

          // Iterar sobre preguntas SmartVOC
          for (const question of realSmartVOCQuestions) {
            const frontendType = smartVOCTypeMap[question.type?.toUpperCase()];
            if (!frontendType) {
              console.warn(`[useParticipantFlowWithStore] No hay mapeo frontend para tipo SmartVOC API: ${question.type}`);
              continue;
            }
            finalSteps.push({
              id: question.id || `${frontendType}_${finalSteps.length}`,
              name: question.title || `Feedback: ${question.type || 'Desconocido'}`,
              type: frontendType,
              config: question
            });
          }
        } else {
          console.error(`[useParticipantFlowWithStore] Fetch SmartVOC falló (${response.status} ${response.statusText}).`);
        }
      } catch (fetchError: unknown) {
        console.error('[useParticipantFlowWithStore] Excepción fetching SmartVOC:', fetchError);
      }

      // 7. Obtener y procesar otros módulos potenciales genéricamente
      try {
        // Endpoint para obtener lista de todos los módulos disponibles
        const modulesUrl = `${API_BASE_URL}/research/${currentResearchId}/modules`;
        console.log(`[useParticipantFlowWithStore] Fetching Modules List: ${modulesUrl}`);
        const modulesResponse = await fetch(modulesUrl, {
          headers: { 'Authorization': `Bearer ${currentToken}` },
          // Usar método HEAD para verificar si el endpoint existe
          method: 'HEAD'
        });

        // Solo proceder si el endpoint existe
        if (modulesResponse.ok) {
          const modulesListResponse = await fetch(modulesUrl, {
            headers: { 'Authorization': `Bearer ${currentToken}` }
          });

          if (modulesListResponse.ok) {
            const modulesList = await modulesListResponse.json();
            const modules = modulesList?.modules || [];

            // Procesar cada módulo de la lista
            for (const module of modules) {
              // Evitar procesar módulos ya manejados anteriormente
              if (['cognitive_task', 'smartvoc', 'eye_tracking'].includes(module.type)) {
                continue;
              }

              // Obtener preguntas para este módulo específico
              try {
                const moduleUrl = `${API_BASE_URL}/research/${currentResearchId}/${module.type}`;
                console.log(`[useParticipantFlowWithStore] Fetching Module ${module.type}: ${moduleUrl}`);
                const moduleResponse = await fetch(moduleUrl, {
                  headers: { 'Authorization': `Bearer ${currentToken}` }
                });

                if (moduleResponse.ok) {
                  const moduleData = await moduleResponse.json();
                  const questions = moduleData?.questions || [];

                  // Procesar preguntas del módulo
                  for (const question of questions) {
                    const frontendType = `${module.type}_${question.type || 'question'}`;
                    finalSteps.push({
                      id: question.id || `${frontendType}_${finalSteps.length}`,
                      name: question.title || `${module.name}: ${question.type || 'Pregunta'}`,
                      type: frontendType,
                      config: question
                    });
                  }
                }
              } catch (moduleError: unknown) {
                console.error(`[useParticipantFlowWithStore] Error obteniendo módulo ${module.type}:`, moduleError);
              }
            }
          }
        }
      } catch (modulesError: unknown) {
        console.error('[useParticipantFlowWithStore] Error obteniendo lista de módulos:', modulesError);
      }

      // 8. y 9. Añadir preguntas de feedback (módulo e imagen)
      // PRIMERO: Intentar obtener configuración desde el backend (una sola petición)
      let moduleFeedbackConfig = null;
      let imageFeedbackConfig = null;
      let isModuleFeedbackHardcoded = false;
      let isImageFeedbackHardcoded = false;

      try {
        console.log(`[useParticipantFlowWithStore] Intentando obtener configuración de feedback desde backend para researchId: ${currentResearchId}`);
        const formsUrl = `${API_BASE_URL}/research/${currentResearchId}/forms`;
        const formsResponse = await fetch(formsUrl, {
          headers: { 'Authorization': `Bearer ${currentToken}` }
        });

        if (formsResponse.ok) {
          const formsData = await formsResponse.json();
          console.log('[useParticipantFlowWithStore] Respuesta de forms:', formsData);

          if (formsData?.data && Array.isArray(formsData.data)) {
            // Buscar configuración específica de feedback del módulo
            const feedbackForm = formsData.data.find((form: any) =>
              form.derivedType === 'feedback' ||
              form.derivedType === 'module_feedback' ||
              form.originalSk === 'FEEDBACK' ||
              (form.config && (
                form.config.type === 'feedback' ||
                form.config.type === 'module_feedback'
              ))
            );

            if (feedbackForm && feedbackForm.config) {
              console.log('[useParticipantFlowWithStore] ✅ Configuración de feedback del módulo encontrada en backend:', feedbackForm);
              moduleFeedbackConfig = {
                id: feedbackForm.id || 'module_feedback',
                title: feedbackForm.config.title || '¿Qué te ha parecido el módulo?',
                questionText: feedbackForm.config.questionText || feedbackForm.config.description || 'Por favor, comparte tu opinión sobre este módulo',
                description: feedbackForm.config.description,
                required: feedbackForm.config.required || false,
                type: 'feedback'
              };
            }

            // Buscar configuración específica de feedback de imagen
            const imageFeedbackForm = formsData.data.find((form: any) =>
              form.derivedType === 'image_feedback' ||
              form.derivedType === 'image-feedback' ||
              form.originalSk === 'IMAGE_FEEDBACK' ||
              (form.config && (
                form.config.type === 'image_feedback' ||
                form.config.type === 'image-feedback'
              ))
            );

            if (imageFeedbackForm && imageFeedbackForm.config) {
              console.log('[useParticipantFlowWithStore] ✅ Configuración de feedback de imagen encontrada en backend:', imageFeedbackForm);
              imageFeedbackConfig = {
                id: imageFeedbackForm.id || 'image_feedback',
                title: imageFeedbackForm.config.title || '¿Qué te parece esta imagen?',
                questionText: imageFeedbackForm.config.questionText || imageFeedbackForm.config.description || 'Por favor, comparte tu opinión sobre esta imagen',
                description: imageFeedbackForm.config.description,
                imageUrl: imageFeedbackForm.config.imageUrl || 'https://via.placeholder.com/300',
                required: imageFeedbackForm.config.required || false,
                type: 'image_feedback'
              };
            }
          }
        } else {
          console.log(`[useParticipantFlowWithStore] Endpoint forms no disponible (${formsResponse.status}), usando fallback`);
        }
      } catch (formsError: unknown) {
        console.log('[useParticipantFlowWithStore] Error obteniendo configuración de forms, usando fallback:', formsError);
      }

      // Configurar fallbacks hardcodeados si no se obtuvieron del backend
      if (!moduleFeedbackConfig) {
        console.warn('[useParticipantFlowWithStore] ⚠️ USANDO CONFIGURACIÓN HARDCODEADA para feedback del módulo - considera configurar esto en el backend');
        isModuleFeedbackHardcoded = true;
        moduleFeedbackConfig = {
          id: 'module_feedback',
          title: '¿Qué te ha parecido el módulo?',
          questionText: 'Por favor, comparte tu opinión sobre este módulo',
          description: 'Aquí puedes describir tu primera impresión de este módulo',
          required: false,
          type: 'feedback'
        };
      }

      if (!imageFeedbackConfig) {
        console.warn('[useParticipantFlowWithStore] ⚠️ USANDO CONFIGURACIÓN HARDCODEADA para feedback de imagen - considera configurar esto en el backend');
        isImageFeedbackHardcoded = true;
        imageFeedbackConfig = {
          id: 'image_feedback',
          title: '¿Qué te parece esta imagen?',
          questionText: 'Por favor, comparte tu opinión sobre esta imagen',
          imageUrl: 'https://via.placeholder.com/300',
          required: false,
          type: 'image_feedback'
        };
      }

      // Agregar pregunta de feedback del módulo si no existe
      const hasFeedbackQuestion = finalSteps.some(step =>
        step.name?.includes('Que te ha parecido el módulo') ||
        step.id === 'module_feedback' ||
        step.id === moduleFeedbackConfig.id
      );

      if (!hasFeedbackQuestion) {
        finalSteps.push({
          id: moduleFeedbackConfig.id,
          name: moduleFeedbackConfig.title,
          type: 'feedback',
          config: {
            ...moduleFeedbackConfig,
            isHardcoded: isModuleFeedbackHardcoded
          }
        });

        if (isModuleFeedbackHardcoded) {
          console.warn('[useParticipantFlowWithStore] ⚠️ Paso de feedback del módulo agregado con configuración HARDCODEADA');
        } else {
          console.log('[useParticipantFlowWithStore] ✅ Paso de feedback del módulo agregado con configuración del BACKEND');
        }
      }

      // Agregar pregunta de feedback de imagen si no existe
      const hasImageQuestion = finalSteps.some(step =>
        step.name?.includes('Que te parece esta imagen') ||
        step.id === 'image_feedback' ||
        step.id === imageFeedbackConfig.id
      );

      if (!hasImageQuestion) {
        finalSteps.push({
          id: imageFeedbackConfig.id,
          name: imageFeedbackConfig.title,
          type: 'image_feedback',
          config: {
            ...imageFeedbackConfig,
            isHardcoded: isImageFeedbackHardcoded
          }
        });

        if (isImageFeedbackHardcoded) {
          console.warn('[useParticipantFlowWithStore] ⚠️ Paso de feedback de imagen agregado con configuración HARDCODEADA');
        } else {
          console.log('[useParticipantFlowWithStore] ✅ Paso de feedback de imagen agregado con configuración del BACKEND');
        }
      }

      // 10. Añadir Agradecimiento
      finalSteps.push({
        id: 'thankyou',
        name: 'Agradecimiento',
        type: 'thankyou',
        config: {
          title: '¡Muchas Gracias!',
          message: 'Hemos recibido tus respuestas.'
        }
      });

      // Finalizar construcción
      if (finalSteps.length <= 2) {
        console.warn("[useParticipantFlowWithStore] No se generaron pasos de preguntas reales.");
      }

      console.log(`[useParticipantFlowWithStore] Construcción finalizada. ${finalSteps.length} pasos totales.`);
      setExpandedSteps(finalSteps as import('../stores/participantStore').ExpandedStep[]);
      setCurrentStepIndex(0);
      setCurrentStep(ParticipantFlowStep.WELCOME);

      return finalSteps;
    } catch (error: unknown) {
      const errorMsg = (error && typeof error === 'object' && 'message' in error)
        ? (error as { message?: string }).message
        : 'Error construyendo los pasos del flujo.';
      handleError(errorMsg ?? 'Error construyendo los pasos del flujo.', ParticipantFlowStep.LOADING_SESSION);
      return [];
    }
  }, [handleError, setExpandedSteps, setCurrentStepIndex, setCurrentStep]);

  // Adaptador para handleLoginSuccess
  const handleLoginSuccess = useCallback((participant: unknown) => {
    storeHandleLoginSuccess(participant as ParticipantInfo);

    // Construir pasos expandidos después del login
    const storedToken = localStorage.getItem('participantToken');
    if (storedToken && researchId) {
      buildExpandedSteps(researchId, storedToken);
    }
  }, [storeHandleLoginSuccess, researchId, buildExpandedSteps]);

  // Guardar la respuesta del paso actual (adaptador)
  const handleStepComplete = useCallback((answer: unknown) => {
    // Llamar a goToNextStep que internamente guarda la respuesta
    goToNextStep(answer);
  }, [goToNextStep]);

  // Inicialización
  useEffect(() => {
    if (researchId) {
      console.log(`[useParticipantFlowWithStore] Inicializando con researchId: ${researchId}`);

      // Reset store y establecer research ID
      resetStore();
      setResearchId(researchId);
      setCurrentStep(ParticipantFlowStep.LOADING_SESSION);
      setError(null);

      const storedToken = localStorage.getItem('participantToken');
      if (storedToken) {
        console.log("[useParticipantFlowWithStore] Token encontrado. Construyendo flujo...");
        setToken(storedToken);
        buildExpandedSteps(researchId, storedToken);
      } else {
        console.log("[useParticipantFlowWithStore] No hay token. Pasando a Login.");
        setCurrentStep(ParticipantFlowStep.LOGIN);
      }
    } else {
      handleError('No se proporcionó ID de investigación.', ParticipantFlowStep.LOADING_SESSION);
    }
  }, [researchId, resetStore, setResearchId, setCurrentStep, setError, setToken, buildExpandedSteps, handleError]);

  // Devolver las funciones y estado necesarios para los componentes
  return {
    token,
    currentStep,
    error,
    handleLoginSuccess,
    handleStepComplete,
    handleError,
    expandedSteps,
    currentStepIndex,
    isFlowLoading: isFlowLoading,
    navigateToStep,
    completedRelevantSteps,
    totalRelevantSteps,
    responsesData,
    getResponsesJson,
    hasStepBeenAnswered,
    getAnsweredStepIndices,
    getStepResponse,
    maxVisitedIndex
  };
};
