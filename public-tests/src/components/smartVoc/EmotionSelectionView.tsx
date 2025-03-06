import { useState } from 'react';

// Componente para la selección múltiple de emociones
const EmotionSelectionView = ({ onContinue }: { onContinue: () => void }) => {
  const [selectedEmotions, setSelectedEmotions] = useState<string[]>([]);
  
  const emotions = [
    { text: "Feliz", color: "bg-green-400" },
    { text: "Satisfecho", color: "bg-green-400" },
    { text: "Confiado", color: "bg-green-400" },
    { text: "Seguro", color: "bg-green-400" },
    { text: "Tranquilo", color: "bg-green-400" },
    { text: "Calma", color: "bg-green-400" },
    { text: "Interesado", color: "bg-green-400" },
    { text: "Optimista", color: "bg-yellow-400" },
    { text: "Escéptico", color: "bg-yellow-400" },
    { text: "Esperanzado", color: "bg-yellow-400" },
    { text: "Confuso", color: "bg-yellow-400" },
    { text: "Cauteloso", color: "bg-yellow-400" },
    { text: "Frustrado", color: "bg-red-400" },
    { text: "Enojado", color: "bg-red-400" },
    { text: "Decepcionado", color: "bg-red-400" },
    { text: "Estresado", color: "bg-red-400" },
    { text: "Irritado", color: "bg-red-400" },
    { text: "Desorientado", color: "bg-red-400" },
    { text: "Intimidado", color: "bg-red-400" }
  ];
  
  const toggleEmotion = (emotion: string) => {
    if (selectedEmotions.includes(emotion)) {
      setSelectedEmotions(selectedEmotions.filter(e => e !== emotion));
    } else {
      // Solo permitir hasta 3 selecciones
      if (selectedEmotions.length < 3) {
        setSelectedEmotions([...selectedEmotions, emotion]);
      }
    }
  };
  
  return (
    <div className="flex flex-col items-center justify-center w-full h-full bg-white">
      <div className="max-w-xl w-full p-8 flex flex-col items-center">
        <h2 className="text-xl font-medium text-center text-neutral-800 mb-5">
          ¿Cómo te sientes con la experiencia que<br />
          ofrece el servicio?
        </h2>
        
        <p className="text-sm text-neutral-600 mb-8">
          Por favor, selecciona hasta 3 opciones
        </p>
        
        <div className="flex flex-wrap justify-center gap-2 mb-10 max-w-md">
          {emotions.map((emotion) => (
            <button
              key={emotion.text}
              className={`px-4 py-1.5 rounded-full text-sm ${emotion.color} transition-all ${
                selectedEmotions.includes(emotion.text)
                  ? 'ring-2 ring-offset-2 ring-indigo-600 font-medium'
                  : 'opacity-80 hover:opacity-100'
              }`}
              onClick={() => toggleEmotion(emotion.text)}
            >
              {emotion.text}
            </button>
          ))}
        </div>
        
        <button
          className="bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2.5 px-8 rounded-md w-fit transition-colors shadow-sm"
          onClick={onContinue}
          disabled={selectedEmotions.length === 0}
        >
          Continuar
        </button>
      </div>
    </div>
  );
};

export default EmotionSelectionView; 