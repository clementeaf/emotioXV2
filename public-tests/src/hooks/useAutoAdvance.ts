import { useCallback, useState } from 'react';
import { useStepStore } from '../stores/useStepStore';
import { useLogger } from '../utils/logger';
import { useButtonSteps } from './useButtonSteps';

interface UseAutoAdvanceProps {
  questionType: string;
  maxSelections?: number;
  currentQuestionKey: string;
  onAdvance?: () => void;
}

export const useAutoAdvance = ({ 
  questionType, 
  maxSelections,
  currentQuestionKey,
  onAdvance 
}: UseAutoAdvanceProps) => {
  const [isAdvancing, setIsAdvancing] = useState(false);
  const { goToNextStep } = useStepStore();
  const { info, error } = useLogger('useAutoAdvance');
  
  // 🎯 Usar ButtonSteps para guardar en backend
  const { handleClick: saveToBackend } = useButtonSteps({
    currentQuestionKey,
    isWelcomeScreen: false
  });

  const shouldAutoAdvance = useCallback((
    currentSelections: unknown[],
    questionType: string,
    maxSelections?: number
  ): boolean => {
    if (questionType !== 'emojis') return false;
    if (!maxSelections || maxSelections <= 1) return false;
    return currentSelections.length === maxSelections;
  }, []);

  const triggerAutoAdvance = useCallback(async (
    currentSelections: unknown[]
  ) => {
    if (isAdvancing) return;
    if (!shouldAutoAdvance(currentSelections, questionType, maxSelections)) return;

    setIsAdvancing(true);
    
    info('Auto-avance activado', { 
      progress: `${currentSelections.length}/${maxSelections}`,
      selections: currentSelections,
      maxSelections,
      questionType
    });

    // ✅ GUARDAR EN BACKEND ANTES DE NAVEGAR (para emociones NEV)
    info('💾 Guardando datos en backend antes del auto-avance');
    
    try {
      // Ejecutar el guardado en backend
      await saveToBackend();
      info('✅ Datos guardados exitosamente en backend');
      
      // Esperar un momento para UX y luego navegar
      setTimeout(() => {
        info('🚀 Ejecutando goToNextStep() tras auto-avance y guardado');
        goToNextStep();
        onAdvance?.();
        setIsAdvancing(false);
      }, 1000);
      
    } catch (saveError) {
      error('Error guardando en backend durante auto-avance:', saveError);
      
      // Navegar aunque falle el guardado (comportamiento de degradación)
      setTimeout(() => {
        info('⚠️ Navegando tras error en guardado');
        goToNextStep();
        onAdvance?.();
        setIsAdvancing(false);
      }, 500);
    }
  }, [
    isAdvancing,
    shouldAutoAdvance,
    questionType,
    maxSelections,
    saveToBackend,
    goToNextStep,
    onAdvance,
    info,
    error
  ]);

  return {
    isAdvancing,
    triggerAutoAdvance,
    shouldAutoAdvance: (selections: unknown[]) => 
      shouldAutoAdvance(selections, questionType, maxSelections)
  };
};