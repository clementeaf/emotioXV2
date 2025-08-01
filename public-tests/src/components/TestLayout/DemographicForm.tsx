import React, { useEffect, useState } from 'react';
import { getApiUrl } from '../../config/endpoints';
import { useDisqualificationRedirect } from '../../hooks/useDisqualificationRedirect';
import { useEyeTrackingConfigQuery } from '../../hooks/useEyeTrackingConfigQuery';
import { useMonitoringWebSocket } from '../../hooks/useMonitoringWebSocket';
import { useFormDataStore } from '../../stores/useFormDataStore';
import { useParticipantStore } from '../../stores/useParticipantStore';
import { useStepStore } from '../../stores/useStepStore';
import { useTestStore } from '../../stores/useTestStore';

interface DemographicFormProps {
  demographicQuestions: Record<string, any>;
  onSubmit?: (data: Record<string, string>) => void;
}

export const DemographicForm: React.FC<DemographicFormProps> = ({
  demographicQuestions,
  onSubmit
}) => {
  const { researchId } = useTestStore();
  const { data: eyeTrackingConfig } = useEyeTrackingConfigQuery(researchId || '');
  const { redirectToDisqualification } = useDisqualificationRedirect();
  const { sendParticipantDisqualified, sendParticipantQuotaExceeded } = useMonitoringWebSocket();

  // 🎯 USAR STORE PERSISTENTE EN LUGAR DE useState
  const { formData, setFormData, getFormData } = useFormDataStore();
  const { getParticipantId } = useParticipantStore();
  const [isLoading, setIsLoading] = useState(false);
  const [hasLoadedData, setHasLoadedData] = useState(false);

  // 🎯 CARGAR DATOS PERSISTIDOS AL INICIALIZAR
  useEffect(() => {
    const savedData = getFormData('demographics');
    if (savedData && Object.keys(savedData).length > 0) {
      setHasLoadedData(true);
      console.log('[DemographicForm] ✅ Datos cargados desde persistencia:', savedData);
    }
  }, [getFormData]);

  // 🎯 FUNCIÓN PARA VERIFICAR SI YA SE ENVIARON DATOS AL BACKEND
  const checkBackendData = async () => {
    try {
      const participantId = getParticipantId();
      const apiUrl = getApiUrl(`module-responses/research/${researchId}`);

      console.log('[DemographicForm] 🔍 Verificando datos en backend para participante:', participantId);

      const response = await fetch(apiUrl);
      if (response.ok) {
        const data = await response.json();
        const participantResponses = data.data?.find((item: any) =>
          item.participantId === participantId &&
          item.questionKey === 'demographics'
        );

        if (participantResponses && participantResponses.responses?.length > 0) {
          const backendData = participantResponses.responses[0].response;
          console.log('[DemographicForm] ✅ Datos encontrados en backend:', backendData);

          // 🎯 CARGAR DATOS DEL BACKEND AL STORE LOCAL
          setFormData('demographics', backendData);
          setHasLoadedData(true);

          // 🎯 ACTUALIZAR EL STORE DE STEPS PARA REFLEJAR LA RESPUESTA
          const { updateBackendResponses } = useStepStore.getState();
          updateBackendResponses([
            { questionKey: 'demographics', response: backendData }
          ]);

          console.log('[DemographicForm] ✅ Datos del backend cargados al store local y steps actualizados');
        }
      }
    } catch (error) {
      console.error('[DemographicForm] ❌ Error verificando datos del backend:', error);
    }
  };

  // 🎯 VERIFICAR DATOS DEL BACKEND AL INICIALIZAR
  useEffect(() => {
    if (researchId) {
      checkBackendData();
    }
  }, [researchId]);

  // 🎯 FUNCIÓN PARA MANEJAR CAMBIOS EN LOS INPUTS
  const handleInputChange = (key: string, value: string) => {
    const currentData = getFormData('demographics');
    const updatedData = {
      ...currentData,
      [key]: value
    };
    setFormData('demographics', updatedData);
    console.log('[DemographicForm] 📝 Datos actualizados:', updatedData);
  };

  // 🎯 FUNCIÓN PARA GUARDAR DEMOGRÁFICOS EN BACKEND
  const saveDemographicsToBackend = async (demographicsData: Record<string, string>, isDisqualified: boolean = false) => {
    try {
      setIsLoading(true);
      const timestamp = new Date().toISOString();
      const now = new Date().toISOString();
      const participantId = getParticipantId();

      console.log('[DemographicForm] 🎯 Guardando demográficos para participante:', participantId);

      const createData = {
        researchId: researchId || '',
        participantId: participantId,
        questionKey: 'demographics',
        responses: [{
          questionKey: 'demographics',
          response: demographicsData,
          timestamp,
          createdAt: now
        }],
        metadata: {
          isDisqualified,
          disqualificationType: 'demographics',
          createdAt: now
        }
      };

      const apiUrl = getApiUrl('module-responses');
      console.log('[DemographicForm] 🌐 Enviando a:', apiUrl);

      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(createData)
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Error guardando demográficos: ${response.status} - ${errorText}`);
      }

      const result = await response.json();
      console.log('[DemographicForm] ✅ Demográficos guardados exitosamente:', result);
      return result;
    } catch (error) {
      console.error('[DemographicForm] ❌ Error guardando demográficos:', error);
      // No lanzar error para no interrumpir el flujo
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  // 🎯 FUNCIÓN PARA VALIDAR DEMOGRÁFICOS
  const validateDemographics = (data: Record<string, string>, questions: Record<string, any>) => {
    for (const [key, value] of Object.entries(data)) {
      const question = questions[key];
      if (question?.disqualifyingOptions?.includes(value)) {
        return {
          isDisqualified: true,
          reason: `Opción descalificatoria seleccionada: ${value}`
        };
      }
    }
    return { isDisqualified: false };
  };

  // 🎯 FUNCIÓN PARA MANEJAR EL ENVÍO DEL FORMULARIO
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!eyeTrackingConfig?.demographicQuestions) return;

    // 🎯 OBTENER DATOS DEL STORE
    const currentFormData = getFormData('demographics');
    if (!currentFormData || Object.keys(currentFormData).length === 0) {
      console.log('[DemographicForm] ⚠️ No hay datos para enviar');
      return;
    }

    // 🎯 CONVERTIR FORM VALUES A FORMATO CORRECTO
    const demographicsData = Object.fromEntries(
      Object.entries(currentFormData).map(([key, value]) => [key, String(value || '')])
    ) as Record<string, string>;

    // 🎯 VALIDAR DESCALIFICACIÓN POR SELECCIÓN
    const validationResult = validateDemographics(demographicsData, eyeTrackingConfig.demographicQuestions);

    if (validationResult.isDisqualified) {
      console.log('[DemographicForm] Usuario descalificado por selección:', validationResult);

      // 🎯 GUARDAR ANTES DE REDIRIGIR
      await saveDemographicsToBackend(demographicsData, true);

      // 🎯 ENVIAR EVENTO DE DESCALIFICACIÓN
      const participantId = getParticipantId();
      sendParticipantDisqualified(
        participantId,
        validationResult.reason || 'Descalificado por criterios demográficos',
        demographicsData,
        'demographics'
      );

      // 🎯 REDIRIGIR A DESCALIFICACIÓN
      redirectToDisqualification(eyeTrackingConfig, validationResult.reason);
      return;
    } else {
      // 🎯 USUARIO CALIFICADO - GUARDAR Y CONTINUAR
      console.log('[DemographicForm] Usuario calificado, guardando y continuando...');

      // 🎯 GUARDAR EN BACKEND
      await saveDemographicsToBackend(demographicsData, false);

      // 🎯 CONTINUAR CON FLUJO NORMAL
      onSubmit?.(demographicsData);
    }
  };

  // Usar las preguntas demográficas de la configuración de eye-tracking si están disponibles
  const questionsToShow = eyeTrackingConfig?.demographicQuestions || demographicQuestions;

  const questions = Object.entries(questionsToShow)
    .filter(([_, questionData]) => (questionData as any)?.enabled)
    .map(([key, questionData]) => {
      const questionDataAny = questionData as any;

      // 🎯 OBTENER OPCIONES DESCALIFICATORIAS
      const disqualifyingOptions = questionDataAny?.disqualifyingAges ||
        questionDataAny?.disqualifyingCountries ||
        questionDataAny?.disqualifyingGenders ||
        questionDataAny?.disqualifyingEducation ||
        questionDataAny?.disqualifyingIncomes ||
        questionDataAny?.disqualifyingEmploymentStatuses ||
        questionDataAny?.disqualifyingHours ||
        questionDataAny?.disqualifyingProficiencies || [];

      // 🎯 USAR DIRECTAMENTE LAS OPTIONS DEL BACKEND (YA INCLUYEN DESCALIFICATORIAS)
      const allOptions = questionDataAny?.options || [];

      // 🎯 ORDENAR OPCIONES DE EDAD EN ORDEN NUMÉRICO
      const sortedOptions = key === 'age'
        ? allOptions.sort((a: string, b: string) => {
          // Extraer números de los rangos (ej: "18-24" -> 18, "65+" -> 65)
          const getMinAge = (range: string) => {
            if (range.includes('+')) {
              return parseInt(range.replace('+', ''));
            }
            return parseInt(range.split('-')[0]);
          };
          return getMinAge(a) - getMinAge(b);
        })
        : allOptions;

      return {
        key,
        enabled: questionDataAny?.enabled || false,
        required: questionDataAny?.required || false,
        options: sortedOptions, // 🎯 OPCIONES ORDENADAS
        disqualifyingOptions
      };
    });

  // 🎯 MODAL DE CARGA
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2 text-sm text-gray-600">Guardando...</span>
      </div>
    );
  }

  // 🎯 VERIFICAR SI HAY PREGUNTAS CONFIGURADAS
  const hasConfiguredQuestions = questions.length > 0;

  return (
    <div className='flex flex-col items-center justify-center h-full gap-10'>
      <div className='mb-2 text-center'>
        <h3 className='text-lg font-semibold mb-2'>Preguntas Demográficas</h3>
        <p className='text-sm text-gray-600'>
          {hasLoadedData ? 'Tus respuestas han sido cargadas' : 'Completa la información solicitada'}
        </p>
      </div>

      {/* 🎯 MENSAJE CUANDO NO HAY PREGUNTAS CONFIGURADAS */}
      {!hasConfiguredQuestions ? (
        <div className="text-center max-w-md mx-auto">
          <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Investigación en configuración</h3>
          <p className="text-gray-600 mb-4">
            Por favor consultar con el investigador cuando esté habilitado para responder.
          </p>
          <div className="text-sm text-gray-500">
            <p>Estado: Configuración pendiente</p>
            <p>Research ID: N/A</p>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="w-full max-w-lg mx-auto flex flex-col gap-4">
          {questions.map(q => (
            <div key={q.key} className="flex flex-col">
              <label className="font-medium mb-1 text-gray-700">
                {q.key.charAt(0).toUpperCase() + q.key.slice(1)}
                {q.required && <span className="text-red-500 ml-1">*</span>}
              </label>
              <select
                name={q.key}
                value={(getFormData('demographics')[q.key] as string) || ''}
                onChange={(e) => handleInputChange(q.key, e.target.value)}
                required={q.required}
                className="p-2 rounded border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-400 w-full"
              >
                {/* 🎯 DEBUG: Mostrar valor actual */}
                {console.log('[DemographicForm] 🔍 Valor para', q.key, ':', getFormData('demographics')[q.key])}
                <option value="">Selecciona una opción</option>
                {/* 🎯 MOSTRAR TODAS LAS OPCIONES EN ORDEN NORMAL */}
                {q.options.map((opt: string, i: number) => (
                  <option
                    key={i}
                    value={opt}
                    className={q.disqualifyingOptions?.includes(opt) ? 'text-red-500' : ''}
                  >
                    {opt}
                  </option>
                ))}
              </select>

            </div>
          ))}
        </form>
      )}
    </div>
  );
};
