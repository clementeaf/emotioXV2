import { useCallback } from 'react';
import { EyeTrackingConfig } from './useEyeTrackingConfigQuery';

export const useDisqualificationRedirect = () => {
  const redirectToDisqualification = useCallback((
    eyeTrackingConfig: EyeTrackingConfig | undefined,
    reason?: string
  ) => {

    // 🎯 VERIFICAR SI HAY LINK DE DESCALIFICACIÓN CONFIGURADO
    if (!eyeTrackingConfig?.backlinks?.disqualified) {

      // 🎯 FALLBACK 1: USAR URL DE OVERQUOTA SI ESTÁ DISPONIBLE
      if (eyeTrackingConfig?.backlinks?.overquota) {
        const fallbackUrl = eyeTrackingConfig.backlinks.overquota;
        window.open(fallbackUrl, '_self');
        return;
      }

      // 🎯 FALLBACK 2: USAR URL DE COMPLETADO SI ESTÁ DISPONIBLE
      if (eyeTrackingConfig?.backlinks?.complete) {
        const fallbackUrl = eyeTrackingConfig.backlinks.complete;
        window.open(fallbackUrl, '_self');
        return;
      }

      // 🎯 FALLBACK 3: MOSTRAR MENSAJE EN LA PÁGINA ACTUAL (SIN CERRAR)

      // 🎯 CREAR ELEMENTO DE MENSAJE EN LA PÁGINA
      const messageContainer = document.createElement('div');
      messageContainer.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.8);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 9999;
        color: white;
        font-family: Arial, sans-serif;
      `;

      messageContainer.innerHTML = `
        <div style="text-align: center; padding: 2rem; max-width: 500px;">
          <h2 style="color: #ef4444; margin-bottom: 1rem;">Participación Descalificada</h2>
          <p style="margin-bottom: 1rem; font-size: 1.1rem;">
            ${reason || 'Has sido descalificado de esta investigación.'}
          </p>
          <p style="font-size: 0.9rem; opacity: 0.8;">
            Gracias por tu interés en participar. Puedes cerrar esta ventana cuando desees.
          </p>
          <button
            onclick="this.parentElement.parentElement.parentElement.remove()"
            style="
              background: #ef4444;
              color: white;
              border: none;
              padding: 8px 16px;
              border-radius: 4px;
              cursor: pointer;
              margin-top: 1rem;
            "
          >
            Cerrar mensaje
          </button>
        </div>
      `;

      document.body.appendChild(messageContainer);
      return;
    }

    // 🎯 REDIRIGIR DIRECTAMENTE AL LINK DE DESCALIFICACIÓN
    let disqualificationUrl = eyeTrackingConfig.backlinks.disqualified;

    // 🎯 VERIFICAR QUE LA URL SEA VÁLIDA
    if (!disqualificationUrl || typeof disqualificationUrl !== 'string' || disqualificationUrl.trim() === '') {
      return;
    }

    // 🎯 CORREGIR PROTOCOLO HTTPS SI ES NECESARIO
    if (disqualificationUrl.includes('vercel.app')) {
      disqualificationUrl = disqualificationUrl.replace('https://', 'http://');
    }

    // 🎯 VERIFICAR QUE LA URL SEA VÁLIDA
    if (!disqualificationUrl || !disqualificationUrl.startsWith('http')) {
      return;
    }

    // 🎯 USAR window.open() CON _self COMO LO HACE EL FRONTEND
    try {
      const newWindow = window.open(disqualificationUrl, '_self');
      if (!newWindow) {
        // 🎯 FALLBACK: INTENTAR CON assign
        window.location.assign(disqualificationUrl);
      }
    } catch (error) {
      // 🎯 FALLBACK: INTENTAR CON href
      try {
        window.location.href = disqualificationUrl;
      } catch (fallbackError) {
        // 🎯 ÚLTIMO FALLBACK: MOSTRAR MENSAJE EN PÁGINA (SIN CERRAR)
        const messageContainer = document.createElement('div');
        messageContainer.style.cssText = `
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background: rgba(0, 0, 0, 0.8);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 9999;
          color: white;
          font-family: Arial, sans-serif;
        `;

        messageContainer.innerHTML = `
          <div style="text-align: center; padding: 2rem; max-width: 500px;">
            <h2 style="color: #ef4444; margin-bottom: 1rem;">Participación Descalificada</h2>
            <p style="margin-bottom: 1rem; font-size: 1.1rem;">
              ${reason || 'Has sido descalificado de esta investigación.'}
            </p>
            <p style="font-size: 0.9rem; opacity: 0.8;">
              Gracias por tu interés en participar. Puedes cerrar esta ventana cuando desees.
            </p>
            <button
              onclick="this.parentElement.parentElement.parentElement.remove()"
              style="
                background: #ef4444;
                color: white;
                border: none;
                padding: 8px 16px;
                border-radius: 4px;
                cursor: pointer;
                margin-top: 1rem;
              "
            >
              Cerrar mensaje
            </button>
          </div>
        `;

        document.body.appendChild(messageContainer);
      }
    }
  }, []);

  return { redirectToDisqualification };
};
