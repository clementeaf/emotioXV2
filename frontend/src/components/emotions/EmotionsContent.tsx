import React from 'react';

// Datos mock locales para emociones
const mockEmotionsData = {
  emotions: [
    { id: 1, name: 'Alegría', intensity: 85, color: '#FFD700' },
    { id: 2, name: 'Tristeza', intensity: 30, color: '#4682B4' },
    { id: 3, name: 'Enojo', intensity: 45, color: '#DC143C' },
    { id: 4, name: 'Miedo', intensity: 20, color: '#800080' },
    { id: 5, name: 'Sorpresa', intensity: 60, color: '#FFA500' },
    { id: 6, name: 'Disgusto', intensity: 15, color: '#228B22' },
  ],
  totalResponses: 150,
  averageIntensity: 42.5,
};

/**
 * Componente principal del contenido del dashboard de emociones
 */
export const EmotionsContent: React.FC = () => {
  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-6">Análisis de Emociones</h2>
      <div className="space-y-4">
        {mockEmotionsData.emotions.map((emotion) => (
          <div key={emotion.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center space-x-3">
              <div
                className="w-4 h-4 rounded-full"
                style={{ backgroundColor: emotion.color }}
              />
              <span className="font-medium">{emotion.name}</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-32 bg-gray-200 rounded-full h-2">
                <div
                  className="h-2 rounded-full"
                  style={{
                    width: `${emotion.intensity}%`,
                    backgroundColor: emotion.color
                  }}
                />
              </div>
              <span className="text-sm text-gray-600">{emotion.intensity}%</span>
            </div>
          </div>
        ))}
      </div>
      <div className="mt-6 p-4 bg-blue-50 rounded-lg">
        <p className="text-sm text-gray-600">
          Total de respuestas: {mockEmotionsData.totalResponses} |
          Intensidad promedio: {mockEmotionsData.averageIntensity}%
        </p>
      </div>
    </div>
  );
};
