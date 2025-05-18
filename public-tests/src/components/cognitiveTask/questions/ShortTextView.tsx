import React from 'react';
// Importar subcomponentes reutilizables
import QuestionHeader from '../common/QuestionHeader';
import FormField from '../../common/FormField'; // Ruta corregida (subir dos niveles)
import { CognitiveQuestion } from '../../../hooks/useCognitiveTask';
// FIXME: La importación de la interfaz compartida falla. Usando 'any' temporalmente.
// import { CognitiveQuestion } from '../../../../shared/interfaces/cognitive-task.interface'; 

interface ShortTextViewProps {
  config: CognitiveQuestion;
  value: string | undefined;
  onChange: (questionId: string, value: string) => void;
}

export const ShortTextView: React.FC<ShortTextViewProps> = ({ config, value, onChange }) => {
  // Extracción de datos
  const id = config.id;
  const title = config.title;
  const description = config.description;
  const answerPlaceholder = config.answerPlaceholder;
  const required = config.required;

  if (!id) {
    console.error('[ShortTextView] Configuración inválida (sin ID):', config);
    return <div className="p-4 text-red-600">Error: Pregunta mal configurada.</div>;
  }

  // Handler simplificado, FormField devuelve el evento
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange(id, e.target.value);
  };

  return (
    <div className="space-y-4">
      <QuestionHeader
        title={title}
        description={description}
        required={required}
      />

      {/* Usar FormField para el input */}
      <FormField
        id={`short-text-${id}`}
        // Usar name=id para que handleInputChange funcione si se reutilizara hook de form
        name={id} 
        // Label es sr-only en FormField por defecto si no se muestra explícitamente
        label={title || description || 'Respuesta corta'} 
        type="text"
        value={value || ''}
        onChange={handleChange}
        placeholder={answerPlaceholder || 'Escribe tu respuesta aquí...'}
        // error={/* Pasar error si hubiera validación */} 
        disabled={false} // Pasar disabled si viniera de config
        required={required} // Pasar required a FormField si este lo usara para aria-*
      />
    </div>
  );
}; 