import React from 'react';

interface CharacterCounterProps {
  currentLength: number;
  maxLength: number;
  className?: string;
}

const CharacterCounter: React.FC<CharacterCounterProps> = ({
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