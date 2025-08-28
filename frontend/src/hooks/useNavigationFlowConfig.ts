import { useCallback, useState } from 'react';
import { NAVIGATION_FLOW_CONFIG } from '../config/navigation-flow.config';

export interface NavigationFlowConfig {
  showHeatmap: boolean;
  showCorrectClicks: boolean;
  showIncorrectClicks: boolean;
  enableDebugLogging: boolean;
}

export const useNavigationFlowConfig = () => {
  const [config, setConfig] = useState<NavigationFlowConfig>({
    showHeatmap: NAVIGATION_FLOW_CONFIG.behavior.defaultShowHeatmap,
    showCorrectClicks: NAVIGATION_FLOW_CONFIG.behavior.defaultShowCorrectClicks,
    showIncorrectClicks: NAVIGATION_FLOW_CONFIG.behavior.defaultShowIncorrectClicks,
    enableDebugLogging: NAVIGATION_FLOW_CONFIG.behavior.enableDebugLogging
  });

  const updateConfig = useCallback((updates: Partial<NavigationFlowConfig>) => {
    setConfig(prev => ({ ...prev, ...updates }));
  }, []);

  const resetConfig = useCallback(() => {
    setConfig({
      showHeatmap: NAVIGATION_FLOW_CONFIG.behavior.defaultShowHeatmap,
      showCorrectClicks: NAVIGATION_FLOW_CONFIG.behavior.defaultShowCorrectClicks,
      showIncorrectClicks: NAVIGATION_FLOW_CONFIG.behavior.defaultShowIncorrectClicks,
      enableDebugLogging: NAVIGATION_FLOW_CONFIG.behavior.enableDebugLogging
    });
  }, []);

  const getClickPointClasses = useCallback((isCorrect: boolean, size: 'small' | 'large' = 'small') => {
    const styleConfig = size === 'large' ? NAVIGATION_FLOW_CONFIG.styles.clickPointLarge : NAVIGATION_FLOW_CONFIG.styles.clickPoint;
    const colorClass = isCorrect ? styleConfig.correctColor : styleConfig.incorrectColor;
    return `${styleConfig.baseClasses} ${colorClass} ${styleConfig.border}`;
  }, []);

  const getImageSelectorClasses = useCallback((isSelected: boolean) => {
    const classes = isSelected
      ? NAVIGATION_FLOW_CONFIG.styles.imageSelector.selected
      : NAVIGATION_FLOW_CONFIG.styles.imageSelector.unselected;
    return `${NAVIGATION_FLOW_CONFIG.styles.imageSelector.baseClasses} ${classes}`;
  }, []);

  const logDebug = useCallback((message: string, data?: any) => {
    if (config.enableDebugLogging) {
    }
  }, [config.enableDebugLogging]);

  return {
    config,
    updateConfig,
    resetConfig,
    getClickPointClasses,
    getImageSelectorClasses,
    logDebug,
    placeholderImages: NAVIGATION_FLOW_CONFIG.placeholderImages
  };
};
