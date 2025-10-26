import React from 'react';

interface AddItemButtonProps {
  onClick: () => void;
  text: string;
  className?: string;
}

export const AddItemButton: React.FC<AddItemButtonProps> = ({
  onClick,
  text,
  className = ''
}) => {
  return (
    <button
      onClick={onClick}
      className={`w-full p-4 rounded-lg border-2 border-dashed border-gray-300 text-gray-500 hover:border-gray-400 hover:text-gray-600 hover:bg-gray-50 transition-all duration-200 font-medium text-sm ${className}`}
    >
      {text}
    </button>
  );
};
