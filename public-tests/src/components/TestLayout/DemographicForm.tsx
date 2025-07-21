import React from 'react';
import { useDemographicValidation } from '../../hooks/useDemographicValidation';
import { useDisqualificationRedirect } from '../../hooks/useDisqualificationRedirect';
import { useEyeTrackingConfigQuery } from '../../hooks/useEyeTrackingConfigQuery';
import { useFormLoadingState } from '../../hooks/useFormLoadingState';
import { useTestStore } from '../../stores/useTestStore';
import { LoadingModal } from './LoadingModal';
import { DemographicFormProps } from './types';

export const DemographicForm: React.FC<DemographicFormProps> = ({
  demographicQuestions,
  onSubmit
}) => {
  const { researchId } = useTestStore();
  const { validateDemographics } = useDemographicValidation();
  const { redirectToDisqualification } = useDisqualificationRedirect();

  // Obtener configuración de eye-tracking
  const { data: eyeTrackingConfig } = useEyeTrackingConfigQuery(researchId || '');

  const {
    isLoading,
    hasLoadedData,
    formValues,
    handleInputChange
  } = useFormLoadingState({
    questionKey: 'demographics'
  });

  // 🎯 FUNCIÓN PARA MANEJAR EL ENVÍO DEL FORMULARIO
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!eyeTrackingConfig?.demographicQuestions || !formValues) return;

    // Validar solo al presionar el botón
    const formValuesString = Object.fromEntries(
      Object.entries(formValues).map(([key, value]) => [key, String(value || '')])
    ) as Record<string, string>;
    const validationResult = validateDemographics(formValuesString, eyeTrackingConfig.demographicQuestions);

    if (validationResult.isDisqualified) {
      console.log('[DemographicForm] Usuario descalificado al enviar:', validationResult);
      redirectToDisqualification(eyeTrackingConfig, validationResult.reason);
    } else {
      // Si no está descalificado, continuar normalmente
      console.log('[DemographicForm] Usuario calificado, continuando...');
      const formValuesString = Object.fromEntries(
        Object.entries(formValues).map(([key, value]) => [key, String(value || '')])
      ) as Record<string, string>;
      onSubmit?.(formValuesString);
    }
  };

  // Usar las preguntas demográficas de la configuración de eye-tracking si están disponibles
  const questionsToShow = eyeTrackingConfig?.demographicQuestions || demographicQuestions;

  const questions = Object.entries(questionsToShow)
    .filter(([_, questionData]) => questionData?.enabled)
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
      const allOptions = questionData?.options || [];

      // 🎯 ORDENAR OPCIONES DE EDAD EN ORDEN NUMÉRICO
      const sortedOptions = key === 'age'
        ? allOptions.sort((a, b) => {
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
        enabled: questionData?.enabled || false,
        required: questionData?.required || false,
        options: sortedOptions, // 🎯 OPCIONES ORDENADAS
        disqualifyingOptions
      };
    });

  // 🎯 MODAL DE CARGA
  if (isLoading) {
    return <LoadingModal />;
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
                value={(formValues[q.key] as string) || ''}
                onChange={(e) => handleInputChange(q.key, e.target.value)}
                required={q.required}
                className="p-2 rounded border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-400 w-full"
              >
                <option value="">Selecciona una opción</option>
                {/* 🎯 MOSTRAR TODAS LAS OPCIONES EN ORDEN NORMAL */}
                {q.options.map((opt, i) => (
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
