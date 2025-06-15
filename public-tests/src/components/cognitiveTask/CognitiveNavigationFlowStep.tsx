import React, { useState } from 'react';
import { CognitiveNavigationFlowStepProps } from '../../types/cognitive-task.types';

// Función para convertir hitZones del backend a formato de coordenadas
const convertHitZonesToCoordinates = (hitZones: any[]) => {
  return hitZones.map(zone => ({
    id: zone.id,
    x: zone.region.x,
    y: zone.region.y,
    width: zone.region.width,
    height: zone.region.height
  }));
};

const CognitiveNavigationFlowStep: React.FC<CognitiveNavigationFlowStepProps> = ({ onContinue, config }) => {
  // Buscar pregunta de tipo navigation_flow en la configuración
  const navigationQuestion = config?.questions?.find(q => q.type === 'navigation_flow');
  const imageFiles = navigationQuestion?.files || [];

  // Estado para manejar la selección
  const [selectedImageIndex, setSelectedImageIndex] = useState<number | null>(null);
  const [selectedHitzone, setSelectedHitzone] = useState<string | null>(null);

  // Usar solo imágenes de la config
  const images = imageFiles;

  const handleImageClick = (imageIndex: number) => {
    setSelectedImageIndex(imageIndex);
    setSelectedHitzone(null);
  };

  const handleHitzoneClick = (hitzoneId: string) => {
    setSelectedHitzone(hitzoneId);
    // Enviar respuesta inmediatamente al hacer clic en hitzone
    const responseData = {
      type: 'navigation_flow',
      selectedImage: selectedImageIndex,
      selectedHitzone: hitzoneId,
      timestamp: Date.now()
    };
    onContinue(responseData);
  };

  const selectedImage = selectedImageIndex !== null ? images[selectedImageIndex] : null;
  const availableHitzones = selectedImage?.hitZones ? convertHitZonesToCoordinates(selectedImage.hitZones) : [];

  // Mostrar error si no hay pregunta de navigation_flow o imágenes
  if (!navigationQuestion || images.length === 0) {
    return (
      <div className="w-full max-w-lg mx-auto bg-white p-6 rounded-lg shadow-md text-center">
        <h2 className="text-2xl font-bold text-gray-800 mb-4">Error de Configuración</h2>
        <p className="text-gray-600">No se pudo cargar la configuración de la tarea de navegación.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-white p-6">
      <div className="w-full max-w-6xl">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-gray-800 mb-4">
            {navigationQuestion?.title || 'Flujo de Navegación - Desktop'}
          </h1>
          <p className="text-gray-600 mb-2">
            {navigationQuestion?.description || '¿En cuál de las siguientes pantallas encuentras el objetivo indicado?'}
          </p>
          <p className="text-sm text-gray-500 italic">
            Haz clic en una opción para ver en detalle
          </p>
        </div>

        {/* Grid de imágenes en miniatura */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {images.map((image: any, index: number) => (
            <div
              key={image.id}
              className={`relative cursor-pointer border-4 rounded-lg overflow-hidden transition-all duration-200 ${
                selectedImageIndex === index
                  ? 'border-blue-500 shadow-lg scale-105'
                  : 'border-gray-200 hover:border-gray-400'
              }`}
              onClick={() => handleImageClick(index)}
            >
              <img
                src={image.url}
                alt={image.name || `Imagen ${index + 1}`}
                className="w-full h-48 object-contain bg-white"
                style={{ background: '#fff', borderRadius: '4px' }}
              />
              <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-50 text-white p-2">
                <p className="text-sm font-medium">
                  {image.name || `Vista ${index + 1}`}
                </p>
                {image.hitZones && image.hitZones.length > 0 && (
                  <p className="text-xs opacity-75">
                    {image.hitZones.length} zona(s) interactiva(s)
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Vista detallada de imagen seleccionada */}
        {selectedImage && (
          <div className="border-2 border-gray-300 rounded-lg overflow-hidden bg-gray-50">
            <div className="bg-gray-100 px-4 py-2 border-b">
              <h3 className="font-semibold text-gray-800">
                Vista detallada: {selectedImage.name || `Imagen ${selectedImageIndex! + 1}`}
              </h3>
              <p className="text-sm text-gray-600">
                {availableHitzones.length > 0
                  ? 'Haz clic en las zonas destacadas para interactuar'
                  : 'No hay zonas interactivas definidas'}
              </p>
            </div>

            <div className="relative inline-block max-w-full">
              <img
                src={selectedImage.url}
                alt={selectedImage.name || `Imagen detallada ${selectedImageIndex! + 1}`}
                className="max-w-full h-auto block bg-white"
                style={{ maxHeight: '400px', margin: '0 auto', background: '#fff', borderRadius: '4px' }}
              />

              {/* Renderizar hitzones */}
              {availableHitzones.map((hitzone) => (
                <div
                  key={hitzone.id}
                  className={`absolute cursor-pointer transition-all duration-200 ${
                    selectedHitzone === hitzone.id
                      ? 'bg-green-500 bg-opacity-40 border-2 border-green-600'
                      : 'bg-blue-500 bg-opacity-20 border-2 border-blue-400 hover:bg-opacity-30'
                  }`}
                  style={{
                    left: `${hitzone.x}%`,
                    top: `${hitzone.y}%`,
                    width: `${hitzone.width}%`,
                    height: `${hitzone.height}%`,
                  }}
                  onClick={() => handleHitzoneClick(hitzone.id)}
                  title={`Zona interactiva: ${hitzone.id}`}
                />
              ))}
            </div>
          </div>
        )}

        {/* Instrucciones finales */}
        <div className="text-center mt-6">
          <p className="text-sm text-gray-500">
            Revisa todas las pantallas antes de elegir una únicamente
          </p>
        </div>
      </div>
    </div>
  );
};

export default CognitiveNavigationFlowStep;
