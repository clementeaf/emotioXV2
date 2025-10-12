import { useCallback } from 'react';
import { useLogger } from '../utils/logger';
import { QuestionConfig } from './useQuestionInitialization';

interface UseQuestionHandlersProps {
  questionType: string;
  config?: QuestionConfig;
  value: unknown;
  setValue: (value: unknown) => void;
  onSave: (data: Record<string, unknown>) => void;
  onAutoAdvance?: (selections: unknown[]) => void;
  isAdvancing: boolean;
}

export const useQuestionHandlers = ({
  questionType,
  config,
  value,
  setValue,
  onSave,
  onAutoAdvance,
  isAdvancing
}: UseQuestionHandlersProps) => {
  const { debug, info, warn } = useLogger('QuestionHandlers');

  // 🎯 HANDLER PRINCIPAL QUE DECIDE QUÉ LÓGICA USAR
  const handleChange = useCallback((newValue: unknown) => {
    if (isAdvancing) {
      warn('Auto-avance en progreso, ignorando selección');
      return;
    }

    const isMultipleEmotionSelection = 
      questionType === 'emojis' && 
      config?.maxSelections && 
      config.maxSelections > 1;

    if (isMultipleEmotionSelection) {
      // 🎯 LÓGICA DE SELECCIÓN MÚLTIPLE CON AUTO-AVANCE
      const currentSelections = Array.isArray(value) ? value : [];
      let updatedSelections: unknown[];

      if (currentSelections.includes(newValue)) {
        // Deseleccionar
        updatedSelections = currentSelections.filter(item => item !== newValue);
        debug('Deseleccionando', { value: newValue, updatedSelections });
      } else {
        // Seleccionar (si no se ha alcanzado el límite)
        if (currentSelections.length < config.maxSelections!) {
          updatedSelections = [...currentSelections, newValue];
          info('Seleccionando', {
            value: newValue,
            progress: `${updatedSelections.length}/${config.maxSelections}`
          });
        } else {
          warn('Límite máximo alcanzado');
          return;
        }
      }

      // Actualizar estado y persistir
      setValue(updatedSelections);
      const dataToSave = {
        selectedValue: updatedSelections,
        value: updatedSelections
      };
      onSave(dataToSave);

      // Trigger auto-avance si está configurado
      if (onAutoAdvance) {
        onAutoAdvance(updatedSelections);
      }
    } else {
      // 🎯 LÓGICA SIMPLE PARA OTROS TIPOS DE PREGUNTA
      setValue(newValue);
      debug('Valor simple', { value: newValue });

      const dataToSave = {
        selectedValue: newValue,
        value: newValue
      };
      
      onSave(dataToSave);
    }
  }, [
    isAdvancing,
    questionType,
    config?.maxSelections,
    value,
    setValue,
    onSave,
    onAutoAdvance,
    debug,
    info,
    warn
  ]);

  return {
    handleChange
  };
};