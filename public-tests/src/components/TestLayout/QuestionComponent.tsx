 
import React from 'react';
import { useFormLoadingState } from '../../hooks/useFormLoadingState';
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
  initialFormData?: Record<string, unknown>;
}

export const QuestionComponent: React.FC<QuestionComponentProps> = ({ question, currentStepKey, initialFormData }) => {
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

  // 🎯 RESET SUAVE SOLO DEL VALOR LOCAL CUANDO CAMBIA EL STEP
  React.useEffect(() => {
    // 🎯 SOLO RESETEAR EL VALOR LOCAL SEGÚN EL TIPO (NO LIMPIAR STORE)
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
    console.log('[QuestionComponent] 🔄 Reset suave para:', currentStepKey, 'valor inicial:', initialValue);
  }, [currentStepKey, question.type, question.config?.maxSelections, question.config?.multiple]);

  // 🎯 CARGAR VALOR GUARDADO (PRIMERO initialFormData, LUEGO PERSISTENCIA)
  React.useEffect(() => {
    // 🚨 PRIORIDAD 1: Si hay initialFormData del backend, usarlo
    if (initialFormData && Object.keys(initialFormData).length > 0) {
      const backendValue = initialFormData.value || initialFormData.selectedValue;
      console.log('[QuestionComponent] 🎯 Cargando desde backend:', {
        currentStepKey,
        initialFormData,
        backendValue
      });
      
      if ((question.type === 'text' || question.type === 'cognitive_short_text' || question.type === 'cognitive_long_text') && (backendValue === null || backendValue === undefined)) {
        setValue('');
      } else {
        setValue(backendValue);
      }
      return;
    }
    
    // 🚨 PRIORIDAD 2: Si no hay backend data, usar persistencia local
    if (hasLoadedData && formValues && Object.keys(formValues).length > 0) {
      const savedValue = formValues.value || formValues.selectedValue;
      console.log('[QuestionComponent] 🎯 Cargando desde local:', {
        currentStepKey,
        formValues,
        savedValue
      });
      
      // 🎯 MANEJAR VALORES NULL/UNDEFINED PARA TEXTAREA
      if ((question.type === 'text' || question.type === 'cognitive_short_text' || question.type === 'cognitive_long_text') && (savedValue === null || savedValue === undefined)) {
        setValue('');
      } else {
        setValue(savedValue);
      }
    }
  }, [currentStepKey, formValues, question.type, question.config?.maxSelections, hasLoadedData, initialFormData]);



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
