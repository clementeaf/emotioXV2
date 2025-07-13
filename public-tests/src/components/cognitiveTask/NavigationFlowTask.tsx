import React, { useEffect, useRef, useState } from 'react';
import { useStepResponseManager } from '../../hooks/useStepResponseManager';
import { MappedStepComponentProps } from '../../types/flow.types';
import FormSubmitButton from '../common/FormSubmitButton';

type ClickPosition = { x: number; y: number; hitzoneWidth: number; hitzoneHeight: number };

const convertHitZonesToPercentageCoordinates = (hitZones: any[], imageNaturalSize?: { width: number; height: number }) => {
  if (!hitZones || !Array.isArray(hitZones) || hitZones.length === 0) {
    return [];
  }

  return hitZones.map(zone => {
    const region = zone.region || zone;
    const x = region.x || 0;
    const y = region.y || 0;
    const width = region.width || 0;
    const height = region.height || 0;

    if (imageNaturalSize && imageNaturalSize.width > 0 && imageNaturalSize.height > 0) {
      return {
        id: zone.id,
        x: (x / imageNaturalSize.width) * 100,
        y: (y / imageNaturalSize.height) * 100,
        width: (width / imageNaturalSize.width) * 100,
        height: (height / imageNaturalSize.height) * 100,
        originalCoords: { x, y, width, height }
      };
    }

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

  const [localSelectedImageIndex, setLocalSelectedImageIndex] = useState<number>(0);
  const [localSelectedHitzone, setLocalSelectedHitzone] = useState<string | null>(null);
  const [localError, setLocalError] = useState<string | null>(null);
  const [imageNaturalSize, setImageNaturalSize] = useState<{ width: number; height: number } | null>(null);
  const [lastClickPosition, setLastClickPosition] = useState<ClickPosition | null>(null);
  const [showClickModal, setShowClickModal] = useState(false);
  const imageRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    if (responseData) {
      setLocalSelectedImageIndex(responseData.selectedImage || 0);
      setLocalSelectedHitzone(responseData.selectedHitzone || null);
    }
  }, [responseData]);

  const images = imageFiles;

  const handleHitzoneClick = (hitzoneId: string, clickPos?: ClickPosition) => {
    setLocalSelectedHitzone(hitzoneId);
    setLocalError(null);
    if (clickPos && typeof clickPos.hitzoneWidth === 'number' && typeof clickPos.hitzoneHeight === 'number') {
      setLastClickPosition(clickPos);
      setShowClickModal(true);
    }
  };

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
      selectedHitzone: {
        id: localSelectedHitzone,
        click: lastClickPosition
      },
      timestamp: Date.now()
    };

    const result = await saveCurrentStepResponse(responseData);
    if (result.success && onStepComplete) {
      onStepComplete(responseData);
    }
  };

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
    <div className="flex flex-col bg-white p-6">
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
          {imageNaturalSize && imgRenderSize && (
            (() => {
              const { drawWidth, drawHeight, offsetX, offsetY } = getImageDrawRect(imageNaturalSize, imgRenderSize);
              return (
                <div
                  className="absolute top-0 left-0"
                  style={{ width: imgRenderSize.width, height: imgRenderSize.height, pointerEvents: 'none' }}
                >
                  {availableHitzones.map((hitzone: any) => {
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
                        onClick={e => {
                          e.stopPropagation();
                          // 1. Posición del click respecto a la imagen
                          const imgRect = imageRef.current?.getBoundingClientRect();
                          const clickX = e.clientX - (imgRect?.left ?? 0);
                          const clickY = e.clientY - (imgRect?.top ?? 0);
                          // 2. Posición del hitzone dentro de la imagen renderizada
                          const left = offsetX + (hitzone.originalCoords?.x ?? 0) * (drawWidth / imageNaturalSize.width);
                          const top = offsetY + (hitzone.originalCoords?.y ?? 0) * (drawHeight / imageNaturalSize.height);
                          const width = (hitzone.originalCoords?.width ?? 0) * (drawWidth / imageNaturalSize.width);
                          const height = (hitzone.originalCoords?.height ?? 0) * (drawHeight / imageNaturalSize.height);
                          // 3. Posición relativa al hitzone (en píxeles dentro del hitzone renderizado)
                          const relX = clickX - left;
                          const relY = clickY - top;
                          handleHitzoneClick(hitzone.id, { x: relX, y: relY, hitzoneWidth: width, hitzoneHeight: height });
                        }}
                        title={`Zona interactiva: ${hitzone.id}`}
                      >
                        {localSelectedHitzone === hitzone.id && lastClickPosition && (
                          (() => {
                            // Mostrar el punto rojo en la posición exacta dentro del hitzone
                            const px = (lastClickPosition.x / (lastClickPosition.hitzoneWidth || 1)) * width;
                            const py = (lastClickPosition.y / (lastClickPosition.hitzoneHeight || 1)) * height;
                            return (
                              <div className="absolute left-0 top-0 w-full h-full pointer-events-none">
                                <div
                                  className="absolute bg-red-600 rounded-full border-2 border-white shadow"
                                  style={{
                                    left: `calc(${px}px - 6px)`,
                                    top: `calc(${py}px - 6px)`,
                                    width: 12,
                                    height: 12
                                  }}
                                  title="Punto de click"
                                />
                              </div>
                            );
                          })()
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

        {(localError || error) && (
          <div className="text-red-600 text-sm mt-2 text-center bg-red-50 p-3 rounded-lg">
            {localError || error}
          </div>
        )}

        <div className="flex justify-center mt-6">
          <FormSubmitButton
            isSaving={!!isSaving || !!isLoading}
            hasExistingData={!!hasExistingData}
            onClick={handleSubmit}
            disabled={isSaving || isLoading || !localSelectedHitzone}
          />
        </div>

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
