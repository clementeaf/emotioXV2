import React, { useEffect, useRef, useState } from 'react';
import { useFormDataStore } from '../../stores/useFormDataStore';
import { useStepStore } from '../../stores/useStepStore';

// 🎯 INTERFAZ PARA RESPUESTAS DEL BACKEND
interface BackendResponse {
  questionKey: string;
  response: {
    selectedHitzone?: string;
    selectedImageIndex?: number;
    imageSelections?: Record<string, unknown>;
    clickPosition?: {
      x: number;
      y: number;
      hitzoneWidth: number;
      hitzoneHeight: number;
    };
    [key: string]: unknown;
  };
}

interface ClickPosition {
  x: number;
  y: number;
  hitzoneWidth: number;
  hitzoneHeight: number;
}

// 🎯 NUEVA INTERFACE PARA RASTREO COMPLETO DE CLICS
interface ClickTrackingData {
  x: number;
  y: number;
  timestamp: number;
  hitzoneId?: string; // undefined si el clic fue fuera de hitzone
  imageIndex: number;
  isCorrectHitzone: boolean;
}

// 🎯 NUEVA INTERFACE PARA PUNTOS VISUALES
interface VisualClickPoint {
  x: number;
  y: number;
  timestamp: number;
  isCorrect: boolean;
}

interface HitZone {
  id: string;
  region: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
}

interface ConvertedHitZone {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  originalCoords?: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
}

interface ImageFile {
  id: string;
  name: string;
  url: string;
  hitZones?: HitZone[];
}

interface NavigationQuestion {
  id: string | number;
  type: string;
  title: string;
  description: string;
  files: ImageFile[];
}

interface NavigationFlowTaskProps {
  stepConfig: NavigationQuestion;
  formData?: Record<string, unknown>;
  currentQuestionKey?: string;
}

const convertHitZonesToPercentageCoordinates = (
  hitZones: HitZone[] | undefined,
  imageNaturalSize?: { width: number; height: number }
): ConvertedHitZone[] => {
  if (!hitZones || !Array.isArray(hitZones) || hitZones.length === 0) {
    return [];
  }

  return hitZones.map(zone => {
    const region = zone.region;
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

export const NavigationFlowTask: React.FC<NavigationFlowTaskProps> = ({ stepConfig, formData, currentQuestionKey }) => {
  const navigationQuestion = stepConfig;
  const id = String(navigationQuestion.id || '').trim();
  const type = String(navigationQuestion.type || 'cognitive_navigation_flow').trim();
  const title = navigationQuestion.title || 'Flujo de Navegación';
  const description = navigationQuestion.description || '¿En cuál de las siguientes pantallas encuentras el objetivo indicado?';
  const imageFiles: ImageFile[] = navigationQuestion.files || [];

  const [localSelectedImageIndex, setLocalSelectedImageIndex] = useState<number>(0);
  const [localSelectedHitzone, setLocalSelectedHitzone] = useState<string | null>(null);
  const [imageNaturalSize, setImageNaturalSize] = useState<{ width: number; height: number } | null>(null);
  const [imgRenderSize, setImgRenderSize] = useState<{ width: number; height: number } | null>(null);
  const [imageSelections, setImageSelections] = useState<Record<string, { hitzoneId: string, click: ClickPosition }>>({});
  // 🎯 NUEVO ESTADO PARA RASTREO COMPLETO DE CLICS
  const [allClicksTracking, setAllClicksTracking] = useState<ClickTrackingData[]>([]);
  // 🎯 NUEVO ESTADO PARA PUNTOS VISUALES ROJOS
  const [visualClickPoints, setVisualClickPoints] = useState<VisualClickPoint[]>([]);
  const imageRef = useRef<HTMLImageElement>(null);

  const images: ImageFile[] = imageFiles;

  // 🎯 CARGAR RESPUESTAS DEL BACKEND SI EXISTEN
  useEffect(() => {
    if (currentQuestionKey) {
      // Buscar respuesta del backend para este step
      const store = useStepStore.getState();
      const backendResponse = store.backendResponses.find(
        (r: BackendResponse) => r.questionKey === currentQuestionKey
      );

      if (backendResponse?.response) {
        const responseData = backendResponse.response;

        if (responseData.selectedImageIndex !== undefined) {
          setLocalSelectedImageIndex(responseData.selectedImageIndex);
        }
        if (responseData.selectedHitzone) {
          setLocalSelectedHitzone(responseData.selectedHitzone);
        }
        if (responseData.imageSelections) {
          setImageSelections(responseData.imageSelections as Record<string, { hitzoneId: string, click: ClickPosition }>);
        }
      }
    }
  }, [currentQuestionKey]);

  // 🎯 ENVIAR TODOS LOS CLICS AL BACKEND CUANDO SE COMPLETE EL STEP
  useEffect(() => {
    if (currentQuestionKey && allClicksTracking.length > 0) {
      // Enviar todos los clics al backend para análisis
      const { setFormData } = useFormDataStore.getState();
      setFormData(currentQuestionKey, {
        ...useFormDataStore.getState().formData[currentQuestionKey],
        allClicksTracking: allClicksTracking
      });
    }
  }, [allClicksTracking, currentQuestionKey]);

  const handleHitzoneClick = (hitzoneId: string, clickPos?: ClickPosition): void => {
    if (clickPos && typeof clickPos.hitzoneWidth === 'number' && typeof clickPos.hitzoneHeight === 'number') {
      setImageSelections(prev => ({
        ...prev,
        [localSelectedImageIndex.toString()]: { hitzoneId, click: clickPos }
      }));

      // 🎯 GUARDAR EN FORMDATA CON TODOS LOS CLICS
      if (currentQuestionKey) {
        const { setFormData } = useFormDataStore.getState();
        setFormData(currentQuestionKey, {
          selectedImageIndex: localSelectedImageIndex,
          selectedHitzone: hitzoneId,
          clickPosition: clickPos,
          imageSelections: {
            ...imageSelections,
            [localSelectedImageIndex.toString()]: { hitzoneId, click: clickPos }
          },
          // 🎯 AGREGAR RASTREO COMPLETO DE CLICS
          allClicksTracking: allClicksTracking
        });
      }

      // 🎯 AVANCE AUTOMÁTICO A LA SIGUIENTE IMAGEN
      if (localSelectedImageIndex < images.length - 1) {
        // Pequeño delay para que el usuario vea el feedback visual
        setTimeout(() => {
          setLocalSelectedImageIndex(localSelectedImageIndex + 1);
          setLocalSelectedHitzone(null);
          // 🎯 LIMPIAR PUNTOS VISUALES AL CAMBIAR DE IMAGEN
          setVisualClickPoints([]);
        }, 500);
      }
    }
  };

  // 🎯 NUEVA FUNCIÓN PARA RASTREAR TODOS LOS CLICS
  const handleImageClick = (e: React.MouseEvent<HTMLImageElement>): void => {
    if (!imageRef.current || !imageNaturalSize) return;

    const imgRect = imageRef.current.getBoundingClientRect();
    const clickX = e.clientX - imgRect.left;
    const clickY = e.clientY - imgRect.top;
    const timestamp = Date.now();

    // 🎯 VERIFICAR SI EL CLIC ESTÁ DENTRO DE ALGÚN HITZONE
    let hitzoneId: string | undefined;
    let isCorrectHitzone = false;

    if (availableHitzones.length > 0) {
      for (const hitzone of availableHitzones) {
        const { drawWidth, drawHeight, offsetX, offsetY } = getImageDrawRect(imageNaturalSize, imgRenderSize!);
        const left = offsetX + (hitzone.originalCoords?.x ?? 0) * (drawWidth / imageNaturalSize.width);
        const top = offsetY + (hitzone.originalCoords?.y ?? 0) * (drawHeight / imageNaturalSize.height);
        const width = (hitzone.originalCoords?.width ?? 0) * (drawWidth / imageNaturalSize.width);
        const height = (hitzone.originalCoords?.height ?? 0) * (drawHeight / imageNaturalSize.height);

        if (clickX >= left && clickX <= left + width && clickY >= top && clickY <= top + height) {
          hitzoneId = hitzone.id;
          isCorrectHitzone = true;
          break;
        }
      }
    }

    // 🎯 REGISTRAR EL CLIC
    const clickData: ClickTrackingData = {
      x: clickX,
      y: clickY,
      timestamp,
      hitzoneId,
      imageIndex: localSelectedImageIndex,
      isCorrectHitzone
    };

    setAllClicksTracking(prev => [...prev, clickData]);

    // 🎯 AGREGAR PUNTO VISUAL ROJO
    const visualPoint: VisualClickPoint = {
      x: clickX,
      y: clickY,
      timestamp,
      isCorrect: isCorrectHitzone
    };

    setVisualClickPoints(prev => [...prev, visualPoint]);

    // 🎯 ENVIAR AL BACKEND SI ES UN CLIC EN HITZONE
    if (isCorrectHitzone && hitzoneId) {
      const { drawWidth, drawHeight, offsetX, offsetY } = getImageDrawRect(imageNaturalSize, imgRenderSize!);
      const relX = clickX - (offsetX + (availableHitzones.find(h => h.id === hitzoneId)?.originalCoords?.x ?? 0) * (drawWidth / imageNaturalSize.width));
      const relY = clickY - (offsetY + (availableHitzones.find(h => h.id === hitzoneId)?.originalCoords?.y ?? 0) * (drawHeight / imageNaturalSize.height));
      const width = (availableHitzones.find(h => h.id === hitzoneId)?.originalCoords?.width ?? 0) * (drawWidth / imageNaturalSize.width);
      const height = (availableHitzones.find(h => h.id === hitzoneId)?.originalCoords?.height ?? 0) * (drawHeight / imageNaturalSize.height);

      handleHitzoneClick(hitzoneId, { x: relX, y: relY, hitzoneWidth: width, hitzoneHeight: height });
    }
  };

  const handleImageLoad = (e: React.SyntheticEvent<HTMLImageElement>): void => {
    const { naturalWidth, naturalHeight, width, height } = e.currentTarget;
    setImageNaturalSize({ width: naturalWidth, height: naturalHeight });
    setImgRenderSize({ width, height });
  };

  const handlePrevImage = (): void => {
    if (localSelectedImageIndex > 0) {
      setLocalSelectedImageIndex(localSelectedImageIndex - 1);
      setLocalSelectedHitzone(null);
      // 🎯 LIMPIAR PUNTOS VISUALES AL CAMBIAR DE IMAGEN
      setVisualClickPoints([]);
    }
  };

  const handleNextImage = (): void => {
    // 🎯 VERIFICAR SI SE HA HECHO CLIC EN AL MENOS UN HITZONE DE LA IMAGEN ACTUAL
    const currentImageSelection = imageSelections[localSelectedImageIndex.toString()];
    const hasClickedHitzone = currentImageSelection && currentImageSelection.hitzoneId;

    if (localSelectedImageIndex < images.length - 1 && hasClickedHitzone) {
      setLocalSelectedImageIndex(localSelectedImageIndex + 1);
      setLocalSelectedHitzone(null);
      // 🎯 LIMPIAR PUNTOS VISUALES AL CAMBIAR DE IMAGEN
      setVisualClickPoints([]);
    }
  };

  const selectedImage: ImageFile = images[localSelectedImageIndex];
  const availableHitzones: ConvertedHitZone[] = selectedImage?.hitZones
    ? convertHitZonesToPercentageCoordinates(selectedImage.hitZones, imageNaturalSize || undefined)
    : [];

  function getImageDrawRect(
    imgNatural: { width: number, height: number },
    imgRender: { width: number, height: number }
  ): { drawWidth: number; drawHeight: number; offsetX: number; offsetY: number } {
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
              disabled={localSelectedImageIndex === images.length - 1 || !imageSelections[localSelectedImageIndex.toString()]}
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
            onClick={handleImageClick}
          />
          {imageNaturalSize && imgRenderSize && (
            (() => {
              const { drawWidth, drawHeight, offsetX, offsetY } = getImageDrawRect(imageNaturalSize, imgRenderSize);
              return (
                <div
                  className="absolute top-0 left-0"
                  style={{ width: imgRenderSize.width, height: imgRenderSize.height, pointerEvents: 'none' }}
                >
                  {availableHitzones.map((hitzone: ConvertedHitZone) => {
                    const left = offsetX + (hitzone.originalCoords?.x ?? 0) * (drawWidth / imageNaturalSize.width);
                    const top = offsetY + (hitzone.originalCoords?.y ?? 0) * (drawHeight / imageNaturalSize.height);
                    const width = (hitzone.originalCoords?.width ?? 0) * (drawWidth / imageNaturalSize.width);
                    const height = (hitzone.originalCoords?.height ?? 0) * (drawHeight / imageNaturalSize.height);
                    return (
                      <div
                        key={hitzone.id}
                        className="absolute transition-all duration-300"
                        style={{
                          left,
                          top,
                          width,
                          height,
                          pointerEvents: 'auto',
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
                        {/* 🎯 PUNTOS ROJOS ELIMINADOS - SIN FEEDBACK VISUAL */}
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

                  {/* 🎯 PUNTOS VISUALES ROJOS */}
                  {visualClickPoints.map((point, index) => (
                    <div
                      key={`${point.timestamp}-${index}`}
                      className="absolute w-3 h-3 bg-red-500 rounded-full border-2 border-white shadow-lg pointer-events-none"
                      style={{
                        left: point.x - 6,
                        top: point.y - 6,
                        zIndex: 10
                      }}
                      title={`Clic ${point.isCorrect ? 'correcto' : 'incorrecto'} - ${new Date(point.timestamp).toLocaleTimeString()}`}
                    />
                  ))}
                </div>
              );
            })()
          )}
        </div>
      </div>
    </div>
  );
};

export default NavigationFlowTask;
