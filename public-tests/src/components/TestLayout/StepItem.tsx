import React from 'react';
import { StepState } from '../../hooks/useStepStates';
import { StepItemProps } from './types';

interface StepItemPropsWithState extends StepItemProps {
  stepState: StepState;
  canAccess: boolean;
}

const StepItem: React.FC<StepItemPropsWithState> = ({
  step,
  isActive,
  onClick,
  isDisabled,
  stepState,
  canAccess
}) => {
  // Determinar si el step puede ser clickeado
  const canClick = canAccess && !isDisabled;

  // Estilos según el estado
  const getStepStyles = () => {
    switch (stepState) {
      case 'disabled':
        return 'bg-gray-100 text-gray-400 cursor-not-allowed border border-gray-200';
      case 'completed':
        return 'bg-green-50 text-green-700 border border-green-200 hover:bg-green-100 cursor-pointer';
      case 'active':
        return 'bg-blue-100 text-blue-800 border-2 border-blue-400 font-semibold cursor-pointer';
      case 'available':
        return 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-200 cursor-pointer';
      default:
        return 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-200 cursor-pointer';
    }
  };

  const handleClick = () => {
    if (canClick) {
      onClick();
    }
  };

  return (
    <li
      className={`px-3 py-2 rounded text-sm font-medium transition-colors ${getStepStyles()}`}
      onClick={handleClick}
    >
      <span className="flex items-center gap-2">
        {/* Indicador de estado */}
        {stepState === 'disabled' && (
          <svg className="w-4 h-4 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
          </svg>
        )}

        {stepState === 'completed' && (
          <svg className="w-4 h-4 text-green-600" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
          </svg>
        )}

        {stepState === 'active' && (
          <svg className="w-5 h-5 text-blue-700" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v2H7a1 1 0 100 2h2v2a1 1 0 102 0v-2h2a1 1 0 100-2h-2V7z" clipRule="evenodd" />
          </svg>
        )}

        {stepState === 'available' && (
          <svg className="w-4 h-4 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v2H7a1 1 0 100 2h2v2a1 1 0 102 0v-2h2a1 1 0 100-2h-2V7z" clipRule="evenodd" />
          </svg>
        )}

        {step.title}
      </span>
    </li>
  );
};

export default StepItem;
