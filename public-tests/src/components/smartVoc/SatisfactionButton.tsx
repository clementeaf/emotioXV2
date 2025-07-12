import React from 'react';

interface SatisfactionButtonProps {
  value: number;
  label?: string;
  selected: boolean;
  onClick: (value: number) => void;
}

export const SatisfactionButton: React.FC<SatisfactionButtonProps> = ({ value, label, selected, onClick }) => {
  const buttonClass = [
    'flex flex-col items-center w-20 p-2 transition-colors focus:outline-none',
  ].join(' ');
  const circleClass = [
    'flex items-center justify-center rounded-full w-14 h-14 mb-1 text-xl font-semibold border-2',
    selected ? 'bg-blue-100 border-blue-600 text-blue-900' : 'bg-white border-gray-300 text-gray-900'
  ].join(' ');
  return (
    <button
      type="button"
      onClick={() => onClick(value)}
      className={buttonClass}
    >
      <span className={circleClass}>{value}</span>
      <span className="block text-xs text-gray-600 text-center min-h-[2rem] font-bold">
        {label}
      </span>
    </button>
  );
};
