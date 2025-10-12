import React from 'react';

export interface EmotionButtonProps {
  emotion: string;
  isSelected: boolean;
  onClick: (emotion: string) => void;
  buttonClass: string;
  selectedClass: string;
}

export const EmotionButton = React.memo<EmotionButtonProps>(({
  emotion,
  isSelected,
  onClick,
  buttonClass,
  selectedClass
}) => {
  const handleClick = () => {
    onClick(emotion);
  };

  const handleDoubleClick = () => {
    // 🎯 DOBLE-CLICK PARA DESELECCIONAR
    if (isSelected) {
      onClick(emotion);
    }
  };

  return (
    <button
      onClick={handleClick}
      onDoubleClick={handleDoubleClick}
      className={`px-2 py-3 rounded-lg border-2 text-xs font-medium transition-all cursor-pointer min-h-[56px] flex items-center justify-center text-center ${
        isSelected ? selectedClass : buttonClass
      }`}
    >
      <span className="leading-tight break-words px-1">{emotion}</span>
    </button>
  );
});

EmotionButton.displayName = 'EmotionButton';