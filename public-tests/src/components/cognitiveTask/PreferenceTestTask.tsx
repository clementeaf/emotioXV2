import React, { useState } from 'react';
import Zoom from 'react-medium-image-zoom';
import 'react-medium-image-zoom/dist/styles.css';
import { MappedStepComponentProps } from '../../types/flow.types';

interface PreferenceFile {
  id: string;
  name: string;
  url: string;
  type: string;
  size: number;
}

const PreferenceTestTask: React.FC<MappedStepComponentProps> = ({ stepConfig, onStepComplete, savedResponse }) => {
  const [selectedImageId, setSelectedImageId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [hasBeenSaved, setHasBeenSaved] = useState<boolean>(false);
  // Estado para zoom modal
  const [zoomImage, setZoomImage] = useState<PreferenceFile | null>(null);

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

  React.useEffect(() => {
    if (savedResponse) {
      let extractedImageId: string | null = null;

      if (typeof savedResponse === 'object' && 'selectedImageId' in savedResponse) {
        extractedImageId = (savedResponse as { selectedImageId: string }).selectedImageId;
      }
      else if (typeof savedResponse === 'object' && 'response' in savedResponse) {
        const response = (savedResponse as { response: unknown }).response;
        if (typeof response === 'object' && response && 'selectedImageId' in response) {
          extractedImageId = (response as { selectedImageId: string }).selectedImageId;
        }
      }
      else if (typeof savedResponse === 'string') {
        extractedImageId = savedResponse;
      }
      else if (typeof savedResponse === 'object') {
        const searchForImageId = (obj: any): string | null => {
          if (!obj || typeof obj !== 'object') return null;

          for (const [_key, value] of Object.entries(obj)) {
            if (typeof value === 'string' && images.some((img: any) => img.id === value)) {
              return value;
            }
            if (typeof value === 'object' && value !== null) {
              const nested = searchForImageId(value);
              if (nested) return nested;
            }
          }
          return null;
        };

        extractedImageId = searchForImageId(savedResponse);
      }

      if (extractedImageId && images.some((img: any) => img.id === extractedImageId)) {
        setSelectedImageId(extractedImageId);
        setHasBeenSaved(true);
      }
    }
  }, [savedResponse, images]);

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

        {/* Modal de zoom con react-medium-image-zoom */}
        {zoomImage && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60" onClick={() => setZoomImage(null)}>
            <div className="bg-white rounded-lg shadow-2xl p-4 max-w-3xl w-full relative flex flex-col items-center" onClick={e => e.stopPropagation()}>
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
              <Zoom>
                <img
                  src={zoomImage.url}
                  alt={zoomImage.name}
                  className="w-full h-auto max-h-[80vh] object-contain rounded cursor-zoom-in"
                  style={{ background: '#f9f9f9' }}
                />
              </Zoom>
              <div className="mt-2 text-center text-gray-700 text-sm">{zoomImage.name}</div>
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
