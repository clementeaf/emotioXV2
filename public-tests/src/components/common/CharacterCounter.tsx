import React from 'react';
import { CharacterCounterProps } from '../../types';

// Props extendidas para este componente específico
interface ExtendedCharacterCounterProps extends Omit<CharacterCounterProps, 'current' | 'max'> {
  currentLength: number;
  maxLength: number;
}

const CharacterCounter: React.FC<ExtendedCharacterCounterProps> = ({
  currentLength,
  maxLength,
  className = 'text-xs text-neutral-400', // Clase original
}) => {
  return (
    <div className={className}>
      {currentLength}/{maxLength}
    </div>
  );
};

export default CharacterCounter; 