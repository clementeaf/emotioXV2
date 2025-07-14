import React from 'react';
import { StepItemProps } from './types';

const StepItem: React.FC<StepItemProps> = ({ step, isActive, onClick }) => (
  <li
    className={`px-3 py-2 rounded text-sm font-medium transition-colors cursor-pointer ${
      isActive
        ? 'bg-blue-50 text-blue-700'
        : 'text-gray-700 hover:bg-gray-100'
    }`}
    onClick={onClick}
  >
    {step.label}
  </li>
);

export default StepItem;
