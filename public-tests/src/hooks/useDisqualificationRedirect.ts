import { useCallback } from 'react';
import { EyeTrackingConfig } from './useEyeTrackingConfigQuery';

export const useDisqualificationRedirect = () => {
  const redirectToDisqualification = useCallback((
    eyeTrackingConfig: EyeTrackingConfig | undefined,
    reason?: string
  ) => {
    console.log('[useDisqualificationRedirect] 🎯 INICIANDO REDIRECCIÓN:', {
      reason,
      eyeTrackingConfig: eyeTrackingConfig ? {
        hasBacklinks: !!eyeTrackingConfig.backlinks,
        backlinksKeys: eyeTrackingConfig.backlinks ? Object.keys(eyeTrackingConfig.backlinks) : [],
        disqualifiedUrl: eyeTrackingConfig.backlinks?.disqualified,
        completeUrl: eyeTrackingConfig.backlinks?.complete,
        overquotaUrl: eyeTrackingConfig.backlinks?.overquota
      } : 'NO CONFIG'
    });

    // 🎯 VERIFICAR SI HAY LINK DE DESCALIFICACIÓN CONFIGURADO
    if (!eyeTrackingConfig?.backlinks?.disqualified) {
      console.error('[useDisqualificationRedirect] ❌ No hay link de descalificación configurado');
      console.error('[useDisqualificationRedirect] Configuración completa:', eyeTrackingConfig);
      console.error('[useDisqualificationRedirect] Backlinks disponibles:', eyeTrackingConfig?.backlinks);

      // 🎯 FALLBACK: USAR URL DE COMPLETADO SI ESTÁ DISPONIBLE
      if (eyeTrackingConfig?.backlinks?.complete) {
        console.warn('[useDisqualificationRedirect] ⚠️ Usando URL de completado como fallback');
        const fallbackUrl = eyeTrackingConfig.backlinks.complete;
        console.log('[useDisqualificationRedirect] 🎯 URL de fallback:', fallbackUrl);
        window.open(fallbackUrl, '_self');
        return;
      }

      return;
    }

    // 🎯 REDIRIGIR DIRECTAMENTE AL LINK DE DESCALIFICACIÓN
    let disqualificationUrl = eyeTrackingConfig.backlinks.disqualified;

    console.log('[useDisqualificationRedirect] 🎯 URL ORIGINAL DEL BACKEND:', disqualificationUrl);
    console.log('[useDisqualificationRedirect] 🎯 TIPO DE URL:', typeof disqualificationUrl);
    console.log('[useDisqualificationRedirect] 🎯 LONGITUD DE URL:', disqualificationUrl?.length);
    console.log('[useDisqualificationRedirect] 🎯 ¿ES STRING?:', typeof disqualificationUrl === 'string');
    console.log('[useDisqualificationRedirect] 🎯 ¿ES VACÍA?:', disqualificationUrl === '');
    console.log('[useDisqualificationRedirect] 🎯 ¿ES NULL?:', disqualificationUrl === null);
    console.log('[useDisqualificationRedirect] 🎯 ¿ES UNDEFINED?:', disqualificationUrl === undefined);

    // 🎯 VERIFICAR QUE LA URL SEA VÁLIDA
    if (!disqualificationUrl || typeof disqualificationUrl !== 'string' || disqualificationUrl.trim() === '') {
      console.error('[useDisqualificationRedirect] ❌ URL de descalificación inválida:', disqualificationUrl);
      return;
    }

    // 🎯 CORREGIR PROTOCOLO HTTPS SI ES NECESARIO
    if (disqualificationUrl.includes('vercel.app')) {
      const originalUrl = disqualificationUrl;
      disqualificationUrl = disqualificationUrl.replace('https://', 'http://');
      console.log('[useDisqualificationRedirect] 🔧 CORRECCIÓN APLICADA:');
      console.log('[useDisqualificationRedirect] 🔧 URL original:', originalUrl);
      console.log('[useDisqualificationRedirect] 🔧 URL corregida:', disqualificationUrl);
      console.log('[useDisqualificationRedirect] 🔧 ¿Contiene https?:', originalUrl.includes('https://'));
      console.log('[useDisqualificationRedirect] 🔧 ¿Contiene vercel.app?:', originalUrl.includes('vercel.app'));
    } else {
      console.log('[useDisqualificationRedirect] ⚠️ No se aplicó corrección - URL no contiene vercel.app');
      console.log('[useDisqualificationRedirect] ⚠️ URL contiene:', disqualificationUrl);
    }

    console.log('[useDisqualificationRedirect] 🎯 URL FINAL de descalificación:', disqualificationUrl);
    console.log('[useDisqualificationRedirect] 🎯 URL válida:', disqualificationUrl && disqualificationUrl.startsWith('http'));
    console.log('[useDisqualificationRedirect] 🎯 URL completa configurada:', disqualificationUrl);

    // 🎯 VERIFICAR QUE LA URL SEA VÁLIDA
    if (!disqualificationUrl || !disqualificationUrl.startsWith('http')) {
      console.error('[useDisqualificationRedirect] ❌ URL de descalificación inválida:', disqualificationUrl);
      return;
    }

    console.log('[useDisqualificationRedirect] ✅ Ejecutando redirección a:', disqualificationUrl);

    // 🎯 USAR window.open() CON _self COMO LO HACE EL FRONTEND
    try {
      const newWindow = window.open(disqualificationUrl, '_self');
      if (newWindow) {
        console.log('[useDisqualificationRedirect] ✅ Redirección ejecutada exitosamente');
      } else {
        console.warn('[useDisqualificationRedirect] ⚠️ Popup bloqueado, intentando fallback');
        // 🎯 FALLBACK: INTENTAR CON assign
        window.location.assign(disqualificationUrl);
      }
    } catch (error) {
      console.error('[useDisqualificationRedirect] ❌ Error en redirección:', error);
      // 🎯 FALLBACK: INTENTAR CON href
      try {
        window.location.href = disqualificationUrl;
        console.log('[useDisqualificationRedirect] ✅ Fallback con href ejecutado');
      } catch (fallbackError) {
        console.error('[useDisqualificationRedirect] ❌ Error en fallback:', fallbackError);

        // 🎯 ÚLTIMO FALLBACK: URL HARDCODED PARA PRUEBA
        console.warn('[useDisqualificationRedirect] 🚨 Usando URL hardcoded como último recurso');
        const hardcodedUrl = 'http://research-links.vercel.app/disqualified';
        console.log('[useDisqualificationRedirect] 🚨 URL hardcoded:', hardcodedUrl);
        window.open(hardcodedUrl, '_self');
      }
    }
  }, []);

  return { redirectToDisqualification };
};
