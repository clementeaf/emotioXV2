import React, { useRef, useState } from 'react';
import { CognitiveQuestion } from '../../types/cognitive-task.types';
import { MappedStepComponentProps } from '../../types/flow.types';

// Función para convertir hitZones del backend a coordenadas absolutas en píxeles
const convertHitZonesToPixelCoordinates = (hitZones: any[]) => {
  console.log('[convertHitZonesToPixelCoordinates] hitZones recibidos:', hitZones);

  if (!Array.isArray(hitZones)) {
    console.warn('[convertHitZonesToPixelCoordinates] hitZones no es un array:', hitZones);
    return [];
  }

  return hitZones.map((zone, index) => {
    console.log(`[convertHitZonesToPixelCoordinates] Procesando zona ${index}:`, zone);

    // Manejar diferentes estructuras de hitZones
    let coordinates;

    if (zone.region) {
      // Estructura: { id, region: { x, y, width, height } }
      coordinates = {
        id: zone.id,
        x: zone.region.x,
        y: zone.region.y,
        width: zone.region.width,
        height: zone.region.height
      };
    } else if (zone.x !== undefined) {
      // Estructura: { id, x, y, width, height }
      coordinates = {
        id: zone.id,
        x: zone.x,
        y: zone.y,
        width: zone.width,
        height: zone.height
      };
    } else {
      console.warn('[convertHitZonesToPixelCoordinates] Estructura de zona no reconocida:', zone);
      return null;
    }

    console.log(`[convertHitZonesToPixelCoordinates] Coordenadas procesadas:`, coordinates);
    return coordinates;
  }).filter(Boolean); // Filtrar valores null
};

const CognitiveNavigationFlowStep: React.FC<MappedStepComponentProps> = (props) => {
  // 1. Extraemos las props del objeto genérico
  const { stepConfig, onStepComplete } = props;
  const onContinue = onStepComplete; // 2. Renombramos para compatibilidad interna

  // 3. Lógica de estado y del componente original - CORREGIDA
  // Manejar tanto el caso de array de preguntas como pregunta individual
  let navigationQuestion: any = null;

  if (stepConfig && typeof stepConfig === 'object') {
    // Caso 1: stepConfig es un array de preguntas (formato anterior)
    if ('questions' in stepConfig && Array.isArray((stepConfig as any).questions)) {
      const config = stepConfig as { questions: CognitiveQuestion[] };
      navigationQuestion = config.questions.find(q => q.type === 'navigation_flow' || q.type === 'preference_test');
    }
    // Caso 2: stepConfig es directamente la pregunta (formato actual del log)
    else if ('type' in stepConfig && ((stepConfig as any).type === 'navigation_flow' || (stepConfig as any).type === 'preference_test')) {
      navigationQuestion = stepConfig;
    }
  }

  const imageFiles = navigationQuestion?.files || [];

  // Logs de depuración MEJORADOS
  console.log('[CognitiveNavigationFlowStep] stepConfig recibido:', stepConfig);
  console.log('[CognitiveNavigationFlowStep] navigationQuestion extraída:', navigationQuestion);
  console.log('[CognitiveNavigationFlowStep] imageFiles encontrados:', imageFiles);

  // LOG ESPECÍFICO PARA HITZONES DEBUG
  if (imageFiles && imageFiles.length > 0) {
    imageFiles.forEach((file: any, index: number) => {
      console.log(`[CognitiveNavigationFlowStep] 🎯 HITZONE DEBUG File ${index}:`);
      console.log(`  - File ID: ${file.id}`);
      console.log(`  - File name: ${file.name}`);
      console.log(`  - hitZones field exists: ${file.hasOwnProperty('hitZones')}`);
      console.log(`  - hitZones value: ${file.hitZones}`);
      console.log(`  - hitZones type: ${typeof file.hitZones}`);
      console.log(`  - hitZones isArray: ${Array.isArray(file.hitZones)}`);
      console.log(`  - All file keys:`, Object.keys(file));
      console.log(`  - Full file object:`, JSON.stringify(file, null, 2));
    });
  }

  const [selectedHitzone, setSelectedHitzone] = useState<string | null>(null);
  const [imgSize, setImgSize] = useState<{width: number, height: number} | null>(null);
  const [imgNatural, setImgNatural] = useState<{width: number, height: number} | null>(null);
  const imgRef = useRef<HTMLImageElement>(null);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  const images = imageFiles;

  const selectedImage = images[currentImageIndex];
  const availableHitzones = selectedImage?.hitZones ? convertHitZonesToPixelCoordinates(selectedImage.hitZones) : [];

  // Logs específicos para hitzones
  console.log('[CognitiveNavigationFlowStep] selectedImage:', selectedImage);
  console.log('[CognitiveNavigationFlowStep] selectedImage?.hitZones:', selectedImage?.hitZones);
  console.log('[CognitiveNavigationFlowStep] availableHitzones procesados:', availableHitzones);

  function getImageDrawRect(imgNatural: {width: number, height: number}, container: {width: number, height: number}) {
    const imgRatio = imgNatural.width / imgNatural.height;
    const containerRatio = container.width / container.height;
    let drawWidth = container.width;
    let drawHeight = container.height;
    let offsetX = 0;
    let offsetY = 0;
    if (imgRatio > containerRatio) {
      drawWidth = container.width;
      drawHeight = container.width / imgRatio;
      offsetY = (container.height - drawHeight) / 2;
    } else {
      drawHeight = container.height;
      drawWidth = container.height * imgRatio;
      offsetX = (container.width - drawWidth) / 2;
    }
    return { drawWidth, drawHeight, offsetX, offsetY };
  }

  const handleImgLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const { width, height, naturalWidth, naturalHeight } = e.currentTarget;
    setImgSize({ width, height });
    setImgNatural({ width: naturalWidth, height: naturalHeight });
  };

  if (!images || images.length === 0) {
    return (
      <div className="w-full max-w-lg mx-auto bg-white p-6 rounded-lg shadow-md text-center">
        <h2 className="text-2xl font-bold text-gray-800 mb-4">Error de Configuración</h2>
        <p className="text-gray-600">No se pudo cargar la configuración de la tarea de navegación.</p>
      </div>
    );
  }

  return (
    <div className="py-6">
      <div className="max-w-4xl mx-auto px-4">
        <div className="text-center mb-6">
          <h1 className="text-xl md:text-2xl font-bold text-gray-800 mb-3 leading-tight">
            {navigationQuestion?.title || 'Prueba de Navegación'}
          </h1>
          <p className="text-sm md:text-base text-gray-600 mb-4 max-w-2xl mx-auto leading-relaxed">
            {navigationQuestion?.description || 'Haz clic en la zona indicada para continuar'}
          </p>
        </div>
        <div className="flex justify-center">
          {/* Contenedor de imagen responsive */}
          <div className="relative w-full sm:max-w-5xl mx-auto bg-white sm:rounded-lg sm:shadow-2xl sm:overflow-hidden">
            <img
              ref={imgRef}
              src={selectedImage.url}
              alt={selectedImage.name || 'Imagen detallada'}
              className="w-full h-auto max-h-[70vh] sm:max-h-[80vh] object-contain bg-white"
              loading="lazy"
              onLoad={handleImgLoad}
            />
            {imgSize && imgNatural && availableHitzones
              .filter(hitzone => hitzone !== null) // Filtrar hitzones null
              .map((hitzone) => {
              const { drawWidth, drawHeight, offsetX, offsetY } = getImageDrawRect(
                imgNatural,
                imgSize
              );
              const scaleX = drawWidth / imgNatural.width;
              const scaleY = drawHeight / imgNatural.height;
              const left = hitzone.x * scaleX + offsetX;
              const top = hitzone.y * scaleY + offsetY;
              const width = hitzone.width * scaleX;
              const height = hitzone.height * scaleY;
              return (
                <div
                  key={hitzone.id}
                  className={`absolute cursor-pointer transition-all duration-300 transform hover:scale-105 ${
                    selectedHitzone === hitzone.id
                      ? 'bg-green-500 bg-opacity-50 border-3 border-green-600 shadow-lg'
                      : 'bg-blue-500 bg-opacity-30 border-2 border-blue-400 hover:bg-opacity-40 hover:border-blue-500'
                  }`}
                  style={{
                    left: `${left}px`,
                    top: `${top}px`,
                    width: `${Math.max(width, 44)}px`, // Área mínima de toque de 44px
                    height: `${Math.max(height, 44)}px`, // Área mínima de toque de 44px
                    minWidth: '44px',
                    minHeight: '44px',
                  }}
                  onClick={() => {
                    setSelectedHitzone(hitzone.id);
                    setShowSuccessModal(true);
                  }}
                  title={`Zona interactiva: ${hitzone.id}`}
                />
              );
            })}
          </div>
        </div>
      </div>
      {showSuccessModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40 p-4">
          <div className="bg-white rounded-lg shadow-lg p-6 max-w-sm w-full mx-4 flex flex-col items-center">
            <div className="text-4xl mb-4">✅</div>
            <h2 className="text-lg font-bold mb-4 text-green-700 text-center">
              ¡Área correctamente identificada!
            </h2>
            {currentImageIndex < images.length - 1 ? (
              <button
                className="mt-4 px-8 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-lg font-medium w-full"
                onClick={() => {
                  setShowSuccessModal(false);
                  setCurrentImageIndex(currentImageIndex + 1);
                  setSelectedHitzone(null);
                }}
              >
                Siguiente imagen
              </button>
            ) : (
              <button
                className="mt-4 px-8 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 text-lg font-medium w-full"
                onClick={() => {
                  setShowSuccessModal(false);
                  if (onContinue) { // 5. Llamada segura a la función de callback
                    onContinue();
                  }
                }}
              >
                Finalizar
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default CognitiveNavigationFlowStep;
