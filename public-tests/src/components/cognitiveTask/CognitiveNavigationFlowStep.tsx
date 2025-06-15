import React, { useRef, useState } from 'react';
import { CognitiveNavigationFlowStepProps } from '../../types/cognitive-task.types';

// Función para convertir hitZones del backend a coordenadas absolutas en píxeles
const convertHitZonesToPixelCoordinates = (hitZones: any[]) => {
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
  console.log('imageFiles: ', imageFiles);

  // Estado para manejar la selección
  const [selectedImageIndex, setSelectedImageIndex] = useState<number | null>(null);
  const [selectedHitzone, setSelectedHitzone] = useState<string | null>(null);
  // Estado para manejar el tamaño real de la imagen y su tamaño natural
  const [imgSize, setImgSize] = useState<{width: number, height: number} | null>(null);
  const [imgNatural, setImgNatural] = useState<{width: number, height: number} | null>(null);
  const imgRef = useRef<HTMLImageElement>(null);

  // Usar solo imágenes de la config
  const images = imageFiles;

  const handleImageClick = (imageIndex: number) => {
    setSelectedImageIndex(imageIndex);
    setSelectedHitzone(null);
  };

  // Siempre mostrar la primera imagen y sus hitzones
  const selectedImage = images[0];
  const availableHitzones = selectedImage?.hitZones ? convertHitZonesToPixelCoordinates(selectedImage.hitZones) : [];

  // Función para calcular el área visible de la imagen (letterboxing)
  function getImageDrawRect(imgNatural: {width: number, height: number}, container: {width: number, height: number}) {
    const imgRatio = imgNatural.width / imgNatural.height;
    const containerRatio = container.width / container.height;
    let drawWidth = container.width;
    let drawHeight = container.height;
    let offsetX = 0;
    let offsetY = 0;
    if (imgRatio > containerRatio) {
      // Imagen más ancha que el contenedor
      drawWidth = container.width;
      drawHeight = container.width / imgRatio;
      offsetY = (container.height - drawHeight) / 2;
    } else {
      // Imagen más alta que el contenedor
      drawHeight = container.height;
      drawWidth = container.height * imgRatio;
      offsetX = (container.width - drawWidth) / 2;
    }
    return { drawWidth, drawHeight, offsetX, offsetY };
  }

  // Al cargar la imagen, guardar también su tamaño natural
  const handleImgLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const { width, height, naturalWidth, naturalHeight } = e.currentTarget;
    setImgSize({ width, height });
    setImgNatural({ width: naturalWidth, height: naturalHeight });
  };

  // Mostrar error si no hay imágenes
  if (images.length === 0) {
    return (
      <div className="w-full max-w-lg mx-auto bg-white p-6 rounded-lg shadow-md text-center">
        <h2 className="text-2xl font-bold text-gray-800 mb-4">Error de Configuración</h2>
        <p className="text-gray-600">No se pudo cargar la configuración de la tarea de navegación.</p>
      </div>
    );
  }

  return (
    <div>
      <div className="text-center">
        <h1 className="text-2xl font-bold text-gray-800 mb-4">
          {navigationQuestion?.title || 'Flujo de Navegación - Desktop'}
        </h1>
        <p className="text-gray-600 mb-2">
          {navigationQuestion?.description || '¿En cuál de las siguientes pantallas encuentras el objetivo indicado?'}
        </p>
      </div>
      <div className="flex flex-col items-center py-8">
        <div className="relative w-[80vw] max-w-4xl bg-white rounded-lg shadow-lg overflow-hidden">
          <img
            ref={imgRef}
            src={selectedImage.url}
            alt={selectedImage.name || 'Imagen detallada'}
            className="w-full h-auto max-h-[80vh] object-contain bg-white"
            loading="lazy"
            style={{ display: 'block' }}
            onLoad={handleImgLoad}
          />
          {/* Renderizar hitzones usando coordenadas escaladas y compensando letterboxing con natural size */}
          {imgSize && imgNatural && availableHitzones.map((hitzone, _idx) => {
            // Calcular el área visible de la imagen (letterboxing) usando el aspect ratio real
            const { drawWidth, drawHeight, offsetX, offsetY } = getImageDrawRect(
              imgNatural,
              imgSize
            );
            // Escalar desde el sistema de referencia natural de la imagen
            const scaleX = drawWidth / imgNatural.width;
            const scaleY = drawHeight / imgNatural.height;
            const left = hitzone.x * scaleX + offsetX;
            const top = hitzone.y * scaleY + offsetY;
            const width = hitzone.width * scaleX;
            const height = hitzone.height * scaleY;
            return (
              <div
                key={hitzone.id}
                className={`absolute cursor-pointer transition-all duration-200 ${
                  selectedHitzone === hitzone.id
                    ? 'bg-green-500 bg-opacity-40 border-2 border-green-600'
                    : 'bg-blue-500 bg-opacity-20 border-2 border-blue-400 hover:bg-opacity-30'
                }`}
                style={{
                  left: `${left}px`,
                  top: `${top}px`,
                  width: `${width}px`,
                  height: `${height}px`,
                }}
                onClick={() => {
                  setSelectedHitzone(hitzone.id);
                  alert(`¡Hitzone ${hitzone.id} presionado!`);
                }}
                title={`Zona interactiva: ${hitzone.id}`}
              />
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default CognitiveNavigationFlowStep;
