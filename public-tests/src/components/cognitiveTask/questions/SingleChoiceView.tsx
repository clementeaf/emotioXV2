import React from 'react';
import QuestionHeader from '../common/QuestionHeader'; // Importar QuestionHeader
import RadioButtonGroup from '../../common/RadioButtonGroup'; // Importar el nuevo componente
import { CognitiveQuestion } from '../../../types/cognitive-task.types';
import { ChoiceOption } from '../../../types/common.types';

// Interface específica para este componente
interface SingleChoiceViewComponentProps {
  config: CognitiveQuestion & { options?: ChoiceOption[] };
  value: string | undefined; // El ID de la opción seleccionada
  onChange: (questionId: string, selectedOptionId: string) => void;
}

export const SingleChoiceView: React.FC<SingleChoiceViewComponentProps> = ({ config, value, onChange }) => {
  const id = config.id;
  const title = config.title;
  const description = config.description;
  const options = config.options;
  const required = config.required;

  if (!id || !options || !Array.isArray(options)) {
    console.error('[SingleChoiceView] Configuración inválida (sin ID u opciones):', config);
    return <div>Error: Pregunta mal configurada.</div>;
  }

  // El handler ahora simplemente pasa el ID de la pregunta y el ID seleccionado
  const handleRadioChange = (selectedOptionId: string) => {
    onChange(id, selectedOptionId);
  };

  return (
    <div className="space-y-4">
      {/* Usar QuestionHeader para Título y Descripción */}
      <QuestionHeader title={title} description={description} required={required} />

      {/* Usar RadioButtonGroup para las Opciones */}
      <RadioButtonGroup
        name={`question-${id}`}
        options={options}
        selectedValue={value}
        onChange={handleRadioChange}
      />
    </div>
  );
}; 