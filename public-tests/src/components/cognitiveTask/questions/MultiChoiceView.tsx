import React from 'react';
import { MultiChoiceViewComponentProps } from '../../../types/cognitive-task.types';
import CheckboxGroup from '../../common/CheckboxGroup'; // Importar el nuevo componente
import QuestionHeader from '../common/QuestionHeader'; // Importar QuestionHeader

export const MultiChoiceView: React.FC<MultiChoiceViewComponentProps> = ({ config, value = [], onChange, questionKey }) => { // NUEVO: Agregar questionKey
  // NUEVO: Usar questionKey del backend como identificador principal
  const id = questionKey || config.id;
  const title = config.title;
  const description = config.description;
  const options = config.options;
  const required = config.required;

  // NUEVO: Log para verificar que se está usando el questionKey correcto
  console.log('[MultiChoiceView] 🔍 Debug info:', {
    questionKey,
    configId: config.id,
    finalId: id,
    questionTitle: title,
    stepType: config.type
  });

  if (!id || !options || !Array.isArray(options)) {
    console.error('[MultiChoiceView] Configuración inválida (sin ID u opciones):', config);
    return <div>Error: Pregunta mal configurada.</div>;
  }

  // La lógica para manejar el cambio ahora es más directa gracias a CheckboxGroup
  const handleCheckboxChange = (optionId: string, isChecked: boolean) => {
    let newSelectedIds: string[];
    if (isChecked) {
      // Añadir el ID si no está ya presente (importante evitar duplicados)
      newSelectedIds = value.includes(optionId) ? value : [...value, optionId];
    } else {
      // Eliminar el ID
      newSelectedIds = value.filter(selectedId => selectedId !== optionId);
    }
    onChange(id, newSelectedIds);
  };

  return (
    <div className="space-y-4">
      <QuestionHeader title={title} instructions={description} required={required} />
      <CheckboxGroup
        name={`question-${id}`}
        options={options}
        selectedIds={value}
        onChange={handleCheckboxChange}
      />
    </div>
  );
};
