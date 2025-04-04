import React, { useState, useRef, useEffect } from 'react';
import FileUploader from '@/components/FileUploader';
import { EyeTrackingFormData, EyeTrackingStimulus } from 'shared/interfaces/eye-tracking.interface';
import { useErrorLog } from '@/components/utils/ErrorLogger';

interface StimuliTabProps {
  formData: EyeTrackingFormData;
  researchId: string;
  removeStimulus: (id: string) => void;
  handleFileUploaderComplete: (fileData: { fileUrl: string; key: string }) => void;
}

export const StimuliTab: React.FC<StimuliTabProps> = ({ 
  formData, 
  researchId, 
  removeStimulus,
  handleFileUploaderComplete
}) => {
  const [uploadResult, setUploadResult] = useState<{ fileUrl: string; key: string } | null>(null);
  const logger = useErrorLog();
  
  // Usar una ref para comparar cambios sin crear bucles de actualización
  const prevStimuliCountRef = useRef<number>(0);
  
  // Usar useEffect para monitorear cambios de forma segura
  useEffect(() => {
    // Solo registramos cuando hay un cambio real
    if (formData.stimuli?.items?.length !== prevStimuliCountRef.current) {
      logger.debug('StimuliTab - Cambio en número de estímulos:', {
        prevCount: prevStimuliCountRef.current,
        newCount: formData.stimuli?.items?.length || 0
      });
      prevStimuliCountRef.current = formData.stimuli?.items?.length || 0;
    }
  }, [formData.stimuli?.items?.length, logger]);

  // Handle file upload completion
  const handleUploadComplete = (fileData: { fileUrl: string; key: string }) => {
    logger.debug('StimuliTab - handleUploadComplete:', fileData);
    
    // Guardar el resultado de la última subida
    setUploadResult({
      fileUrl: fileData.fileUrl,
      key: fileData.key
    });
    
    // Pasar el resultado al manejador principal
    logger.debug('StimuliTab - Llamando a handleFileUploaderComplete con:', fileData);
    handleFileUploaderComplete(fileData);
  };

  // Manejar error en la subida
  const handleUploadError = (error: any) => {
    logger.error('StimuliTab - Error al cargar archivo:', error);
    alert(`Error al subir el archivo: ${error.message || 'Error desconocido'}`);
  };

  return (
    <>
      <div className="space-y-6">
        <div className="grid grid-cols-1 gap-6">
          <div>
            <div className="space-y-3">
              <h3 className="text-sm font-medium text-neutral-900">Estímulos</h3>
              <p className="text-xs text-neutral-500">
                Sube las imágenes que serán utilizadas como estímulos en el experimento de eye tracking.
              </p>
              
              {/* Debug info */}
              <div className="p-2 bg-yellow-50 border border-yellow-200 rounded text-xs">
                <p className="font-medium text-yellow-800">Información de depuración:</p>
                <p className="text-yellow-700">Número actual de estímulos: {formData.stimuli.items.length}</p>
              </div>
              
              <div className="mt-4 space-y-4">
                <FileUploader 
                  researchId={researchId}
                  folder="eye-tracking-stimuli"
                  accept="image/*"
                  multiple={true}
                  maxSize={10 * 1024 * 1024} // 10MB
                  onUploadComplete={handleUploadComplete}
                  onUploadError={handleUploadError}
                />

                {/* Uploaded files section */}
                <div className="space-y-3">
                  <h4 className="text-sm font-medium">Estímulos seleccionados:</h4>
                  <div className="grid grid-cols-3 gap-4">
                    {formData.stimuli.items.map((stimulus: EyeTrackingStimulus) => (
                      <div key={stimulus.id} className="border rounded-lg p-3 bg-neutral-50">
                        <div className="aspect-video bg-neutral-200 rounded-md mb-2 overflow-hidden">
                          {stimulus.fileUrl && (
                            <img 
                              src={stimulus.fileUrl} 
                              alt={stimulus.fileName}
                              className="h-full w-full object-cover"
                            />
                          )}
                          {!stimulus.fileUrl && (
                            <div className="h-full w-full flex items-center justify-center text-neutral-400">
                              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                              </svg>
                            </div>
                          )}
                        </div>
                        <div className="flex justify-between items-center">
                          <div>
                            <div className="text-xs font-medium truncate" title={stimulus.fileName}>
                              {stimulus.fileName}
                            </div>
                            <div className="text-xs text-neutral-500">
                              {Math.round((stimulus.fileSize || 0) / 1024)} KB
                            </div>
                            {stimulus.s3Key && (
                              <div className="text-xs text-green-600">
                                ✓ Subido a S3
                              </div>
                            )}
                          </div>
                          <button
                            onClick={() => removeStimulus(stimulus.id)}
                            className="p-1 text-red-500 hover:text-red-700"
                            title="Eliminar estímulo"
                          >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </div>
                      </div>
                    ))}
                    
                    {formData.stimuli.items.length === 0 && (
                      <div className="col-span-3 p-4 bg-neutral-50 rounded-lg text-center text-neutral-500">
                        No hay estímulos subidos aún. Usa el cargador para subir imágenes.
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Mostrar detalles del último archivo subido */}
      {uploadResult && (
        <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-md">
          <h4 className="text-sm font-medium text-blue-800">Último archivo subido:</h4>
          <div className="mt-2 text-xs text-blue-700 break-all">
            <p><strong>URL:</strong> {uploadResult.fileUrl}</p>
            <p><strong>Clave S3:</strong> {uploadResult.key}</p>
          </div>
        </div>
      )}
    </>
  );
}; 