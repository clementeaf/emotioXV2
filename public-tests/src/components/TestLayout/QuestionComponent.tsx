// @ts-nocheck
 
import React from 'react';
import { useFormLoadingState } from '../../hooks/useFormLoadingState';
import { useFormDataStore } from '../../stores/useFormDataStore';
import { EmojiRangeQuestion, ScaleRangeQuestion, SingleAndMultipleChoiceQuestion, VOCTextQuestion } from './QuestionesComponents';

interface QuestionComponentProps {
  question: {
    title: string;
    questionKey: string;
    type: string;
    config: unknown;
    choices: unknown[];
    description: string;
  };
  currentStepKey: string;
}

export const QuestionComponent: React.FC<QuestionComponentProps> = ({ question, currentStepKey }) => {
  // 🎯 USAR EL HOOK CORRECTO PARA PERSISTENCIA
  const {
    isLoading,
    hasLoadedData,
    formValues,
    saveToStore
  } = useFormLoadingState({
    questionKey: currentStepKey
  });

  // 🎯 INICIALIZAR VALOR CORRECTO DESDE EL INICIO
  const [value, setValue] = React.useState<unknown[]>([]);

  // 🚨 RESET EXPLÍCITO CUANDO CAMBIA EL STEP PARA EVITAR CONTAMINACIÓN CRUZADA
  React.useEffect(() => {
    
    // 🚨 LIMPIAR STORE ANTES DE RESETEAR VALOR LOCAL
    const { clearFormData } = useFormDataStore.getState();
    
    // 🎯 LIMPIAR TODOS LOS DATOS RESIDUALES DE STEPS ANTERIORES
    try {
      const existingData = localStorage.getItem('emotio-form-data');
      if (existingData) {
        const parsed = JSON.parse(existingData);
        if (parsed.state && parsed.state.formData) {
          Object.keys(parsed.state.formData).forEach(key => {
            if (key !== currentStepKey) {
              clearFormData(key);
            }
          });
        }
      }
    } catch (error) {
      console.error('[QuestionComponent] Error clearing form data:', error);
    }
    
    // 🎯 RESET INMEDIATO DEL VALOR LOCAL SEGÚN EL TIPO
    let initialValue;
    if (question.type === 'emojis' && question.config?.maxSelections > 1) {
      initialValue = [];
    } else if (question.type === 'text' || question.type === 'cognitive_short_text' || question.type === 'cognitive_long_text') {
      initialValue = '';
    } else if (question.type === 'choice' && question.config?.multiple) {
      initialValue = [];
    } else {
      initialValue = null;
    }
    
    setValue(initialValue);
  }, [currentStepKey, question.type, question.config?.maxSelections, question.config?.multiple, question.title]);

  // 🎯 CARGAR VALOR GUARDADO (SOLO DESPUÉS DEL RESET)
  React.useEffect(() => {
    if (hasLoadedData && formValues && Object.keys(formValues).length > 0) {
      const savedValue = formValues.value || formValues.selectedValue;
      
      // 🎯 MANEJAR VALORES NULL/UNDEFINED PARA TEXTAREA
      if ((question.type === 'text' || question.type === 'cognitive_short_text' || question.type === 'cognitive_long_text') && (savedValue === null || savedValue === undefined)) {
        setValue('');
      } else {
        setValue(savedValue);
      }
    }
  }, [currentStepKey, formValues, question.type, question.config?.maxSelections, hasLoadedData]);



  const handleChange = (newValue: unknown) => {
    
    // 🎯 MANEJAR SELECCIÓN MÚLTIPLE PARA NEV
    if (question.type === 'emojis' && question.config?.maxSelections > 1) {
      const currentSelections = Array.isArray(value) ? value : [];

      if (currentSelections.includes(newValue)) {
        // Si ya está seleccionado, removerlo
        const updatedSelections = currentSelections.filter(item => item !== newValue);
        setValue(updatedSelections);
        saveToStore({ value: updatedSelections });
      } else {
        // Si no está seleccionado y no excede el límite, agregarlo
        if (currentSelections.length < question.config.maxSelections) {
          const updatedSelections = [...currentSelections, newValue];
          setValue(updatedSelections);
          saveToStore({ value: updatedSelections });
        } else {
          // Si excede el límite, reemplazar la última selección
          const updatedSelections = [...currentSelections.slice(1), newValue];
          setValue(updatedSelections);
          saveToStore({ value: updatedSelections });
        }
      }
    } else {
      // 🎯 SELECCIÓN ÚNICA (comportamiento original)
      setValue(newValue);
      saveToStore({ value: newValue });
    }
  };

  // 🎯 MODAL DE CARGA
  if (isLoading) {
    return <div className="flex items-center justify-center h-full">Cargando...</div>;
  }

  return (
    <div key={`question-${currentStepKey}-${question.type}`} className="flex flex-col items-center justify-center h-full gap-6 p-8">
      <h2 className="text-2xl font-bold text-gray-800 text-center">
        {question.title}
      </h2>
      {question.description && question.description.trim() !== '' && (
        <p className="text-gray-600 text-center max-w-2xl">
          {question.description}
        </p>
      )}
      {question.config?.instructions && (
        <p className="text-sm text-gray-500 text-center max-w-2xl mt-2">
          {question.config.instructions}
        </p>
      )}

      <div className="w-full max-w-2xl">
        {question.type === 'choice' && (
          <>
            <SingleAndMultipleChoiceQuestion
              key={`choice-${currentStepKey}-${question.title.replace(/\s+/g, '-')}`}
              choices={question.choices}
              value={value}
              onChange={handleChange}
              multiple={question.config?.multiple || false}
            />
          </>
        )}
        {question.type === 'scale' && (
          <ScaleRangeQuestion
            min={question.config?.min || 1}
            max={question.config?.max || 5}
            startLabel={question.config?.startLabel}
            endLabel={question.config?.endLabel}
            leftLabel={question.config?.leftLabel}
            rightLabel={question.config?.rightLabel}
            value={value}
            onChange={handleChange}
          />
        )}
        {question.type === 'emoji' && (
          <>
            <EmojiRangeQuestion
              emojis={question.config?.emojis}
              value={value}
              onChange={handleChange}
              type={question.config?.type || 'emojis'}
              min={question.config?.min}
              max={question.config?.max}
              startLabel={question.config?.startLabel}
              endLabel={question.config?.endLabel}
            />
          </>
        )}
        {question.type === 'text' && (
          <>
            <VOCTextQuestion
              value={value}
              onChange={handleChange}
              placeholder={question.config?.placeholder}
            />
          </>
        )}
        {(question.type === 'cognitive_short_text' || question.type === 'cognitive_long_text') && (
          <>
            <VOCTextQuestion
              value={value}
              onChange={handleChange}
              placeholder={question.config?.placeholder || 'Escribe tu respuesta aquí...'}
            />
          </>
        )}
        {(question.type === 'smartvoc_nev' || question.type === 'detailed' || question.type === 'emojis') && (
          <>
            <div className="space-y-6">
              {/* Primera fila - 7 emociones */}
              <div className="grid grid-cols-7 gap-2">
                {['Feliz', 'Satisfecho', 'Confiado', 'Valorado', 'Cuidado', 'Seguro', 'Enfocado'].map((emotion) => (
                  <button
                    key={emotion}
                    onClick={() => handleChange(emotion)}
                    className={`p-3 rounded-lg border-2 text-sm font-medium transition-all cursor-pointer ${(Array.isArray(value) ? value.includes(emotion) : value === emotion)
                      ? 'bg-blue-500 border-blue-600 text-white shadow-lg'
                      : 'bg-green-100 border-green-200 text-green-800 hover:bg-green-200'
                      }`}
                  >
                    {emotion}
                  </button>
                ))}
              </div>

              {/* Segunda fila - 6 emociones */}
              <div className="grid grid-cols-6 gap-2">
                {['Indulgente', 'Estimulado', 'Exploratorio', 'Interesado', 'Enérgico', 'Descontento'].map((emotion) => (
                  <button
                    key={emotion}
                    onClick={() => handleChange(emotion)}
                    className={`p-3 rounded-lg border-2 text-sm font-medium transition-all cursor-pointer ${(Array.isArray(value) ? value.includes(emotion) : value === emotion)
                      ? 'bg-blue-500 border-blue-600 text-white shadow-lg'
                      : 'bg-green-200 border-green-300 text-green-900 hover:bg-green-300'
                      }`}
                  >
                    {emotion}
                  </button>
                ))}
              </div>

              {/* Tercera fila - 7 emociones */}
              <div className="grid grid-cols-7 gap-2">
                {['Frustrado', 'Irritado', 'Decepción', 'Estresado', 'Infeliz', 'Desatendido', 'Apresurado'].map((emotion) => (
                  <button
                    key={emotion}
                    onClick={() => handleChange(emotion)}
                    className={`p-3 rounded-lg border-2 text-sm font-medium transition-all cursor-pointer ${(Array.isArray(value) ? value.includes(emotion) : value === emotion)
                      ? 'bg-blue-500 border-blue-600 text-white shadow-lg'
                      : 'bg-red-100 border-red-200 text-red-800 hover:bg-red-200'
                      }`}
                  >
                    {emotion}
                  </button>
                ))}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};
