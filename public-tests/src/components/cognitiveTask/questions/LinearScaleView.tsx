import React from 'react';
// Importar los nuevos subcomponentes
import { LinearScaleViewComponentProps } from '../../../types/cognitive-task.types';
import QuestionHeader from '../common/QuestionHeader';
import ScaleButtonGroup from './common/ScaleButtonGroup';
import ScaleLabels from './common/ScaleLabels';

export const LinearScaleView: React.FC<LinearScaleViewComponentProps> = ({ config, value, onChange, questionKey }) => { // NUEVO: Agregar questionKey
  // NUEVO: Usar questionKey del backend como identificador principal
  const id = questionKey || config.id;
  const title = config.title;
  const description = config.description;
  const required = config.required;

  // NUEVO: Log para verificar que se está usando el questionKey correcto
  console.log('[LinearScaleView] 🔍 Debug info:', {
    questionKey,
    configId: config.id,
    finalId: id,
    questionTitle: title,
    stepType: config.type
  });

  // Extraer configuración de la escala, con valores por defecto razonables
  const minValue = typeof config.minValue === 'number' ? config.minValue : 1;
  const maxValue = typeof config.maxValue === 'number' ? config.maxValue : 5;
  const minLabel = config.minLabel || ''; // Etiqueta para el valor mínimo
  const maxLabel = config.maxLabel || ''; // Etiqueta para el valor máximo

  if (!id || minValue > maxValue) { // Validación básica
    console.error('[LinearScaleView] Configuración inválida:', config);
    return <div className="p-4 text-red-600">Error: Pregunta mal configurada.</div>;
  }

  // Generar los botones numéricos según minValue y maxValue
  const scaleButtons = Array.from({ length: maxValue - minValue + 1 }, (_, i) => minValue + i);

  const handleSelection = (selectedValue: number) => {
    onChange(id, selectedValue);
  };

  return (
    <div className="space-y-4">
      <QuestionHeader
        title={title}
        instructions={description}
        required={required}
      />

      <ScaleButtonGroup
        buttons={scaleButtons}
        selectedValue={value}
        onSelect={handleSelection}
      />

      <ScaleLabels
        minLabel={minLabel}
        maxLabel={maxLabel}
      />
    </div>
  );
};
