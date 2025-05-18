import React, { useState } from 'react';
import ImageViewWithSelection from './taskViews/ImageViewWithSelection';
import TextOnlyInputView from './taskViews/TextOnlyInputView';
import LongTextInputView from './taskViews/LongTextInputView';
import TaskFooter from './common/TaskFooter';

// Tipo para los formatos de visualización
type ViewFormat = 'text-only' | 'desktop-image' | 'mobile-image' | 'long-text';

// Interfaz para las opciones
interface ChoiceOption {
  id: string;
  label: string;
}

interface TransactionAuthTaskProps {
  onContinue: () => void;
  viewFormat?: ViewFormat; // Formato opcional, por defecto será 'desktop-image'
}

// Opciones codificadas (se mantienen aquí o podrían venir de props/config)
const options: ChoiceOption[] = [
  { id: 'dashboard', label: 'Panel de inversiones' },
  { id: 'transaction', label: 'Detalle de transacción' },
  { id: 'advisor', label: 'Consulta con asesor' }
];

// Textos descriptivos (centralizados)
const TEXT_ONLY_DESCRIPTION = "No problem. Just let us know your email address and we'll email you a password reset link that will allow you to choose a new one. You a password reset link.";
const LONG_TEXT_DESCRIPTION = TEXT_ONLY_DESCRIPTION; // Usan el mismo texto

// Componente para la tarea de identificación de interfaz para autorizar transacciones
const TransactionAuthTask: React.FC<TransactionAuthTaskProps> = ({
  onContinue,
  viewFormat = 'desktop-image',
}) => {
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [textInputValue, setTextInputValue] = useState<string>(''); // Nuevo estado para text-only
  const [longText, setLongText] = useState<string>('');
  const [error, setError] = useState<string | null>(null);

  const handleOptionSelect = (option: string) => {
    setSelectedOption(option);
    setError(null);
  };

  const handleContinue = () => {
    setError(null); // Limpiar error al intentar continuar
    let dataToSend: Record<string, unknown> = {}; // Objeto para recolectar la data

    switch (viewFormat) {
      case 'desktop-image':
      case 'mobile-image':
        if (!selectedOption) {
          setError('Por favor, selecciona una opción antes de continuar');
          return;
        }
        dataToSend = { selectedOption };
        break;
      case 'text-only':
        // Aquí podríamos añadir validación para textInputValue si fuera necesario
        dataToSend = { email: textInputValue }; // Asumiendo que es email
        break;
      case 'long-text':
        // Validación opcional para longText
        dataToSend = { feedback: longText };
        break;
    }

    console.log('Datos de la tarea:', dataToSend);
    onContinue(); // Llamar a onContinue solo si la validación pasa
  };

  // Determinar título y color de fondo basado en viewFormat
  const isTextFormat = viewFormat === 'text-only' || viewFormat === 'long-text';
  const title = isTextFormat ? '¿Cómo resolverías el problema?' : '¿Con cuál de las pantallas puedes autorizar una transacción?';
  const bgColor = isTextFormat ? 'bg-white' : 'bg-blue-50';
  const showFooter = !isTextFormat;

  // Renderizar el contenido específico del formato
  const renderTaskContent = () => {
    switch (viewFormat) {
      case 'desktop-image':
      case 'mobile-image':
        return (
          <ImageViewWithSelection
            imageType={viewFormat === 'desktop-image' ? 'desktop' : 'mobile'}
            options={options}
            selectedOption={selectedOption}
            onOptionSelect={handleOptionSelect}
          />
        );
      case 'text-only':
        return (
          <TextOnlyInputView
            description={TEXT_ONLY_DESCRIPTION}
            placeholder="Email@dominio.com"
            value={textInputValue}
            onChange={setTextInputValue}
          />
        );
      case 'long-text':
        return (
          <LongTextInputView
            description={LONG_TEXT_DESCRIPTION}
            placeholder="Me siento honrado de opinar..."
            value={longText}
            onChange={setLongText}
            maxLength={100}
          />
        );
      default:
        return <div>Formato de vista no reconocido.</div>;
    }
  };

  return (
    <div className={`flex flex-col items-center justify-center w-full min-h-full ${bgColor} p-6`}>
      <div className="max-w-4xl w-full flex flex-col items-center">
        <h2 className="text-xl font-medium text-center text-neutral-800 mb-6">
          {title}
        </h2>

        {renderTaskContent()}

        {error && (
          <p className="text-red-500 text-sm mt-1 mb-4">
            {error}
          </p>
        )}

        <div className="flex justify-center mt-4">
          <button
            onClick={handleContinue}
            className="bg-indigo-700 hover:bg-indigo-800 text-white font-medium py-2.5 px-10 rounded w-32 transition-colors shadow-sm disabled:opacity-50"
            // Deshabilitar si es necesario (ej. campo requerido vacío)
          >
            Continuar
          </button>
        </div>

        {showFooter && <TaskFooter />}
      </div>
    </div>
  );
};

export default TransactionAuthTask; 