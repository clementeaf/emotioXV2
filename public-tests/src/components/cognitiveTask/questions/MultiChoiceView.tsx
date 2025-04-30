import React from 'react';
import CheckboxGroup from '../../common/CheckboxGroup'; // Ruta corregida
import QuestionHeader from '../common/QuestionHeader'; // Ruta corregida

// Interfaz para las opciones (reutilizable)
interface ChoiceOption {
  id: string;
  label: string;
}

interface MultiChoiceViewProps {
  config: any; // FIXME: Usar tipo CognitiveQuestion real (que incluya options)
  value: string[] | undefined; // Array de IDs de opciones seleccionadas
  onChange: (questionId: string, selectedOptionIds: string[]) => void;
}

export const MultiChoiceView: React.FC<MultiChoiceViewProps> = ({ config, value: selectedIds = [], onChange }) => {
  const id = config?.id;
  const title = config?.title;
  const description = config?.description;
  const options = config?.options as ChoiceOption[] | undefined;
  const required = config?.required;

  if (!id || !options || !Array.isArray(options)) {
    console.error('[MultiChoiceView] Configuración inválida (sin ID u opciones):', config);
    return <div>Error: Pregunta mal configurada.</div>;
  }

  // La lógica para manejar el cambio ahora es más directa gracias a CheckboxGroup
  const handleCheckboxChange = (optionId: string, isChecked: boolean) => {
    let newSelectedIds: string[];
    if (isChecked) {
      // Añadir el ID si no está ya presente (importante evitar duplicados)
      newSelectedIds = selectedIds.includes(optionId) ? selectedIds : [...selectedIds, optionId];
    } else {
      // Eliminar el ID
      newSelectedIds = selectedIds.filter(selectedId => selectedId !== optionId);
    }
    onChange(id, newSelectedIds);
  };

  return (
    <div className="space-y-4">
      <QuestionHeader title={title} description={description} required={required} />
      <CheckboxGroup
        name={`question-${id}`}
        options={options}
        selectedIds={selectedIds}
        onChange={handleCheckboxChange}
      />
    </div>
  );
}; 