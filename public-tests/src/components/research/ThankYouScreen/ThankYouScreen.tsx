import React from 'react';
import { ResearchThankYouScreenProps } from '../../../types/flow.types';

export const ThankYouScreen: React.FC<ResearchThankYouScreenProps> = ({ researchId, stepId, title, stepConfig, onError }) => {

  console.log('[ThankYouScreen] Received Props:', { researchId, stepId, title, stepConfig });

  // Ya no hay estados isLoading, error, configData
  // Ya no hay handleError, fetchStepConfig, useEffect

  // --- Renderizado ---

  // Validar que stepConfig existe (puede ser objeto vacío)
  if (!stepConfig) {
    onError("Error interno: Configuración de ThankYouScreen no recibida.");
    return <div className="p-4 text-red-600 bg-red-100 border border-red-300 rounded">Error interno fatal.</div>;
  }

  // Usar title de props, y message/showConfetti de stepConfig
  const displayTitle = title || stepConfig.title || '¡Gracias por tu participación!';
  const displayMessage = stepConfig.message || 'Hemos registrado tus respuestas. Tu contribución es muy valiosa.';

  return (
    <div className="p-8 border rounded shadow-md w-full max-w-lg text-center">
      {/* TODO: Usar stepConfig.showConfetti si existe */}
      <h2 className="text-2xl font-bold mb-4">{displayTitle}</h2>
      <p className="mb-6">{displayMessage}</p>

      <p className="text-sm text-gray-500">Puedes cerrar esta ventana.</p>
    </div>
  );
};
