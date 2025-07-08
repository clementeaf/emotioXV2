import React, { useEffect, useRef, useState } from 'react';
import { MappedStepComponentProps } from '../../types/flow.types';

interface PreferenceFile {
  id: string;
  name: string;
  url: string;
  type: string;
  size: number;
}

interface PreferenceTestTaskProps extends MappedStepComponentProps {
  responsesData?: any[];
}

const PreferenceTestTask: React.FC<PreferenceTestTaskProps> = ({ stepConfig, onStepComplete, savedResponse, responsesData }) => {
  const [selectedImageId, setSelectedImageId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [hasBeenSaved, setHasBeenSaved] = useState<boolean>(false);
  // Estado para zoom modal
  const [zoomImage, setZoomImage] = useState<PreferenceFile | null>(null);
  const [zoom, setZoom] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [dragging, setDragging] = useState(false);
  const [dragStart, setDragStart] = useState<{ x: number; y: number } | null>(null);
  const imgContainerRef = useRef<HTMLDivElement>(null);

  // Extraer la configuración de la pregunta - MEJORADO para compatibilidad
  let preferenceQuestion: any = null;

  if (stepConfig && typeof stepConfig === 'object') {
    if ('questions' in stepConfig && Array.isArray((stepConfig as any).questions)) {
      const config = stepConfig as { questions: any[] };
      preferenceQuestion = config.questions.find(q => q.type === 'preference_test');
    }
    else if ('type' in stepConfig && (stepConfig as any).type === 'preference_test') {
      preferenceQuestion = stepConfig;
    }
    else if ('config' in stepConfig) {
      preferenceQuestion = (stepConfig as any).config;
    }
  }

  const config = preferenceQuestion || stepConfig;
  const images = config?.files || [];

  // Buscar respuesta previa en responsesData si existe
  const preferenceSavedResponse = React.useMemo(() => {
    if (!responsesData || !Array.isArray(responsesData)) return null;
    return responsesData.find(
      r =>
        (r.stepType === 'cognitive_preference_test' || r.type === 'cognitive_preference_test') &&
        (r.stepTitle === 'Preferencia' || r.name === 'Preferencia') &&
        r.response
    );
  }, [responsesData]);

  React.useEffect(() => {
    // Prioridad: savedResponse (prop directa), luego responsesData
    const responseToUse = savedResponse || preferenceSavedResponse?.response;
    let extractedImageId: string | null = null;
    if (typeof responseToUse === 'object' && responseToUse && 'selectedImageId' in responseToUse) {
      extractedImageId = (responseToUse as { selectedImageId: string }).selectedImageId;
    }
    if (extractedImageId && images.some((img: any) => img.id === extractedImageId)) {
      setSelectedImageId(extractedImageId);
      setHasBeenSaved(true);
    }
  }, [savedResponse, preferenceSavedResponse, images]);

  // Reset zoom y pan al cambiar de imagen
  useEffect(() => {
    setZoom(1);
    setOffset({ x: 0, y: 0 });
    setDragging(false);
    setDragStart(null);
  }, [zoomImage]);

  const handleImageSelect = (imageId: string) => {
    setSelectedImageId(imageId);
    setError(null);
  };

  const handleContinue = () => {
    if (!selectedImageId) {
      setError('Por favor, selecciona una opción antes de continuar');
      return;
    }

    const selectedImage = images.find((img: any) => img.id === selectedImageId);
    const responseData = {
      questionId: config.id,
      selectedImageId,
      selectedImageName: selectedImage?.name,
      type: 'preference_test'
    };

    setHasBeenSaved(true);
    onStepComplete?.(responseData);
  };

  // Función para navegar entre imágenes en el modal
  const handleZoomNav = (direction: 'prev' | 'next') => {
    if (!zoomImage) return;
    const currentIdx = images.findIndex((img: any) => img.id === zoomImage.id);
    if (direction === 'prev' && currentIdx > 0) {
      setZoomImage(images[currentIdx - 1]);
    } else if (direction === 'next' && currentIdx < images.length - 1) {
      setZoomImage(images[currentIdx + 1]);
    }
  };

  // Zoom con scroll
  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    let newZoom = zoom + (e.deltaY < 0 ? 0.15 : -0.15);
    newZoom = Math.max(1, Math.min(newZoom, 5));
    setZoom(newZoom);
  };

  // Pan con drag
  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    setDragging(true);
    setDragStart({ x: e.clientX - offset.x, y: e.clientY - offset.y });
  };
  const handleMouseMove = (e: React.MouseEvent) => {
    if (!dragging || !dragStart) return;
    setOffset({ x: e.clientX - dragStart.x, y: e.clientY - dragStart.y });
  };
  const handleMouseUp = () => {
    setDragging(false);
    setDragStart(null);
  };

  // Touch events para mobile (pinch y pan)
  const lastTouch = useRef<{ x: number; y: number; dist?: number } | null>(null);
  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      lastTouch.current = { x: e.touches[0].clientX - offset.x, y: e.touches[0].clientY - offset.y };
    } else if (e.touches.length === 2) {
      const dist = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      );
      lastTouch.current = { x: 0, y: 0, dist };
    }
  };
  const handleTouchMove = (e: React.TouchEvent) => {
    if (!lastTouch.current) return;
    if (e.touches.length === 1 && lastTouch.current.dist === undefined) {
      setOffset({ x: e.touches[0].clientX - lastTouch.current.x, y: e.touches[0].clientY - lastTouch.current.y });
    } else if (e.touches.length === 2 && lastTouch.current.dist !== undefined) {
      const newDist = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      );
      let newZoom = zoom * (newDist / (lastTouch.current.dist || 1));
      newZoom = Math.max(1, Math.min(newZoom, 5));
      setZoom(newZoom);
      lastTouch.current.dist = newDist;
    }
  };
  const handleTouchEnd = () => {
    lastTouch.current = null;
  };

  if (!images || images.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white p-8 rounded-lg shadow-md max-w-lg text-center">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Error de Configuración</h2>
          <p className="text-gray-600">No se encontraron imágenes para esta pregunta de preferencia.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-2xl md:text-3xl font-bold text-gray-800 mb-4">
            {config?.title || 'Pregunta de Preferencia'}
          </h1>
          {config?.description && (
            <p className="text-lg text-gray-600 max-w-3xl mx-auto">
              {config.description}
            </p>
          )}
        </div>

        {/* Images Grid */}
        <div className="flex flex-row gap-4 justify-center mb-8">
          {images.map((image: any, index: number) => (
            <div
              key={image.id}
              className={`relative rounded-lg shadow-lg overflow-hidden cursor-pointer transition-all duration-300 transform hover:scale-[1.02] ${
                selectedImageId === image.id
                  ? 'ring-4 ring-blue-500 shadow-2xl scale-[1.02]'
                  : 'hover:shadow-xl'
              }`}
              onClick={() => handleImageSelect(image.id)}
            >
              {/* Botón de zoom (lupa) */}
              <button
                type="button"
                className="absolute top-3 right-3 z-20 bg-white bg-opacity-80 rounded-full p-2 shadow hover:bg-opacity-100 focus:outline-none"
                style={{ border: 'none' }}
                onClick={e => { e.stopPropagation(); setZoomImage(image); }}
                title="Ver grande"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <circle cx="11" cy="11" r="7" />
                  <line x1="21" y1="21" x2="16.65" y2="16.65" />
                </svg>
              </button>

              {/* Selection indicator */}
              {selectedImageId === image.id && (
                <div className="absolute top-4 right-4 z-10 bg-blue-500 text-white rounded-full w-8 h-8 flex items-center justify-center font-bold shadow-lg">
                  ✓
                </div>
              )}

              {/* Option label */}
              <div className="absolute top-4 left-4 z-10 bg-white bg-opacity-90 px-3 py-1 rounded-full text-sm font-medium text-gray-700 shadow-sm">
                Opción {index + 1}
              </div>

              {/* Image */}
              <div className="aspect-video w-full overflow-hidden">
                <img
                  src={image.url}
                  alt={image.name || `Opción ${index + 1}`}
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
              </div>

              {/* Image info */}
              <div className="p-4">
                <h3 className="font-medium text-gray-800 truncate">
                  {image.name || `Imagen ${index + 1}`}
                </h3>
              </div>
            </div>
          ))}
        </div>

        {/* Modal de zoom custom con navegación y zoom/pan manual */}
        {zoomImage && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60" onClick={() => setZoomImage(null)}>
            <div className="bg-white rounded-lg shadow-2xl p-4 max-w-7xl w-full relative flex flex-col items-center" onClick={e => e.stopPropagation()}>
              <button
                className="absolute top-2 right-2 text-gray-600 hover:text-red-500 bg-white bg-opacity-80 rounded-full p-2 shadow"
                onClick={() => setZoomImage(null)}
                title="Cerrar"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
              {/* Flecha izquierda */}
              {images.findIndex((img: any) => img.id === zoomImage.id) > 0 && (
                <button
                  className="absolute left-2 top-1/2 -translate-y-1/2 bg-white bg-opacity-80 rounded-full p-2 shadow hover:bg-opacity-100 focus:outline-none"
                  onClick={() => handleZoomNav('prev')}
                  title="Anterior"
                  style={{ zIndex: 10 }}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <polyline points="15 19 8 12 15 5" />
                  </svg>
                </button>
              )}
              {/* Flecha derecha */}
              {images.findIndex((img: any) => img.id === zoomImage.id) < images.length - 1 && (
                <button
                  className="absolute right-2 top-1/2 -translate-y-1/2 bg-white bg-opacity-80 rounded-full p-2 shadow hover:bg-opacity-100 focus:outline-none"
                  onClick={() => handleZoomNav('next')}
                  title="Siguiente"
                  style={{ zIndex: 10 }}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <polyline points="9 5 16 12 9 19" />
                  </svg>
                </button>
              )}
              {/* Imagen con zoom y pan manual */}
              <div
                ref={imgContainerRef}
                className="w-full h-full flex items-center justify-center overflow-hidden"
                style={{ maxHeight: '100vh', maxWidth: '100%', cursor: dragging ? 'grabbing' : 'grab', background: '#f9f9f9' }}
                onWheel={handleWheel}
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
                onTouchStart={handleTouchStart}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleTouchEnd}
              >
                <img
                  src={zoomImage.url}
                  alt={zoomImage.name}
                  draggable={false}
                  style={{
                    transform: `scale(${zoom}) translate(${offset.x / zoom}px, ${offset.y / zoom}px)` ,
                    transition: dragging ? 'none' : 'transform 0.2s',
                    maxWidth: '100%',
                    maxHeight: '100vh',
                    userSelect: 'none',
                    pointerEvents: 'auto',
                  }}
                />
              </div>
              <div className="mt-2 text-center text-gray-700 text-sm">{zoomImage.name}</div>
              {/* Controles de zoom */}
              <div className="flex gap-2 mt-2">
                <button className="px-3 py-1 bg-gray-200 rounded hover:bg-gray-300" onClick={() => setZoom(z => Math.max(1, z - 0.2))}>-</button>
                <span className="px-2">{(zoom * 100).toFixed(0)}%</span>
                <button className="px-3 py-1 bg-gray-200 rounded hover:bg-gray-300" onClick={() => setZoom(z => Math.min(5, z + 0.2))}>+</button>
                <button className="px-3 py-1 bg-gray-200 rounded hover:bg-gray-300" onClick={() => { setZoom(1); setOffset({ x: 0, y: 0 }); }}>Reset</button>
              </div>
            </div>
          </div>
        )}

        {/* Error message */}
        {error && (
          <div className="text-center mb-6">
            <p className="text-red-500 text-sm bg-red-50 border border-red-200 rounded-lg py-2 px-4 inline-block">
              {error}
            </p>
          </div>
        )}

        {/* Continue button */}
        <div className="text-center">
          <button
            onClick={handleContinue}
            className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-8 rounded-lg transition-colors shadow-sm disabled:opacity-50"
          >
            {hasBeenSaved ? 'Actualizar y continuar' : 'Guardar y continuar'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default PreferenceTestTask;
