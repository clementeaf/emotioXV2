import React from 'react';
import { PlusIcon } from 'lucide-react';

interface AddButtonProps {
  onClick: () => void;
  label: string;
  disabled?: boolean;
  className?: string;
}

export const AddButton: React.FC<AddButtonProps> = ({
  onClick,
  label,
  disabled = false,
  className = ''
}) => {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`flex items-center space-x-2 text-blue-600 hover:text-blue-800 font-medium text-sm transition-colors disabled:text-gray-400 disabled:hover:text-gray-400 ${className}`}
    >
      <div className='w-5 h-5 rounded-full border border-blue-600 flex items-center justify-center'>
        <PlusIcon className="w-3 h-3 mr-[0.5px]" />
      </div>
      <span>{label}</span>
    </button>
  );
};
