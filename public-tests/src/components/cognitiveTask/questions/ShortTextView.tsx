import React, { useEffect, useState } from 'react';
import { useStepResponseManager } from '../../../hooks/useStepResponseManager';
import { useParticipantStore } from '../../../stores/participantStore';
import FormSubmitButton from '../../common/FormSubmitButton';
import TextAreaField from '../../common/TextAreaField';
import QuestionHeader from '../common/QuestionHeader';

export const ShortTextView: React.FC<any> = (props) => {
  console.log('🔍 [DIAGNÓSTICO ShortTextView] Props recibidas:', {
    hasStepConfig: !!props.stepConfig,
    hasConfig: !!props.config,
    hasOnStepComplete: !!props.onStepComplete,
    hasOnContinue: !!props.onContinue,
    hasSavedResponse: !!props.savedResponse,
    hasQuestionKey: !!props.questionKey,
    allProps: Object.keys(props),
    questionKey: props.questionKey,
    onStepComplete: !!props.onStepComplete,
    onContinue: !!props.onContinue
  });

  const config = props.stepConfig || props.config;
  const { onStepComplete, onContinue, savedResponse, questionKey } = props;
  const callback = onStepComplete || onContinue;

  if (!config) {
    console.error('[ShortTextView] config/stepConfig es undefined');
    return <div className="p-4 text-red-600">Error: Configuración no disponible.</div>;
  }

  const id = config?.id || '';
  const type = config?.type || 'cognitive_short_text';
  let combinedKey: string;
  if (questionKey) {
    combinedKey = questionKey;
  } else {
    combinedKey = `${type}_${id}`;
    console.warn('[ShortTextView] ⚠️ questionKey no definido, usando fallback:', combinedKey);
  }

  console.log('🔍 [DIAGNÓSTICO ShortTextView] Construyendo combinedKey:', {
    questionKey,
    type,
    id,
    combinedKey,
    fallbackKey: `${type}_${id}`
  });

  const title = config?.title || 'Pregunta';
  const description = config?.description;
  const answerPlaceholder = config?.answerPlaceholder || '';
  const required = config?.required;

  const allSteps = useParticipantStore(state => state.responsesData.modules.all_steps || []);
  const moduleResponse = allSteps.find(r => r.questionKey === combinedKey) || null;
  const extractSavedResponse = (resp: any): string | null => {
    if (resp && typeof resp === 'object' && resp.response && typeof resp.response === 'string') {
      return resp.response;
    }
    return null;
  };
  const persistedResponse = extractSavedResponse(moduleResponse);

  const {
    responseData,
    isSaving,
    isLoading,
    error,
    saveCurrentStepResponse,
    hasExistingData
  } = useStepResponseManager<string>({
    stepId: combinedKey,
    stepType: type,
    stepName: title,
    initialData: savedResponse as string | null | undefined,
    questionKey: combinedKey
  });

  const [localValue, setLocalValue] = useState<string>(persistedResponse || '');
  const [localError, setLocalError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    setLocalValue(persistedResponse || '');
  }, [persistedResponse, combinedKey]);

  const localHasExistingData = !!(persistedResponse !== null);

  const handleSubmit = async () => {
    console.log('🔍 [DIAGNÓSTICO ShortTextView] handleSubmit iniciado');

    if (required && !localValue.trim()) {
      setLocalError('Por favor, escribe una respuesta.');
      return;
    }

    setIsSubmitting(true);
    setLocalError(null);

    try {
      const responseData = {
        response: localValue,
        questionKey: combinedKey,
        stepType: type,
        stepTitle: title || 'Pregunta de texto corto',
        stepId: id,
        timestamp: Date.now()
      };

      console.log('🔍 [DIAGNÓSTICO ShortTextView] Llamando saveCurrentStepResponse con:', localValue);

      const result = await saveCurrentStepResponse(localValue);

      console.log('🔍 [DIAGNÓSTICO ShortTextView] Resultado de saveCurrentStepResponse:', result);

      console.log('🔍 [DIAGNÓSTICO ShortTextView] Verificando callback:', {
        resultSuccess: result.success,
        hasOnStepComplete: !!onStepComplete,
        hasOnContinue: !!onContinue,
        hasCallback: !!callback,
        callbackType: typeof callback
      });

      if (result.success && callback) {
        console.log('🔍 [DIAGNÓSTICO ShortTextView] Llamando callback con:', responseData);
        console.log('🔍 [DIAGNÓSTICO ShortTextView] Callback es:', callback.toString().substring(0, 100));
        callback(responseData);
        console.log('✅ [DIAGNÓSTICO ShortTextView] callback ejecutado');
      } else {
        console.warn('⚠️ [DIAGNÓSTICO ShortTextView] No se llamó callback:', {
          resultSuccess: result.success,
          hasCallback: !!callback
        });
      }
    } catch (e) {
      console.error('❌ [DIAGNÓSTICO ShortTextView] Error en handleSubmit:', e);
      setLocalError('Error guardando la respuesta. Por favor, intenta de nuevo.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (value: string) => {
    setLocalValue(value);
    setLocalError(null);
  };

  if (isLoading) {
    return <div className="p-4">Cargando...</div>;
  }

  return (
    <div className="space-y-4">
      <QuestionHeader
        title={title}
        instructions={description}
        required={required}
      />

      <TextAreaField
        id={`short-text-${id}`}
        label={title || 'Respuesta'}
        value={localValue}
        onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => handleChange(e.target.value)}
        placeholder={answerPlaceholder}
        error={localError || error || undefined}
        disabled={isSaving || isSubmitting}
      />

      <FormSubmitButton
        onClick={handleSubmit}
        isSaving={isSaving || isSubmitting}
        hasExistingData={localHasExistingData}
        disabled={required && !localValue.trim()}
        customCreateText="Guardar y continuar"
        customUpdateText="Actualizar y continuar"
      />
    </div>
  );
};
