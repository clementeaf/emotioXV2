import { useCallback } from 'react';
import { EyeTrackingConfig } from './useEyeTrackingConfigQuery';

export const useDisqualificationRedirect = () => {
  const redirectToDisqualification = useCallback((
    eyeTrackingConfig: EyeTrackingConfig | undefined,
    reason?: string
  ) => {
    console.log('[useDisqualificationRedirect] Usuario descalificado:', { reason });

    // 🎯 REDIRIGIR AL THANK YOU SCREEN CON PARÁMETRO DE DESCALIFICACIÓN
    const currentUrl = new URL(window.location.href);
    currentUrl.searchParams.set('disqualified', 'true');

    // 🎯 AGREGAR RAZÓN SI EXISTE
    if (reason) {
      currentUrl.searchParams.set('reason', encodeURIComponent(reason));
    }

    console.log('[useDisqualificationRedirect] Redirigiendo a thank_you_screen con parámetros:', currentUrl.toString());

    // Use setTimeout to avoid setState during the render phase
    setTimeout(() => {
      window.location.href = currentUrl.toString();
    }, 0);
  }, []);

  return { redirectToDisqualification };
};
