
import React from 'react';
import { useFormLoadingState } from '../../hooks/useFormLoadingState';
import { useStepStore } from '../../stores/useStepStore';
import { useAutoSave } from '../../hooks/useAutoSave';
import { EmojiRangeQuestion, ScaleRangeQuestion, SingleAndMultipleChoiceQuestion, VOCTextQuestion, LinearScaleSlider } from './QuestionesComponents';
import { EMOTIONS, EMOTION_GRID_CONFIG, EmotionCategory } from '../../constants/emotions';
import { useLogger } from '../../utils/logger';

// 🎯 TIPOS ESPECÍFICOS PARA CONFIGURACIÓN
interface QuestionConfig {
  maxSelections?: number;
  multiple?: boolean;
  min?: number;
  max?: number;
  startLabel?: string;
  endLabel?: string;
  leftLabel?: string;
  rightLabel?: string;
  instructions?: string;
  placeholder?: string;
  emojis?: string[];
  type?: string;
}

// 🎯 TIPOS ESPECÍFICOS PARA OPCIONES
interface Choice {
  value: string;
  label: string;
  description?: string;
}

// 🎯 TIPOS ESPECÍFICOS PARA PREGUNTA
interface Question {
  title: string;
  questionKey: string;
  type: string;
  config?: QuestionConfig;
  choices?: Choice[];
  description: string;
}

// 🎯 TIPOS ESPECÍFICOS PARA DATOS DEL FORMULARIO
interface FormData {
  value?: unknown;
  selectedValue?: unknown;
}

// 🎯 PROPS INTERFACE MEJORADA
interface QuestionComponentProps {
  question: Question;
  currentStepKey: string;
  initialFormData?: FormData;
}

// 🎯 HOOK PERSONALIZADO PARA INICIALIZACIÓN DE VALORES
const useQuestionInitialization = (
  question: Question,
  currentStepKey: string,
  initialFormData?: FormData,
  formValues?: FormData,
  hasLoadedData?: boolean
) => {
  const [value, setValue] = React.useState<unknown>(null);

  // 🎯 OBTENER VALOR INICIAL BASADO EN TIPO DE PREGUNTA
  const getInitialValue = React.useCallback((questionType: string, config?: QuestionConfig): unknown => {
    if (questionType === 'emojis' && config?.maxSelections && config.maxSelections > 1) {
      return [];
    } else if (questionType === 'text' || questionType === 'cognitive_short_text' || questionType === 'cognitive_long_text') {
      return '';
    } else if (questionType === 'choice' && config?.multiple) {
      return [];
    } else {
      return null;
    }
  }, []);

  // 🎯 CONVERTIR STRING DEL BACKEND A ARRAY PARA SMARTVOC NEV
  const convertBackendValue = React.useCallback((backendValue: unknown, questionType: string, config?: QuestionConfig): unknown => {
    if (questionType === 'emojis' && config?.maxSelections && config.maxSelections > 1 && typeof backendValue === 'string') {
      return backendValue.split(',').map(item => item.trim()).filter(item => item.length > 0);
    }
    return backendValue;
  }, []);

  // 🎯 INICIALIZAR VALOR CUANDO CAMBIA LA PREGUNTA
  React.useEffect(() => {
    const initialValue = getInitialValue(question.type, question.config);
    setValue(initialValue);
  }, [currentStepKey, question.type, question.config?.maxSelections, question.config?.multiple, getInitialValue]);

  // 🎯 CARGAR DATOS DEL BACKEND O STORE LOCAL
  React.useEffect(() => {
    if (initialFormData && Object.keys(initialFormData).length > 0) {
      let backendValue = initialFormData.value || initialFormData.selectedValue;
      backendValue = convertBackendValue(backendValue, question.type, question.config);
      
      if ((question.type === 'text' || question.type === 'cognitive_short_text' || question.type === 'cognitive_long_text') && 
          (backendValue === null || backendValue === undefined)) {
        setValue('');
      } else {
        setValue(backendValue);
      }
      return;
    }

    if (hasLoadedData && formValues && Object.keys(formValues).length > 0) {
      const savedValue = formValues.value || formValues.selectedValue;
      
      if ((question.type === 'text' || question.type === 'cognitive_short_text' || question.type === 'cognitive_long_text') && 
          (savedValue === null || savedValue === undefined)) {
        setValue('');
      } else {
        setValue(savedValue);
      }
    }
  }, [currentStepKey, formValues, question.type, question.config, hasLoadedData, initialFormData, convertBackendValue]);

  return { value, setValue };
};

// 🎯 COMPONENTE MEMOIZADO PARA EMOCIONES
const EmotionButton = React.memo<{
  emotion: string;
  isSelected: boolean;
  onClick: (emotion: string) => void;
  buttonClass: string;
  selectedClass: string;
}>(({ emotion, isSelected, onClick, buttonClass, selectedClass }) => {
  const handleClick = () => {
    onClick(emotion);
  };

  const handleDoubleClick = () => {
    // 🎯 DOBLE-CLICK PARA DESELECCIONAR
    if (isSelected) {
      onClick(emotion);
    }
  };

  return (
    <button
      onClick={handleClick}
      onDoubleClick={handleDoubleClick}
      className={`px-2 py-3 rounded-lg border-2 text-xs font-medium transition-all cursor-pointer min-h-[56px] flex items-center justify-center text-center ${
        isSelected ? selectedClass : buttonClass
      }`}
    >
      <span className="leading-tight break-words px-1">{emotion}</span>
    </button>
  );
});

// 🎯 COMPONENTE MEMOIZADO PARA FILA DE EMOCIONES
const EmotionRow = React.memo<{
  emotions: string[];
  value: unknown;
  onEmotionClick: (emotion: string) => void;
  gridClass: string;
  buttonClass: string;
  selectedClass: string;
}>(({ emotions, value, onEmotionClick, gridClass, buttonClass, selectedClass }) => (
  <div className={`grid ${gridClass} gap-2`}>
    {emotions.map((emotion) => {
      const isSelected = Array.isArray(value) ? value.includes(emotion) : value === emotion;
      return (
        <EmotionButton
          key={emotion}
          emotion={emotion}
          isSelected={isSelected}
          onClick={onEmotionClick}
          buttonClass={buttonClass}
          selectedClass={selectedClass}
        />
      );
    })}
  </div>
));

export const QuestionComponent: React.FC<QuestionComponentProps> = React.memo(({ question, currentStepKey, initialFormData }) => {
  // 🎯 SISTEMA DE LOGGING
  const { debug, info, warn, error } = useLogger('QuestionComponent');

  // 🎯 FLAG PARA PREVENIR RE-MONTE DURANTE AUTO-AVANCE
  const [isAutoAdvancing, setIsAutoAdvancing] = React.useState(false);

  // 🎯 DEBUG: Log de configuración al montar el componente
  React.useEffect(() => {
    debug('QuestionComponent montado', {
      questionType: question.type,
      maxSelections: question.config?.maxSelections,
      fullConfig: question.config,
      questionTitle: question.title,
      currentStepKey,
      isAutoAdvancing
    });
  }, [question, currentStepKey, debug, isAutoAdvancing]);

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

  // 🎯 USAR HOOK PERSONALIZADO PARA INICIALIZACIÓN
  const { value, setValue } = useQuestionInitialization(
    question,
    currentStepKey,
    initialFormData,
    formValues,
    hasLoadedData
  );



  // 🎯 HANDLECHANGE MEMOIZADO PARA OPTIMIZAR PERFORMANCE
  const handleChange = React.useCallback((newValue: unknown) => {
    // 🎯 PREVENIR SELECCIONES DURANTE AUTO-AVANCE
    if (isAutoAdvancing) {
      warn('Auto-avance en progreso, ignorando selección');
      return;
    }

    debug('handleChange llamado', {
      newValue,
      questionType: question.type,
      maxSelections: question.config?.maxSelections,
      currentValue: value,
      currentSelectionsLength: Array.isArray(value) ? value.length : 0,
      canSelectMore: Array.isArray(value) ? value.length < (question.config?.maxSelections || 0) : false,
      // 🎯 DEBUG: Información completa de la configuración
      fullConfig: question.config,
      questionTitle: question.title,
      isAutoAdvancing
    });

    // 🎯 DEBUG: Verificar condiciones del auto-avance
    debug('Verificando condiciones de auto-avance', {
      questionType: question.type,
      isEmojis: question.type === 'emojis',
      hasMaxSelections: !!question.config?.maxSelections,
      maxSelections: question.config?.maxSelections,
      maxSelectionsGreaterThan1: question.config?.maxSelections && question.config.maxSelections > 1,
      currentSelectionsLength: Array.isArray(value) ? value.length : 0,
      newValue
    });

    if (question.type === 'emojis' && question.config?.maxSelections && question.config.maxSelections > 1) {
      const currentSelections = Array.isArray(value) ? value : [];

      if (currentSelections.includes(newValue)) {
        const updatedSelections = currentSelections.filter(item => item !== newValue);
        setValue(updatedSelections);
        debug('Deseleccionando', { emotion: newValue, currentSelections: updatedSelections });
        // 🎯 FORMATO UNIFICADO: Usar selectedValue para consistencia con otras preguntas
        saveToStore({ 
          selectedValue: updatedSelections,
          value: updatedSelections 
        });
      } else {
        if (currentSelections.length < question.config.maxSelections) {
          const updatedSelections = [...currentSelections, newValue];
          setValue(updatedSelections);
          info('Seleccionando', { 
            emotion: newValue, 
            currentSelections: updatedSelections, 
            progress: `${updatedSelections.length}/${question.config.maxSelections}` 
          });
          // 🎯 FORMATO UNIFICADO: Usar selectedValue para consistencia con otras preguntas
          saveToStore({ 
            selectedValue: updatedSelections,
            value: updatedSelections 
          });
          
          // 🎯 DEBUG: Verificar si se alcanza el límite
          debug('Verificando límite de selecciones', {
            updatedSelectionsLength: updatedSelections.length,
            maxSelections: question.config.maxSelections,
            isEqual: updatedSelections.length === question.config.maxSelections,
            selections: updatedSelections
          });

          // 🎯 AUTO-AVANCE: Si se alcanza el límite máximo, guardar y avanzar automáticamente
          if (updatedSelections.length === question.config.maxSelections && !isAutoAdvancing) {
            // 🎯 ACTIVAR FLAG PARA PREVENIR RE-MONTE
            setIsAutoAdvancing(true);
            
            info('Auto-avance activado', { 
              progress: `${updatedSelections.length}/${question.config.maxSelections}`,
              selections: updatedSelections,
              maxSelections: question.config.maxSelections,
              questionType: question.type,
              configComplete: question.config
            });
            
            // 🎯 SOLUCIÓN RACE CONDITION: Usar Promise para garantizar que el estado se actualice
            const handleAutoAdvance = async () => {
              info('🚀 handleAutoAdvance iniciado');
              try {
                // 🎯 SIMPLIFICAR: Eliminar verificación compleja del estado
                info('Iniciando auto-save sin verificación de estado');
                
                // 🎯 GUARDAR AUTOMÁTICAMENTE DIRECTAMENTE
                info('Llamando a autoSave()...');
                await autoSave();
                info('✅ autoSave() completado exitosamente');
                info('Datos guardados automáticamente antes del auto-avance', {
                  finalSelections: updatedSelections,
                  count: updatedSelections.length
                });
                
                setTimeout(() => {
                  info('Ejecutando goToNextStep() después del auto-avance');
                  goToNextStep();
                  setIsAutoAdvancing(false);
                }, 100);
              } catch (saveError) {
                error('Error al guardar automáticamente', saveError);
                console.error('[QuestionComponent] ❌ Error completo en handleAutoAdvance:', saveError);
                setTimeout(() => {
                  goToNextStep();
                  setIsAutoAdvancing(false);
                }, 100);
              }
            };
            
            info('Programando auto-avance en 800ms');
            setTimeout(() => {
              info('Ejecutando handleAutoAdvance después de 800ms');
              handleAutoAdvance();
            }, 800);
          }
        } else {
          warn('Límite máximo alcanzado, no se puede seleccionar más');
        }
      }
    } else {
      setValue(newValue);
      debug('Valor simple', { value: newValue });
      // 🎯 FORMATO UNIFICADO: Usar selectedValue para consistencia con otras preguntas
      saveToStore({ 
        selectedValue: newValue,
        value: newValue 
      });
    }
  }, [question.type, question.config?.maxSelections, value, saveToStore, autoSave, goToNextStep, debug, info, warn, error]);

  // 🎯 HANDLER MEMOIZADO PARA CLICKS DE EMOCIONES
  const handleEmotionClick = React.useCallback((emotion: string) => {
    handleChange(emotion);
  }, [handleChange]);

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
              choices={(question.choices || []).map(choice => ({
                id: choice.value,
                text: choice.label,
                value: choice.value,
                label: choice.label,
                description: choice.description
              }))}
              value={value as string | string[]}
              onChange={handleChange}
              multiple={question.config?.multiple || false}
            />
          </>
        )}
        {question.type === 'scale' && (
            <ScaleRangeQuestion
              min={question.config?.min as number | undefined}
              max={question.config?.max as number | undefined}
            startLabel={question.config?.startLabel}
            endLabel={question.config?.endLabel}
            leftLabel={question.config?.leftLabel}
            rightLabel={question.config?.rightLabel}
            value={value as number}
            onChange={handleChange}
          />
        )}
        {question.type === 'linear_scale' && (
          <LinearScaleSlider
            min={question.config?.min as number | undefined}
            max={question.config?.max as number | undefined}
            startLabel={question.config?.startLabel}
            endLabel={question.config?.endLabel}
            value={value as number}
            onChange={handleChange}
          />
        )}
        {question.type === 'emoji' && (
          <>
            <EmojiRangeQuestion
              emojis={question.config?.emojis}
              value={value as number}
              onChange={handleChange}
              type={(question.config?.type as "emojis" | "stars") || 'emojis'}
              min={question.config?.min as number | undefined}
              max={question.config?.max as number | undefined}
              startLabel={question.config?.startLabel}
              endLabel={question.config?.endLabel}
            />
          </>
        )}
        {question.type === 'text' && (
          <>
            <VOCTextQuestion
              value={value as string}
              onChange={handleChange}
              placeholder={question.config?.placeholder as string}
            />
          </>
        )}
        {(question.type === 'cognitive_short_text' || question.type === 'cognitive_long_text') && (
          <>
            <VOCTextQuestion
              value={value as string}
              onChange={handleChange}
              placeholder={question.config?.placeholder as string || 'Escribe tu respuesta aquí...'}
            />
          </>
        )}
        {(question.type === 'smartvoc_nev' || question.type === 'detailed' || question.type === 'emojis') && (
          <>
            <div className="space-y-4">
              {/* 🎯 RENDERIZAR EMOCIONES USANDO COMPONENTES MEMOIZADOS */}
              {(Object.keys(EMOTIONS) as EmotionCategory[]).map((category) => {
                const config = EMOTION_GRID_CONFIG[category];
                return (
                  <EmotionRow
                    key={category}
                    emotions={[...EMOTIONS[category]]}
                    value={value}
                    onEmotionClick={handleEmotionClick}
                    gridClass={config.className}
                    buttonClass={config.buttonClass}
                    selectedClass={config.selectedClass}
                  />
                );
              })}
            </div>
          </>
        )}
      </div>
    </div>
  );
});

// 🎯 DISPLAY NAMES PARA MEJOR DEBUGGING
EmotionButton.displayName = 'EmotionButton';
EmotionRow.displayName = 'EmotionRow';
QuestionComponent.displayName = 'QuestionComponent';
