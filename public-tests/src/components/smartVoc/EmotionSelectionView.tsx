import React, { useState } from 'react';

// Definición de un tipo para los emojis básicos (o podría venir de props)
interface BasicEmoji {
  emoji: string; // El caracter emoji
  label: string; // Un identificador o descripción (opcional)
}

interface EmotionSelectionViewProps {
  questionText: string;
  instructions?: string;
  companyName?: string;
  // emojis?: BasicEmoji[]; // Opcionalmente recibir emojis por props
  onNext: (selectedEmoji: string) => void; // Devuelve el emoji seleccionado
}

// Conjunto básico de emojis predefinido (se puede expandir o pasar por props)
const basicEmojis: BasicEmoji[] = [
  { emoji: '😊', label: 'Feliz' },
  { emoji: '😐', label: 'Neutral' },
  { emoji: '😞', label: 'Triste' },
  { emoji: '😠', label: 'Enojado' },
  { emoji: '😕', label: 'Confuso' },
  // Añadir más si es necesario
];

const EmotionSelectionView: React.FC<EmotionSelectionViewProps> = ({
  questionText,
  instructions,
  companyName,
  // emojis = basicEmojis, // Usar emojis de props si se pasan, si no los básicos
  onNext
}) => {
  // Usar emojis básicos predefinidos por ahora
  const emojis = basicEmojis;
  const [selectedEmoji, setSelectedEmoji] = useState<string | null>(null); // Solo permite UN emoji (string)

  const handleSelect = (emoji: string) => {
    setSelectedEmoji(emoji); // Reemplaza la selección anterior
  };

  const handleNextClick = () => {
    if (selectedEmoji !== null) {
      onNext(selectedEmoji);
    }
  };

  // Formatear el texto de la pregunta
  const formattedQuestionText = companyName
    ? questionText.replace(/\[company\]|\[empresa\]/gi, companyName)
    : questionText;

  return (
    <div className="flex flex-col items-center justify-center w-full h-full bg-white p-8">
      <div className="max-w-xl w-full flex flex-col items-center">
        <h2 className="text-xl font-medium text-center text-neutral-800 mb-4">
          {formattedQuestionText}
        </h2>

        {instructions && (
          <p className="text-sm text-center text-neutral-600 mb-8">
            {instructions}
          </p>
        )}

        <div className="flex flex-wrap justify-center gap-4 mb-10"> {/* Ajustar gap */}
          {emojis.map((item) => (
            <button
              key={item.label} // Usar label como key
              onClick={() => handleSelect(item.emoji)} // Seleccionar el emoji
              // Aplicar estilo visual para selección única
              className={`p-2 rounded-full text-3xl transition-transform duration-150 ease-in-out ${selectedEmoji === item.emoji
                ? 'bg-indigo-100 scale-110 ring-2 ring-indigo-500'
                : 'hover:scale-110'
              }`}
            >
              {item.emoji} {/* Mostrar el emoji */}
            </button>
          ))}
        </div>

        <button
          className="bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2.5 px-8 rounded-md w-fit transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
          onClick={handleNextClick}
          disabled={selectedEmoji === null} // Deshabilitar si no hay selección
        >
          Siguiente
        </button>
      </div>
    </div>
  );
};

export default EmotionSelectionView; 