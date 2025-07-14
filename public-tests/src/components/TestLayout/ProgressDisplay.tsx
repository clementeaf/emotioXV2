import React from 'react';

interface ProgressDisplayProps {
  current: number;
  total: number;
}

const ProgressDisplay: React.FC<ProgressDisplayProps> = ({ current, total }) => (
  <div className="mb-6">
    <div className="font-bold text-gray-700 text-lg mb-2">Progreso</div>
    <div className="text-blue-700 font-semibold mb-4">
      {current} de {total}
    </div>
  </div>
);

export default ProgressDisplay;
