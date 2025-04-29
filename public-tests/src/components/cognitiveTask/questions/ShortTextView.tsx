import React from 'react';
// FIXME: La importación de la interfaz compartida falla. Usando 'any' temporalmente.
// import { CognitiveQuestion } from '../../../../shared/interfaces/cognitive-task.interface'; 

interface ShortTextViewProps {
  config: any; // FIXME: Debería ser CognitiveQuestion
  value: string | undefined;
  onChange: (questionId: string, value: string) => void;
}

export const ShortTextView: React.FC<ShortTextViewProps> = ({ config, value, onChange }) => {
  // Acceder a propiedades con optional chaining por seguridad debido al tipo 'any'
  const id = config?.id;
  const title = config?.title;
  const description = config?.description;
  const answerPlaceholder = config?.answerPlaceholder;
  const required = config?.required;
  
  // Asegurarse de que tenemos un ID antes de intentar renderizar
  if (!id) {
      console.error('[ShortTextView] Configuración de pregunta inválida (sin ID):', config);
      return <div>Error: Pregunta mal configurada.</div>;
  }

  return (
    <div className="space-y-4">
      {/* Título de la Pregunta */}
      {title && (
          <h3 className="text-lg font-semibold text-gray-800">
              {title} {required && <span className="text-red-500">*</span>}
          </h3>
      )}
      
      {/* Descripción / Texto de la Pregunta */}  
      {description && (
           <p className="text-base text-gray-600">
              {description}
          </p>
      )}
      
      {/* Campo de Respuesta */}
      <div>
          <label htmlFor={`short-text-${id}`} className="sr-only">{title || description || 'Respuesta'}</label>
          <input
              type="text"
              id={`short-text-${id}`}
              className="w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition duration-150 ease-in-out"
              value={value || ''}
              onChange={(e) => onChange(id, e.target.value)}
              placeholder={answerPlaceholder || 'Escribe tu respuesta...'} // Usar el placeholder de config
              aria-required={required}
          />
      </div>
    </div>
  );
}; 