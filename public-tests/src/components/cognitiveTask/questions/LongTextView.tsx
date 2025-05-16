import React, { useState, useEffect } from 'react';
import QuestionHeader from '../common/QuestionHeader';
import TextAreaField from '../../common/TextAreaField';

interface LongTextViewProps {
  config: any;
  value: string | undefined;
  onChange: (questionId: string, value: string) => void;
  onStepComplete?: (answer: any) => void;
  isLoading?: boolean;
  error?: string | null;
}

export const LongTextView: React.FC<LongTextViewProps> = ({ config, value, onChange, onStepComplete, isLoading = false, error = null }) => {
  const id = config?.id;
  const title = config?.title;
  const description = config?.description;
  const answerPlaceholder = config?.answerPlaceholder;
  const required = config?.required;

  // Estado local para la respuesta
  const [currentResponse, setCurrentResponse] = useState<string>(value || '');
  const [localError, setLocalError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [logs, setLogs] = useState<string[]>([]);

  // Sincronizar valor externo (por ejemplo, si se carga una respuesta previa)
  useEffect(() => {
    setCurrentResponse(value || '');
  }, [value]);

  if (!id) {
    console.error('[LongTextView] Configuración inválida (sin ID):', config);
    return <div className="p-4 text-red-600">Error: Pregunta mal configurada.</div>;
  }

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setCurrentResponse(e.target.value);
    setLocalError(null);
    onChange(id, e.target.value);
  };

  const handleSubmit = () => {
    setLogs(prev => [...prev, '[LongTextView] handleSubmit ejecutado.']);
    if (required && !currentResponse.trim()) {
      setLocalError('Por favor, escribe una respuesta.');
      setLogs(prev => [...prev, 'Validación fallida: respuesta vacía.']);
      return;
    }
    setIsSubmitting(true);
    setLogs(prev => [...prev, `Guardando respuesta: ${currentResponse}`]);
    if (onStepComplete) {
      onStepComplete(currentResponse);
    }
    setTimeout(() => {
      setIsSubmitting(false);
      setLogs(prev => [...prev, 'Respuesta guardada y submit finalizado.']);
    }, 500);
  };

  return (
    <div className="bg-white p-8 rounded-lg shadow-md max-w-lg w-full">
      <QuestionHeader
        title={title}
        description={description}
        required={required}
      />
      <TextAreaField
        id={`long-text-${id}`}
        label={title || description || 'Respuesta de texto largo'}
        value={currentResponse}
        onChange={handleChange}
        placeholder={answerPlaceholder || 'Escribe tu respuesta detallada aquí...'}
        required={required}
        disabled={isSubmitting || isLoading}
      />
      {(localError || error) && (
        <div className="bg-red-50 border border-red-200 text-sm text-red-700 px-4 py-3 rounded mb-4 mt-2" role="alert">
          <strong className="font-bold">Error: </strong>
          <span>{localError || error}</span>
        </div>
      )}
      <button
        onClick={handleSubmit}
        className="bg-primary-600 hover:bg-primary-700 text-white font-medium py-2 px-6 rounded-lg transition-colors mt-4"
        disabled={isSubmitting || isLoading}
      >
        {isSubmitting || isLoading ? 'Guardando...' : 'Guardar y continuar'}
      </button>
      {/* Logs de depuración */}
      {logs.length > 0 && (
        <div className="mt-4 text-xs text-gray-400">
          <div className="font-bold mb-1">[Debug logs]</div>
          <ul className="list-disc pl-4">
            {logs.map((log, idx) => <li key={idx}>{log}</li>)}
          </ul>
        </div>
      )}
    </div>
  );
}; 