import React from 'react';
import { TrashIcon } from '../icons/TrashIcon';

interface ChoiceItemProps {
  value: string;
  onChange: (value: string) => void;
  onRemove: () => void;
  placeholder: string;
  canRemove: boolean;
  index: number;
}

export const ChoiceItem: React.FC<ChoiceItemProps> = ({
  value,
  onChange,
  onRemove,
  placeholder,
  canRemove,
  index
}) => {
  return (
    <div className="flex items-center space-x-3">
      <div className="flex-1">
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={`${placeholder} ${index + 1}`}
          className="w-full rounded-md border border-gray-300 focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2"
        />
      </div>

      <button
        type="button"
        onClick={onRemove}
        disabled={!canRemove}
        className="flex items-center justify-center w-8 h-8 rounded-md text-red-600 hover:text-red-800 hover:bg-red-50 disabled:text-gray-400 disabled:hover:text-gray-400 disabled:hover:bg-transparent transition-colors"
        title={!canRemove ? 'Mínimo de opciones alcanzado' : 'Eliminar opción'}
      >
        <TrashIcon className="w-4 h-4" />
      </button>
    </div>
  );
};
