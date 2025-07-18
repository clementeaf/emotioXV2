import { Check, Plus, Trash2, X, X as XIcon } from 'lucide-react';
import React, { useEffect, useState } from 'react';

interface IncomeOption {
  id: string;
  name: string;
  isQualified: boolean;
  isCustom?: boolean;
}

interface HouseholdIncomeConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (options: IncomeOption[], disqualified: string[]) => void;
  currentOptions?: IncomeOption[];
  currentDisqualified?: string[];
}

const DEFAULT_INCOME_LEVELS: IncomeOption[] = [
  { id: 'nivel-1', name: 'Menos de 20.000€', isQualified: true },
  { id: 'nivel-2', name: '20.000€ - 40.000€', isQualified: true },
  { id: 'nivel-3', name: '40.000€ - 60.000€', isQualified: true },
  { id: 'nivel-4', name: '60.000€ - 80.000€', isQualified: true },
  { id: 'nivel-5', name: 'Más de 80.000€', isQualified: true }
];

export const HouseholdIncomeConfigModal: React.FC<HouseholdIncomeConfigModalProps> = ({
  isOpen,
  onClose,
  onSave,
  currentOptions = DEFAULT_INCOME_LEVELS,
  currentDisqualified = []
}) => {
  const [options, setOptions] = useState<IncomeOption[]>(currentOptions);
  const [disqualified, setDisqualified] = useState<string[]>(currentDisqualified);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');

  useEffect(() => {
    if (isOpen) {
      setOptions(currentOptions);
      setDisqualified(currentDisqualified);
    }
  }, [isOpen, currentOptions, currentDisqualified]);

  const handleToggleQualification = (incomeId: string) => {
    setOptions(prev =>
      prev.map(option =>
        option.id === incomeId
          ? { ...option, isQualified: !option.isQualified }
          : option
      )
    );

    setDisqualified(prev =>
      prev.includes(incomeId)
        ? prev.filter(id => id !== incomeId)
        : [...prev, incomeId]
    );
  };

  const handleEditStart = (option: IncomeOption) => {
    setEditingId(option.id);
    setEditValue(option.name);
  };

  const handleEditSave = () => {
    if (editingId && editValue.trim()) {
      setOptions(prev =>
        prev.map(option =>
          option.id === editingId
            ? { ...option, name: editValue.trim() }
            : option
        )
      );
      setEditingId(null);
      setEditValue('');
    }
  };

  const handleEditCancel = () => {
    setEditingId(null);
    setEditValue('');
  };

  const handleAddCustom = () => {
    const newId = `custom-${Date.now()}`;
    const newOption: IncomeOption = {
      id: newId,
      name: 'Nuevo nivel de ingresos',
      isQualified: true,
      isCustom: true
    };
    setOptions(prev => [...prev, newOption]);
    setEditingId(newId);
    setEditValue('Nuevo nivel de ingresos');
  };

  const handleDelete = (incomeId: string) => {
    setOptions(prev => prev.filter(option => option.id !== incomeId));
    setDisqualified(prev => prev.filter(id => id !== incomeId));
  };

  const handleSave = () => {
    const qualifiedOptions = options.filter(option => option.isQualified);
    const disqualifiedIds = options
      .filter(option => !option.isQualified)
      .map(option => option.id);

    onSave(qualifiedOptions, disqualifiedIds);
    onClose();
  };

  const qualifiedCount = options.filter(option => option.isQualified).length;
  const totalCount = options.length;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 max-h-[80vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">
            Configurar Niveles de Ingresos Familiares
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[60vh]">
          {/* Statistics */}
          <div className="mb-6 p-4 bg-blue-50 rounded-lg">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium text-blue-900">
                Niveles calificados: {qualifiedCount}/{totalCount}
              </span>
              <span className="text-xs text-blue-600">
                {Math.round((qualifiedCount / totalCount) * 100)}% válidos
              </span>
            </div>
          </div>

          {/* Income Options */}
          <div className="space-y-3">
            {options.map((option) => (
              <div
                key={option.id}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
              >
                <div className="flex items-center space-x-3 flex-1">
                  {/* Toggle */}
                  <button
                    onClick={() => handleToggleQualification(option.id)}
                    className={`w-10 h-6 rounded-full transition-colors ${
                      option.isQualified
                        ? 'bg-green-500'
                        : 'bg-gray-300'
                    }`}
                  >
                    <div
                      className={`w-4 h-4 bg-white rounded-full transition-transform ${
                        option.isQualified ? 'translate-x-5' : 'translate-x-1'
                      }`}
                    />
                  </button>

                  {/* Name */}
                  <div className="flex-1">
                    {editingId === option.id ? (
                      <input
                        type="text"
                        value={editValue}
                        onChange={(e) => setEditValue(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleEditSave();
                          if (e.key === 'Escape') handleEditCancel();
                        }}
                        className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                        autoFocus
                      />
                    ) : (
                      <span className={`text-sm ${
                        option.isQualified ? 'text-gray-900' : 'text-gray-500 line-through'
                      }`}>
                        {option.name}
                      </span>
                    )}
                  </div>

                  {/* Status Icon */}
                  {option.isQualified ? (
                    <Check size={16} className="text-green-500" />
                  ) : (
                    <XIcon size={16} className="text-red-500" />
                  )}
                </div>

                {/* Actions */}
                <div className="flex items-center space-x-2 ml-3">
                  {editingId !== option.id && (
                    <>
                      <button
                        onClick={() => handleEditStart(option)}
                        className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
                        title="Editar"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                      </button>
                      {option.isCustom && (
                        <button
                          onClick={() => handleDelete(option.id)}
                          className="p-1 text-red-400 hover:text-red-600 transition-colors"
                          title="Eliminar"
                        >
                          <Trash2 size={16} />
                        </button>
                      )}
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Add Custom Option */}
          <div className="mt-4">
            <button
              onClick={handleAddCustom}
              className="flex items-center space-x-2 text-blue-600 hover:text-blue-700 transition-colors"
            >
              <Plus size={16} />
              <span className="text-sm">Agregar nivel personalizado</span>
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end space-x-3 p-6 border-t border-gray-200">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Guardar
          </button>
        </div>
      </div>
    </div>
  );
};
