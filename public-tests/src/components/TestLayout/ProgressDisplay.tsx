import React from 'react';
import { useEyeTrackingConfigQuery } from '../../hooks/useEyeTrackingConfigQuery';
import { useTestStore } from '../../stores/useTestStore';

interface ProgressDisplayProps {
  current: number;
  total: number;
}

const ProgressDisplay: React.FC<ProgressDisplayProps> = ({ current, total }) => {
  const { researchId } = useTestStore();
  const { data: eyeTrackingConfig } = useEyeTrackingConfigQuery(researchId || '');

  // 🎯 VERIFICAR SI SE DEBE MOSTRAR LA BARRA DE PROGRESO
  const shouldShowProgressBar = eyeTrackingConfig?.linkConfig?.showProgressBar ?? false;

  // 🎯 SI NO SE DEBE MOSTRAR, NO RENDERIZAR NADA
  if (!shouldShowProgressBar) {
    return null;
  }

  return (
    <div className="mb-6">
      <div className="font-bold text-gray-700 text-lg mb-2">Progreso</div>
      <div className="text-blue-700 font-semibold mb-4">
        {current} de {total}
      </div>
    </div>
  );
};

export default ProgressDisplay;
