import React, { useState, useRef } from 'react';
import { Question as CognitiveQuestion } from '../../../../shared/interfaces/cognitive-task.interface';

interface CognitiveNavigationFlowStepProps {
  onContinue: (responseData?: unknown) => void;
  config?: {
    questions: CognitiveQuestion[];
  };
}

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
  // Buscar pregunta de tipo preference_test en la configuración
  const preferenceQuestion = config?.questions?.find(q => q.type === 'preference_test');
  const imageFiles = preferenceQuestion?.files || [];
  
  const [selectedImage, setSelectedImage] = useState<number | null>(null);
  const [showModal, setShowModal] = useState(false);
  const modalRef = useRef<HTMLDivElement>(null);
  
  // Datos hardcodeados como fallback
  const fallbackImages = [
    {
      id: 'preference-a',
      name: 'Opción A',
      url: 'https://via.placeholder.com/400x300/e8f5e8/2e7d32?text=Opción+A',
      hitZones: [{
        id: 'button-a',
        name: 'Seleccionar A',
        region: { x: 0.3, y: 0.7, width: 0.4, height: 0.2 },
        fileId: 'preference-a'
      }]
    },
    {
      id: 'preference-b',
      name: 'Opción B', 
      url: 'https://via.placeholder.com/400x300/fff3e0/f57c00?text=Opción+B',
      hitZones: [{
        id: 'button-b',
        name: 'Seleccionar B',
        region: { x: 0.3, y: 0.7, width: 0.4, height: 0.2 },
        fileId: 'preference-b'
      }]
    }
  ];
  
  // Usar imágenes de configuración o fallback
  const images = imageFiles.length > 0 ? imageFiles : fallbackImages;

  const handleImageClick = (imageIndex: number) => {
    setSelectedImage(imageIndex);
  };

  const handleHitzoneClick = (hitzoneId: string, imageIndex: number) => {
    console.log(`[CognitiveNavigationFlowStep] Hitzone clicked: ${hitzoneId} on image ${imageIndex}`);
    setShowModal(true);
    
    // Enviar respuesta tras 3 segundos (simulando confirmación del modal)
    setTimeout(() => {
      const responseData = {
        type: 'preference_test',
        selectedImage: imageIndex,
        selectedHitzone: hitzoneId,
        timestamp: Date.now()
      };
      
      setShowModal(false);
      onContinue(responseData);
    }, 3000);
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-white p-6">
      <div className="w-full max-w-4xl">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-gray-800 mb-4">
            {preferenceQuestion?.title || 'Prueba de Preferencia'}
          </h1>
          <p className="text-gray-600 mb-2">
            {preferenceQuestion?.description || 'Elige la opción que prefieras'}
          </p>
          <p className="text-sm text-gray-500 italic">
            Haz clic en una imagen para ver los detalles y zonas interactivas
          </p>
        </div>

        {/* Grid de opciones */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
          {images.slice(0, 2).map((image, index) => {
            const isSelected = selectedImage === index;
            const availableHitzones = image.hitZones ? convertHitZonesToCoordinates(image.hitZones) : [];
            
            return (
              <div 
                key={image.id}
                className={`relative border-4 rounded-lg overflow-hidden transition-all duration-300 ${
                  isSelected 
                    ? 'border-blue-500 shadow-xl scale-105' 
                    : 'border-gray-200 hover:border-gray-400 cursor-pointer'
                }`}
                onClick={() => !isSelected && handleImageClick(index)}
              >
                <div className="relative">
                  <img
                    src={image.url}
                    alt={image.name || `Opción ${index + 1}`}
                    className="w-full h-64 object-cover"
                  />
                  
                  {/* Renderizar hitzones solo si la imagen está seleccionada */}
                  {isSelected && availableHitzones.map((hitzone) => (
                    <div
                      key={hitzone.id}
                      className="absolute cursor-pointer transition-all duration-200 bg-blue-500 bg-opacity-25 border-2 border-blue-400 hover:bg-opacity-40"
                      style={{
                        left: `${hitzone.x}%`,
                        top: `${hitzone.y}%`,
                        width: `${hitzone.width}%`,
                        height: `${hitzone.height}%`,
                      }}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleHitzoneClick(hitzone.id, index);
                      }}
                      title={`Zona interactiva: ${hitzone.id}`}
                    />
                  ))}
                </div>
                
                <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-60 text-white p-3">
                  <p className="font-semibold text-lg">
                    {image.name || `Opción ${String.fromCharCode(65 + index)}`}
                  </p>
                  {image.hitZones && image.hitZones.length > 0 && (
                    <p className="text-sm opacity-90">
                      {isSelected 
                        ? 'Haz clic en las zonas azules para seleccionar'
                        : `${image.hitZones.length} zona(s) interactiva(s) disponible(s)`
                      }
                    </p>
                  )}
                  {!isSelected && (
                    <p className="text-xs mt-1 opacity-75">
                      Clic para ver detalles
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Información adicional */}
        <div className="text-center">
          <p className="text-sm text-gray-500">
            {selectedImage !== null 
              ? 'Haz clic en las zonas resaltadas para hacer tu selección'
              : 'Selecciona una opción para ver las zonas interactivas'
            }
          </p>
        </div>

        {/* Modal de confirmación */}
        {showModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div 
              ref={modalRef}
              className="bg-white rounded-lg p-6 max-w-sm w-full mx-4 text-center transform transition-all duration-300 scale-100"
            >
              <div className="mb-4">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-gray-800 mb-2">
                  ¡Excelente elección!
                </h3>
                <p className="text-gray-600">
                  Has seleccionado la zona interactiva correctamente.
                </p>
              </div>
              
              <div className="w-full bg-gray-200 rounded-full h-2 mb-4">
                <div 
                  className="bg-green-600 h-2 rounded-full w-0 animate-pulse"
                  style={{ 
                    width: '100%',
                    transition: 'width 3s linear'
                  }}
                />
              </div>
              
              <p className="text-sm text-gray-500">
                Continuando automáticamente...
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CognitiveNavigationFlowStep; 