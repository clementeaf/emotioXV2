import React, { useEffect } from 'react';
import { useStepTimeout } from '../../hooks/useStepTimeout';
import { useStepTimeoutConfig } from '../../hooks/useStepTimeoutConfig';
import { StepTimeoutDisplay } from './StepTimeoutDisplay';

interface WithStepTimeoutProps {
  stepConfig?: any;
  onStepComplete?: (data?: any) => void;
  onTimeout?: () => void;
  onWarning?: () => void;
  timeoutDisplayVariant?: 'minimal' | 'detailed' | 'progress-bar';
  timeoutDisplayPosition?: 'top' | 'bottom' | 'header' | 'sidebar';
  children?: React.ReactNode;
}

/**
 * HOC para agregar funcionalidad de timeout a cualquier componente de paso
 */
export const withStepTimeout = <P extends object>(
  WrappedComponent: React.ComponentType<P>
) => {
  const WithStepTimeoutComponent: React.FC<P & WithStepTimeoutProps> = (props) => {
    const {
      stepConfig,
      onStepComplete,
      onTimeout,
      onWarning,
      timeoutDisplayVariant = 'minimal',
      timeoutDisplayPosition = 'header',
      children,
      ...wrappedProps
    } = props;

    // Extraer configuración de timeout
    const timeoutConfig = useStepTimeoutConfig(stepConfig);

    // Hook de timeout
    const timeoutState = useStepTimeout(
      timeoutConfig,
      () => {
        console.log('[withStepTimeout] Timeout ejecutado');
        if (onTimeout) {
          onTimeout();
        } else if (timeoutConfig.autoSubmit && onStepComplete) {
          // Auto-submit con datos por defecto
          onStepComplete({ timeoutExpired: true, autoSubmitted: true });
        }
      },
      () => {
        console.log('[withStepTimeout] Warning ejecutado');
        if (onWarning) {
          onWarning();
        }
      }
    );

    // Iniciar timeout automáticamente cuando se monta el componente
    useEffect(() => {
      if (timeoutConfig.enabled) {
        timeoutState.startTimeout();
      }

      // Limpiar al desmontar
      return () => {
        timeoutState.resetTimeout();
      };
    }, [timeoutConfig.enabled]);

    // Pausar timeout cuando la ventana pierde el foco
    useEffect(() => {
      const handleVisibilityChange = () => {
        if (document.hidden) {
          timeoutState.pauseTimeout();
        } else {
          timeoutState.resumeTimeout();
        }
      };

      const handleBlur = () => {
        timeoutState.pauseTimeout();
      };

      const handleFocus = () => {
        timeoutState.resumeTimeout();
      };

      if (timeoutConfig.enabled) {
        document.addEventListener('visibilitychange', handleVisibilityChange);
        window.addEventListener('blur', handleBlur);
        window.addEventListener('focus', handleFocus);

        return () => {
          document.removeEventListener('visibilitychange', handleVisibilityChange);
          window.removeEventListener('blur', handleBlur);
          window.removeEventListener('focus', handleFocus);
        };
      }
    }, [timeoutConfig.enabled, timeoutState]);

    // Renderizar el componente envuelto
    const renderWrappedComponent = () => {
      return (
        <WrappedComponent
          {...(wrappedProps as P)}
          stepConfig={stepConfig}
          onStepComplete={(data?: any) => {
            // Detener timeout cuando se completa el paso
            timeoutState.resetTimeout();
            if (onStepComplete) {
              onStepComplete(data);
            }
          }}
        />
      );
    };

    // Renderizar timeout display según la posición
    const renderTimeoutDisplay = () => {
      if (!timeoutConfig.enabled || !timeoutState.isActive) {
        return null;
      }

      return (
        <StepTimeoutDisplay
          timeoutState={timeoutState}
          variant={timeoutDisplayVariant}
          showProgress={timeoutDisplayVariant !== 'minimal'}
          showWarning={timeoutConfig.showWarning}
        />
      );
    };

    // Renderizar según la posición del timeout display
    switch (timeoutDisplayPosition) {
      case 'top':
        return (
          <div className="w-full">
            {renderTimeoutDisplay()}
            <div className="mt-4">
              {renderWrappedComponent()}
            </div>
          </div>
        );

      case 'bottom':
        return (
          <div className="w-full">
            {renderWrappedComponent()}
            <div className="mt-4">
              {renderTimeoutDisplay()}
            </div>
          </div>
        );

      case 'sidebar':
        return (
          <div className="flex gap-4">
            <div className="flex-1">
              {renderWrappedComponent()}
            </div>
            <div className="w-64">
              {renderTimeoutDisplay()}
            </div>
          </div>
        );

      case 'header':
      default:
        return (
          <div className="w-full">
            <div className="mb-4">
              {renderTimeoutDisplay()}
            </div>
            {renderWrappedComponent()}
          </div>
        );
    }
  };

  // Copiar displayName para debugging
  WithStepTimeoutComponent.displayName = `withStepTimeout(${WrappedComponent.displayName || WrappedComponent.name})`;

  return WithStepTimeoutComponent;
};
