import React, { useEffect, useRef, useState } from 'react';
import { useStepResponseManager } from '../../hooks/useStepResponseManager';
import { MappedStepComponentProps } from '../../types/flow.types';
import FormSubmitButton from '../common/FormSubmitButton';

// Función mejorada para convertir hitZones de pixeles a porcentaje
const convertHitZonesToPercentageCoordinates = (hitZones: any[], imageNaturalSize?: { width: number; height: number }) => {
  if (!hitZones || !Array.isArray(hitZones) || hitZones.length === 0) {
    return [];
  }

  return hitZones.map(zone => {
    // Extraer coordenadas del formato del backend
    const region = zone.region || zone;
    const x = region.x || 0;
    const y = region.y || 0;
    const width = region.width || 0;
    const height = region.height || 0;

    // Si tenemos el tamaño natural de la imagen, convertir a porcentaje
    if (imageNaturalSize && imageNaturalSize.width > 0 && imageNaturalSize.height > 0) {
      return {
        id: zone.id,
        x: (x / imageNaturalSize.width) * 100,
        y: (y / imageNaturalSize.height) * 100,
        width: (width / imageNaturalSize.width) * 100,
        height: (height / imageNaturalSize.height) * 100,
        // Mantener coordenadas originales para debug si es necesario
        originalCoords: { x, y, width, height }
      };
    }

    // Si no tenemos el tamaño natural, asumir que ya están en porcentaje
    return {
      id: zone.id,
      x,
      y,
      width,
      height
    };
  });
};

export const NavigationFlowTask: React.FC<MappedStepComponentProps> = (props) => {
  const { stepConfig, onStepComplete, savedResponse, questionKey } = props;
  const navigationQuestion =
    stepConfig?.questions && Array.isArray(stepConfig.questions) && stepConfig.questions.length > 0
      ? stepConfig.questions[0]
      : stepConfig;

  const id = questionKey || navigationQuestion.id || '';
  const title = navigationQuestion.title || 'Flujo de Navegación';
  const description = navigationQuestion.description || '¿En cuál de las siguientes pantallas encuentras el objetivo indicado?';
  const imageFiles = navigationQuestion.files || [];

  const {
    responseData,
    isSaving,
    isLoading,
    error,
    saveCurrentStepResponse,
    hasExistingData
  } = useStepResponseManager<any>({
    stepId: id,
    stepType: navigationQuestion.type === 'cognitive_navigation_flow' || navigationQuestion.type === 'navigation_flow' ? navigationQuestion.type : 'cognitive_navigation_flow',
    stepName: title,
    initialData: savedResponse,
    questionKey: id
  });

  const [localSelectedImageIndex, setLocalSelectedImageIndex] = useState<number>(0); // Por defecto mostrar la primera imagen
  const [localSelectedHitzone, setLocalSelectedHitzone] = useState<string | null>(null);
  const [localError, setLocalError] = useState<string | null>(null);
  const [imageNaturalSize, setImageNaturalSize] = useState<{ width: number; height: number } | null>(null);
  const imageRef = useRef<HTMLImageElement>(null);

  // Sincronizar valor local con respuesta persistida
  useEffect(() => {
    if (responseData) {
      setLocalSelectedImageIndex(responseData.selectedImage || 0);
      setLocalSelectedHitzone(responseData.selectedHitzone || null);
    }
  }, [responseData]);

  const images = imageFiles;

  const handleImageClick = (imageIndex: number) => {
    setLocalSelectedImageIndex(imageIndex);
    setLocalSelectedHitzone(null);
    setLocalError(null);
  };

  const handleHitzoneClick = (hitzoneId: string) => {
    setLocalSelectedHitzone(hitzoneId);
    setLocalError(null);
  };

  // Elimina containerRef y containerSize, usa el tamaño real de la imagen renderizada
  const [imgRenderSize, setImgRenderSize] = useState<{ width: number; height: number } | null>(null);

  const handleImageLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const { naturalWidth, naturalHeight, width, height } = e.currentTarget;
    setImageNaturalSize({ width: naturalWidth, height: naturalHeight });
    setImgRenderSize({ width, height });
  };

  const handleSubmit = async () => {
    if (!localSelectedHitzone) {
      setLocalError('Por favor, selecciona una zona interactiva.');
      return;
    }

    const responseData = {
      type: 'navigation_flow',
      selectedImage: localSelectedImageIndex,
      selectedHitzone: localSelectedHitzone,
      timestamp: Date.now()
    };

    const result = await saveCurrentStepResponse(responseData);
    if (result.success && onStepComplete) {
      onStepComplete(responseData);
    }
  };

  // Navegación entre imágenes
  const handlePrevImage = () => {
    if (localSelectedImageIndex > 0) {
      setLocalSelectedImageIndex(localSelectedImageIndex - 1);
      setLocalSelectedHitzone(null);
      setLocalError(null);
    }
  };
  const handleNextImage = () => {
    if (localSelectedImageIndex < images.length - 1) {
      setLocalSelectedImageIndex(localSelectedImageIndex + 1);
      setLocalSelectedHitzone(null);
      setLocalError(null);
    }
  };

  const selectedImage = images[localSelectedImageIndex];
  const availableHitzones = selectedImage?.hitZones
    ? convertHitZonesToPercentageCoordinates(selectedImage.hitZones, imageNaturalSize || undefined)
    : [];

  // Cálculo de aspect ratio y centrado igual que el editor de hitzones
  function getImageDrawRect(imgNatural: {width: number, height: number}, imgRender: {width: number, height: number}) {
    const imgRatio = imgNatural.width / imgNatural.height;
    const renderRatio = imgRender.width / imgRender.height;
    let drawWidth = imgRender.width;
    let drawHeight = imgRender.height;
    let offsetX = 0;
    let offsetY = 0;
    if (imgRatio > renderRatio) {
      drawWidth = imgRender.width;
      drawHeight = imgRender.width / imgRatio;
      offsetY = (imgRender.height - drawHeight) / 2;
    } else {
      drawHeight = imgRender.height;
      drawWidth = imgRender.height * imgRatio;
      offsetX = (imgRender.width - drawWidth) / 2;
    }
    return { drawWidth, drawHeight, offsetX, offsetY };
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-white p-6">
      <div className="w-full flex flex-col items-center">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-gray-800 mb-4">
            {title}
          </h1>
          <p className="text-gray-600 mb-2">
            {description}
          </p>
          <p className="text-sm text-gray-500 italic">
            Haz clic en una zona interactiva para seleccionarla
          </p>
        </div>

        {/* Controles de navegación de imágenes */}
        {images.length > 1 && (
          <div className="flex justify-center items-center gap-4 mb-4">
            <button
              className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300 disabled:opacity-50"
              onClick={handlePrevImage}
              disabled={localSelectedImageIndex === 0}
            >
              Anterior
            </button>
            <span className="text-sm text-gray-600">
              Imagen {localSelectedImageIndex + 1} de {images.length}
            </span>
            <button
              className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300 disabled:opacity-50"
              onClick={handleNextImage}
              disabled={localSelectedImageIndex === images.length - 1}
            >
              Siguiente
            </button>
          </div>
        )}

        {/* Imagen principal con overlay de hitzones */}
        <div
          className="relative w-[80vw] max-w-4xl max-h-[80vh] bg-white rounded-lg shadow-lg overflow-hidden"
          style={{ aspectRatio: imageNaturalSize ? `${imageNaturalSize.width} / ${imageNaturalSize.height}` : undefined }}
        >
          <img
            ref={imageRef}
            src={selectedImage.url}
            alt={selectedImage.name || `Imagen detallada ${localSelectedImageIndex + 1}`}
            className="w-full h-auto max-h-[80vh] object-contain bg-white"
            loading="lazy"
            style={{ display: 'block' }}
            onLoad={handleImageLoad}
          />
          {/* Overlay de hitzones con escalado absoluto usando el tamaño real de la imagen */}
          {imageNaturalSize && imgRenderSize && (
            (() => {
              const { drawWidth, drawHeight, offsetX, offsetY } = getImageDrawRect(imageNaturalSize, imgRenderSize);
              return (
                <div
                  className="absolute top-0 left-0"
                  style={{ width: imgRenderSize.width, height: imgRenderSize.height, pointerEvents: 'none' }}
                >
                  {availableHitzones.map((hitzone: any) => {
                    // Convertir coords naturales a coords absolutas escaladas
                    const left = offsetX + (hitzone.originalCoords?.x ?? 0) * (drawWidth / imageNaturalSize.width);
                    const top = offsetY + (hitzone.originalCoords?.y ?? 0) * (drawHeight / imageNaturalSize.height);
                    const width = (hitzone.originalCoords?.width ?? 0) * (drawWidth / imageNaturalSize.width);
                    const height = (hitzone.originalCoords?.height ?? 0) * (drawHeight / imageNaturalSize.height);
                    return (
                      <div
                        key={hitzone.id}
                        className={`absolute transition-all duration-300 border-2 ${
                          localSelectedHitzone === hitzone.id
                            ? 'border-green-600 bg-green-500 bg-opacity-20 shadow-lg'
                            : 'border-blue-400 bg-blue-500 bg-opacity-10 hover:bg-blue-500 hover:bg-opacity-20'
                        }`}
                        style={{
                          left,
                          top,
                          width,
                          height,
                          pointerEvents: 'auto',
                          cursor: 'pointer',
                        }}
                        onClick={() => handleHitzoneClick(hitzone.id)}
                        title={`Zona interactiva: ${hitzone.id}`}
                      >
                        {localSelectedHitzone === hitzone.id && (
                          <div className="absolute inset-0 flex items-center justify-center">
                            <div className="bg-green-600 text-white text-xs px-2 py-1 rounded-full font-medium">
                              ✓ Seleccionado
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                  {availableHitzones.length === 0 && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50">
                      <div className="bg-white rounded-lg p-4 text-center">
                        <p className="text-gray-600">Esta imagen no tiene zonas interactivas configuradas.</p>
                      </div>
                    </div>
                  )}
                </div>
              );
            })()
          )}
        </div>

        {/* Error display */}
        {(localError || error) && (
          <div className="text-red-600 text-sm mt-2 text-center bg-red-50 p-3 rounded-lg">
            {localError || error}
          </div>
        )}

        {/* FormSubmitButton para feedback visual consistente */}
        <div className="flex justify-center mt-6">
          <FormSubmitButton
            isSaving={!!isSaving || !!isLoading}
            hasExistingData={!!hasExistingData}
            onClick={handleSubmit}
            disabled={isSaving || isLoading || !localSelectedHitzone}
          />
        </div>

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

export default NavigationFlowTask;
