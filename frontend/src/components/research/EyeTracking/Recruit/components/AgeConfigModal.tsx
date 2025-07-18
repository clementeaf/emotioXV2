'use client';

import { Edit2, Plus, Save, Trash2, X, X as XIcon } from 'lucide-react';
import React, { useEffect, useState } from 'react';

interface AgeOption {
  id: string;
  label: string;
  isDisqualifying: boolean;
  isEditing?: boolean;
}

interface AgeConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (validAges: string[], disqualifyingAges: string[]) => void;
  initialValidAges?: string[];
  initialDisqualifyingAges?: string[];
}

const AgeConfigModal: React.FC<AgeConfigModalProps> = ({
  isOpen,
  onClose,
  onSave,
  initialValidAges = [],
  initialDisqualifyingAges = []
}) => {
  const [ageOptions, setAgeOptions] = useState<AgeOption[]>([]);
  const [newOption, setNewOption] = useState('');
  const [editingOption, setEditingOption] = useState<string | null>(null);

  // Opciones predefinidas
  const predefinedOptions = [
    { label: '18-24', id: '18-24' },
    { label: '25-34', id: '25-34' },
    { label: '35-44', id: '35-44' },
    { label: '45-54', id: '45-54' },
    { label: '55-64', id: '55-64' },
    { label: '65+', id: '65+' }
  ];

  useEffect(() => {
    if (isOpen) {
      // Inicializar con opciones predefinidas
      const initialOptions = predefinedOptions.map(option => ({
        ...option,
        isDisqualifying: initialDisqualifyingAges.includes(option.label),
        isEditing: false
      }));

      // Agregar opciones personalizadas existentes
      const customOptions = [
        ...initialValidAges.filter(age => !predefinedOptions.find(p => p.label === age)),
        ...initialDisqualifyingAges.filter(age => !predefinedOptions.find(p => p.label === age))
      ].map(age => ({
        id: `custom-${Date.now()}-${Math.random()}`,
        label: age,
        isDisqualifying: initialDisqualifyingAges.includes(age),
        isEditing: false
      }));

      setAgeOptions([...initialOptions, ...customOptions]);
    }
  }, [isOpen, initialValidAges, initialDisqualifyingAges]);

  const handleToggleDisqualifying = (id: string) => {
    setAgeOptions(prev =>
      prev.map(option =>
        option.id === id
          ? { ...option, isDisqualifying: !option.isDisqualifying }
          : option
      )
    );
  };

  const handleAddOption = () => {
    if (newOption.trim()) {
      const newAgeOption: AgeOption = {
        id: `custom-${Date.now()}`,
        label: newOption.trim(),
        isDisqualifying: false,
        isEditing: false
      };
      setAgeOptions(prev => [...prev, newAgeOption]);
      setNewOption('');
    }
  };

  const handleEditStart = (id: string) => {
    setEditingOption(id);
    setAgeOptions(prev =>
      prev.map(option =>
        option.id === id ? { ...option, isEditing: true } : option
      )
    );
  };

  const handleEditSave = (id: string, newLabel: string) => {
    if (newLabel.trim()) {
      setAgeOptions(prev =>
        prev.map(option =>
          option.id === id
            ? { ...option, label: newLabel.trim(), isEditing: false }
            : option
        )
      );
      setEditingOption(null);
    }
  };

  const handleEditCancel = (id: string) => {
    setAgeOptions(prev =>
      prev.map(option =>
        option.id === id ? { ...option, isEditing: false } : option
      )
    );
    setEditingOption(null);
  };

  const handleDelete = (id: string) => {
    setAgeOptions(prev => prev.filter(option => option.id !== id));
  };

  const handleSave = () => {
    const validAges = ageOptions
      .filter(option => !option.isDisqualifying)
      .map(option => option.label);

    const disqualifyingAges = ageOptions
      .filter(option => option.isDisqualifying)
      .map(option => option.label);

    onSave(validAges, disqualifyingAges);
    onClose();
  };

  const validOptionsCount = ageOptions.filter(option => !option.isDisqualifying).length;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">Configurar opciones de edad</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <X size={24} />
          </button>
        </div>

        <p className="text-gray-600 mb-6">
          Define los rangos de edad y usa el toggle para indicar si clasifican o desclasifican automáticamente.
        </p>

        {/* Lista de opciones */}
        <div className="space-y-3 mb-6">
          {ageOptions.map((option) => (
            <div
              key={option.id}
              className={`flex items-center justify-between p-3 rounded-lg border ${
                option.isDisqualifying
                  ? 'bg-orange-50 border-orange-200'
                  : 'bg-gray-50 border-gray-200'
              }`}
            >
              <div className="flex items-center space-x-3 flex-1">
                {option.isEditing ? (
                  <input
                    type="text"
                    value={editingOption === option.id ? option.label : ''}
                    onChange={(e) => {
                      setAgeOptions(prev =>
                        prev.map(opt =>
                          opt.id === option.id ? { ...opt, label: e.target.value } : opt
                        )
                      );
                    }}
                    className="flex-1 px-2 py-1 border border-gray-300 rounded"
                    autoFocus
                  />
                ) : (
                  <span className="font-medium">{option.label}</span>
                )}

                {/* Toggle Switch */}
                <div className="flex items-center space-x-2">
                  <span className={`text-sm ${option.isDisqualifying ? 'text-orange-600' : 'text-green-600'}`}>
                    {option.isDisqualifying ? 'Desclasifica' : 'Clasifica'}
                  </span>
                  <button
                    onClick={() => handleToggleDisqualifying(option.id)}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      option.isDisqualifying ? 'bg-orange-500' : 'bg-green-500'
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        option.isDisqualifying ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>
              </div>

              {/* Botones de acción */}
              <div className="flex items-center space-x-2">
                {option.isEditing ? (
                  <>
                    <button
                      onClick={() => handleEditSave(option.id, option.label)}
                      className="p-1 text-green-600 hover:text-green-800"
                      title="Guardar"
                    >
                      <Save size={16} />
                    </button>
                    <button
                      onClick={() => handleEditCancel(option.id)}
                      className="p-1 text-gray-600 hover:text-gray-800"
                      title="Cancelar"
                    >
                      <XIcon size={16} />
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      onClick={() => handleEditStart(option.id)}
                      className="p-1 text-blue-600 hover:text-blue-800"
                      title="Editar"
                    >
                      <Edit2 size={16} />
                    </button>
                    <button
                      onClick={() => handleDelete(option.id)}
                      className="p-1 text-red-600 hover:text-red-800"
                      title="Eliminar"
                    >
                      <Trash2 size={16} />
                    </button>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Agregar nueva opción */}
        <div className="flex space-x-2 mb-6">
          <input
            type="text"
            value={newOption}
            onChange={(e) => setNewOption(e.target.value)}
            placeholder="Nueva opción de edad (ej: 18-25)"
            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            onKeyPress={(e) => e.key === 'Enter' && handleAddOption()}
          />
          <button
            onClick={handleAddOption}
            disabled={!newOption.trim()}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
          >
            <Plus size={16} />
            <span>Agregar</span>
          </button>
        </div>

        {/* Nota importante */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <h4 className="font-semibold text-blue-800 mb-2">Nota:</h4>
          <p className="text-blue-700 text-sm">
            Las opciones marcadas como "Clasifica" se mostrarán a los participantes para seleccionar.
            Las opciones marcadas como "Desclasifica" excluirán automáticamente a los participantes de esas edades.
            Debes mantener al menos una opción que clasifique.
          </p>
        </div>

        {/* Validación */}
        {validOptionsCount === 0 && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <p className="text-red-700 text-sm">
              ⚠️ Debes tener al menos una opción que clasifique para que los participantes puedan participar.
            </p>
          </div>
        )}

        {/* Botones de acción */}
        <div className="flex justify-end space-x-3">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
          >
            Cancelar
          </button>
          <button
            onClick={handleSave}
            disabled={validOptionsCount === 0}
            className="px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Guardar configuración
          </button>
        </div>
      </div>
    </div>
  );
};

export default AgeConfigModal;
