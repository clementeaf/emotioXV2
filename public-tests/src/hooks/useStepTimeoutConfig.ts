import { useMemo } from 'react';
import { StepTimeoutConfig } from './useStepTimeout';

/**
 * Hook para extraer y normalizar la configuración de timeout de un paso
 */
export const useStepTimeoutConfig = (stepConfig: any): StepTimeoutConfig => {
  return useMemo(() => {
    // Valores por defecto
    const defaultConfig: StepTimeoutConfig = {
      enabled: false,
      duration: 60, // 60 segundos por defecto
      warningThreshold: 20, // 20% del tiempo
      autoSubmit: false,
      showWarning: true
    };

    // Si no hay configuración, usar valores por defecto
    if (!stepConfig || typeof stepConfig !== 'object') {
      return defaultConfig;
    }

    // Extraer configuración de timeout
    const timeoutConfig = stepConfig.timeout || stepConfig.timeLimit || {};

    // Si hay un timeLimit directo (formato legacy)
    if (typeof stepConfig.timeLimit === 'number') {
      return {
        ...defaultConfig,
        enabled: true,
        duration: stepConfig.timeLimit,
        autoSubmit: true // Por compatibilidad con el formato legacy
      };
    }

    // Si hay configuración de timeout estructurada
    if (timeoutConfig && typeof timeoutConfig === 'object') {
      return {
        enabled: timeoutConfig.enabled ?? true,
        duration: timeoutConfig.duration || timeoutConfig.seconds || 60,
        warningThreshold: timeoutConfig.warningThreshold || 20,
        autoSubmit: timeoutConfig.autoSubmit ?? false,
        showWarning: timeoutConfig.showWarning ?? true
      };
    }

    // Buscar en diferentes ubicaciones comunes
    const possibleTimeouts = [
      stepConfig.timeout,
      stepConfig.timeLimit,
      stepConfig.duration,
      stepConfig.maxTime,
      stepConfig.limit
    ];

    for (const timeout of possibleTimeouts) {
      if (typeof timeout === 'number' && timeout > 0) {
        return {
          ...defaultConfig,
          enabled: true,
          duration: timeout,
          autoSubmit: true
        };
      }
    }

    // Si no se encuentra configuración, verificar si el paso tiene un tipo que normalmente requiere timeout
    const stepType = stepConfig.type || stepConfig.stepType || '';
    const timeoutRequiredTypes = [
      'cognitive_task',
      'eye_tracking',
      'preference_test',
      'ranking_task',
      'prioritization_task'
    ];

    if (timeoutRequiredTypes.some(type => stepType.includes(type))) {
      return {
        ...defaultConfig,
        enabled: true,
        duration: 120, // 2 minutos para tareas cognitivas
        autoSubmit: true
      };
    }

    return defaultConfig;
  }, [stepConfig]);
};
