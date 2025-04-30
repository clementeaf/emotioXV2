import React from 'react';
// Importar subcomponentes
import QuestionHeader from '../common/QuestionHeader';
import TextAreaField from '../../common/TextAreaField'; // Ruta corregida (subir dos niveles)

// Asumimos que la configuración viene con una estructura similar a ShortTextView
// pero se renderiza con textarea.
interface LongTextViewProps {
  config: any; // FIXME: Usar tipo CognitiveQuestion real cuando esté disponible
  value: string | undefined;
  onChange: (questionId: string, value: string) => void;
}

export const LongTextView: React.FC<LongTextViewProps> = ({ config, value, onChange }) => {
  // Extracción de datos
  const id = config?.id;
  const title = config?.title;
  const description = config?.description;
  const answerPlaceholder = config?.answerPlaceholder;
  const required = config?.required;

  if (!id) {
    console.error('[LongTextView] Configuración inválida (sin ID):', config);
    return <div className="p-4 text-red-600">Error: Pregunta mal configurada.</div>;
  }

  // El handler se simplifica porque TextAreaField devuelve el evento completo
  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    onChange(id, e.target.value);
  };

  return (
    <div className="space-y-4">
      <QuestionHeader
        title={title}
        description={description}
        required={required}
      />

      {/* Usar el nuevo componente para el textarea */}
      <TextAreaField
        id={`long-text-${id}`}
        // Pasar label para accesibilidad (sr-only se maneja dentro)
        label={title || description || 'Respuesta de texto largo'}
        value={value || ''}
        onChange={handleChange}
        placeholder={answerPlaceholder || 'Escribe tu respuesta detallada aquí...'}
        required={required}
        // Pasar otras props como rows, disabled si vinieran de config
      />
    </div>
  );
}; 