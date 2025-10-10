import React from 'react';

interface ButtonStepsUIProps {
  buttonText: string;
  isDisabled: boolean;
  onClick: () => void;
}

export const ButtonStepsUI: React.FC<ButtonStepsUIProps> = ({
  buttonText,
  isDisabled,
  onClick
}) => {
  return (
    <div className="flex justify-center mt-8">
      <button
        onClick={onClick}
        disabled={isDisabled}
        className={`px-8 py-3 rounded-lg font-semibold transition-all duration-200 ${
          isDisabled
            ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
            : 'bg-blue-600 text-white hover:bg-blue-700 active:bg-blue-800'
        }`}
      >
        {buttonText}
      </button>
    </div>
  );
};
