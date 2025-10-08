
// @ts-nocheck

import React from 'react';
import { useFormLoadingState } from '../../hooks/useFormLoadingState';
import { useStepStore } from '../../stores/useStepStore';
import { useAutoSave } from '../../hooks/useAutoSave';
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

  // 🎯 HOOK PARA AUTO-AVANCE
  const { goToNextStep } = useStepStore();
  
  // 🎯 HOOK PARA AUTO-GUARDADO
  const { autoSave } = useAutoSave({ currentQuestionKey: currentStepKey });

  const [value, setValue] = React.useState<unknown[]>([]);

  React.useEffect(() => {
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
  }, [currentStepKey, question.type, question.config?.maxSelections, question.config?.multiple]);

  React.useEffect(() => {
    if (initialFormData && Object.keys(initialFormData).length > 0) {
      const backendValue = initialFormData.value || initialFormData.selectedValue;

      if ((question.type === 'text' || question.type === 'cognitive_short_text' || question.type === 'cognitive_long_text') && (backendValue === null || backendValue === undefined)) {
        setValue('');
      } else {
        setValue(backendValue);
      }
      return;
    }

    if (hasLoadedData && formValues && Object.keys(formValues).length > 0) {
      const savedValue = formValues.value || formValues.selectedValue;

      if ((question.type === 'text' || question.type === 'cognitive_short_text' || question.type === 'cognitive_long_text') && (savedValue === null || savedValue === undefined)) {
        setValue('');
      } else {
        setValue(savedValue);
      }
    }
  }, [currentStepKey, formValues, question.type, question.config?.maxSelections, hasLoadedData, initialFormData]);



  const handleChange = (newValue: unknown) => {
    if (question.type === 'emojis' && question.config?.maxSelections > 1) {
      const currentSelections = Array.isArray(value) ? value : [];

      if (currentSelections.includes(newValue)) {
        const updatedSelections = currentSelections.filter(item => item !== newValue);
        setValue(updatedSelections);
        // 🎯 FORMATO UNIFICADO: Usar selectedValue para consistencia con otras preguntas
        saveToStore({ 
          selectedValue: updatedSelections,
          value: updatedSelections 
        });
      } else {
        if (currentSelections.length < question.config.maxSelections) {
          const updatedSelections = [...currentSelections, newValue];
          setValue(updatedSelections);
          // 🎯 FORMATO UNIFICADO: Usar selectedValue para consistencia con otras preguntas
          saveToStore({ 
            selectedValue: updatedSelections,
            value: updatedSelections 
          });
          
          // 🎯 AUTO-AVANCE: Si se alcanza el límite máximo, guardar y avanzar automáticamente
          if (updatedSelections.length === question.config.maxSelections) {
            console.log(`[QuestionComponent] 🚀 Auto-avance activado: ${updatedSelections.length}/${question.config.maxSelections} selecciones completadas`);
            // Pequeño delay para que el usuario vea la selección antes del auto-avance
            setTimeout(async () => {
              try {
                // 🎯 GUARDAR AUTOMÁTICAMENTE ANTES DEL AUTO-AVANCE
                await autoSave();
                console.log('[QuestionComponent] ✅ Datos guardados automáticamente antes del auto-avance');
                // 🎯 AVANZAR DESPUÉS DEL GUARDADO
                goToNextStep();
              } catch (error) {
                console.error('[QuestionComponent] ❌ Error al guardar automáticamente:', error);
                // Avanzar de todas formas para no bloquear al usuario
                goToNextStep();
              }
            }, 800);
          }
        } else {
          const updatedSelections = [...currentSelections.slice(1), newValue];
          setValue(updatedSelections);
          // 🎯 FORMATO UNIFICADO: Usar selectedValue para consistencia con otras preguntas
          saveToStore({ 
            selectedValue: updatedSelections,
            value: updatedSelections 
          });
        }
      }
    } else {
      setValue(newValue);
      // 🎯 FORMATO UNIFICADO: Usar selectedValue para consistencia con otras preguntas
      saveToStore({ 
        selectedValue: newValue,
        value: newValue 
      });
    }
  };

  if (isLoading) {
    return <div className="flex items-center justify-center h-full">Cargando...</div>;
  }

  return (
    <div key={`question-${currentStepKey}-${question.type}`} className="flex flex-col items-center justify-center h-full gap-6 p-8">
      {question.title && question.title.trim() !== '' && (
        <p className="text-gray-600 text-center max-w-2xl">
          {question.title}
        </p>
      )}
      {/* {question.description && question.description.trim() !== '' && (
        <p className="text-gray-600 text-center max-w-2xl">
          {question.description}
        </p>
      )} */}
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
            <div className="space-y-4">
              {/* Primera fila - 7 emociones */}
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7 gap-2">
                {['Feliz', 'Satisfecho', 'Confiado', 'Valorado', 'Cuidado', 'Seguro', 'Enfocado'].map((emotion) => (
                  <button
                    key={emotion}
                    onClick={() => handleChange(emotion)}
                    className={`px-2 py-3 rounded-lg border-2 text-xs font-medium transition-all cursor-pointer min-h-[56px] flex items-center justify-center text-center ${(Array.isArray(value) ? value.includes(emotion) : value === emotion)
                      ? 'bg-blue-500 border-blue-600 text-white shadow-lg'
                      : 'bg-green-100 border-green-200 text-green-800 hover:bg-green-200'
                      }`}
                  >
                    <span className="leading-tight break-words px-1">{emotion}</span>
                  </button>
                ))}
              </div>

              {/* Segunda fila - 6 emociones */}
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2">
                {['Indulgente', 'Estimulado', 'Exploratorio', 'Interesado', 'Enérgico', 'Descontento'].map((emotion) => (
                  <button
                    key={emotion}
                    onClick={() => handleChange(emotion)}
                    className={`px-2 py-3 rounded-lg border-2 text-xs font-medium transition-all cursor-pointer min-h-[56px] flex items-center justify-center text-center ${(Array.isArray(value) ? value.includes(emotion) : value === emotion)
                      ? 'bg-blue-500 border-blue-600 text-white shadow-lg'
                      : 'bg-green-200 border-green-300 text-green-900 hover:bg-green-300'
                      }`}
                  >
                    <span className="leading-tight break-words px-1">{emotion}</span>
                  </button>
                ))}
              </div>

              {/* Tercera fila - 7 emociones - Ajustada para palabras largas */}
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-7 gap-2">
                {['Frustrado', 'Irritado', 'Decepción', 'Estresado', 'Infeliz', 'Desatendido', 'Apresurado'].map((emotion) => (
                  <button
                    key={emotion}
                    onClick={() => handleChange(emotion)}
                    className={`px-3 py-3 rounded-lg border-2 text-xs font-medium transition-all cursor-pointer min-h-[56px] flex items-center justify-center text-center ${(Array.isArray(value) ? value.includes(emotion) : value === emotion)
                      ? 'bg-blue-500 border-blue-600 text-white shadow-lg'
                      : 'bg-red-100 border-red-200 text-red-800 hover:bg-red-200'
                      }`}
                  >
                    <span className="leading-tight break-words">{emotion}</span>
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
