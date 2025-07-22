import { useCallback } from 'react';
import { EyeTrackingConfig } from './useEyeTrackingConfigQuery';

export const useDisqualificationRedirect = () => {
  const redirectToDisqualification = useCallback((
    eyeTrackingConfig: EyeTrackingConfig | undefined,
    reason?: string
  ) => {
    console.log('[useDisqualificationRedirect] Usuario descalificado:', { reason });

    // 🎯 CONSTRUIR URL PARA THANK YOU SCREEN CON PARÁMETROS DE DESCALIFICACIÓN
    const currentUrl = new URL(window.location.href);
    const baseUrl = currentUrl.origin + currentUrl.pathname;

    // 🎯 AGREGAR PARÁMETROS DE DESCALIFICACIÓN
    const params = new URLSearchParams();
    params.set('disqualified', 'true');

    if (reason) {
      params.set('reason', encodeURIComponent(reason));
    }

    // 🎯 CONSTRUIR URL FINAL CON PARÁMETROS
    const finalUrl = `${baseUrl}?${params.toString()}`;

    console.log('[useDisqualificationRedirect] Redirigiendo con parámetros de descalificación:', finalUrl);

    // 🎯 REDIRIGIR INMEDIATAMENTE
    window.location.href = finalUrl;
  }, []);

  return { redirectToDisqualification };
};
