import React from 'react';
// import { CharacterCounterProps } from '../../types';
import { ExtendedCharacterCounterProps } from '../../types/common.types';

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