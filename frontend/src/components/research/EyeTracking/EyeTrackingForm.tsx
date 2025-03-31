import React, { useEffect, useState } from 'react';
import { Spinner } from '@/components/ui/Spinner';
import { Button } from '@/components/ui/Button';
import { useEyeTrackingForm } from './hooks/useEyeTrackingForm';
import { SetupTab } from './tabs/SetupTab';
import { StimuliTab } from './tabs/StimuliTab';
import { AdvancedTab } from './tabs/AdvancedTab';
import { PreviewTab } from './tabs/PreviewTab';
import { toast } from 'react-hot-toast';
import { useErrorLog } from '@/components/utils/ErrorLogger';

interface EyeTrackingFormProps {
  researchId: string;
}

// Componente Modal para mostrar los datos del formulario
const FormDataModal: React.FC<{
  formData: any;
  onClose: () => void;
  onSave: () => void;
}> = ({ formData, onClose, onSave }) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-auto">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-800">Datos a enviar al backend</h2>
          <p className="text-sm text-gray-500 mt-1">
            Estos son los datos que se enviarían al backend mediante la API.
          </p>
        </div>
        <div className="p-6 overflow-auto" style={{ maxHeight: 'calc(90vh - 200px)' }}>
          <pre className="bg-gray-50 p-4 rounded text-xs overflow-auto max-h-[60vh]">
            {JSON.stringify(formData, null, 2)}
          </pre>
        </div>
        <div className="p-4 border-t border-gray-200 flex justify-end space-x-4">
          <Button 
            variant="outline" 
            onClick={onClose}
            size="sm"
          >
            Cerrar
          </Button>
          <Button 
            variant="default" 
            onClick={onSave}
            size="sm"
          >
            Continuar con el guardado
          </Button>
        </div>
      </div>
    </div>
  );
};

export const EyeTrackingForm: React.FC<EyeTrackingFormProps> = ({ researchId }) => {
  const [activeTab, setActiveTab] = useState<string>('setup');
  const [savingMessage, setSavingMessage] = useState<string>('');
  const [showDataModal, setShowDataModal] = useState<boolean>(false);
  const logger = useErrorLog();
  
  const { 
    formData, 
    updateFormData, 
    isSaving,
    isUploading,
    eyeTrackingId,
    handleFileUploaderComplete,
    removeStimulus,
    addAreaOfInterest,
    removeAreaOfInterest,
    handleSave,
    setActiveTab: setFormActiveTab,
    validateStimuliData
  } = useEyeTrackingForm({
    researchId
  });

  useEffect(() => {
    setFormActiveTab(activeTab);
  }, [activeTab, setFormActiveTab]);

  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
  };

  const getSaveButtonText = () => {
    if (isSaving) return 'Guardando...';
    if (eyeTrackingId) return 'Actualizar configuración';
    return 'Guardar configuración';
  };

  // Actualizar el mensaje de guardado según el estado
  useEffect(() => {
    if (isSaving) {
      const temporaryImages = formData.stimuli?.items?.filter(
        s => (s.fileUrl && s.fileUrl.startsWith('blob:')) || (!s.s3Key && s.fileUrl)
      );
      
      if (temporaryImages && temporaryImages.length > 0) {
        setSavingMessage(`Procesando ${temporaryImages.length} imágenes antes de guardar...`);
      } else {
        setSavingMessage('Guardando configuración...');
      }
    } else {
      setSavingMessage('');
    }
  }, [isSaving, formData.stimuli?.items]);

  // Handler para el botón de guardar
  const handleSaveClick = () => {
    logger.debug('EyeTrackingForm.handleSaveClick - Iniciando guardado...');
    
    // Validar explícitamente los datos de estímulos antes de guardar
    if (formData.stimuli?.items?.length > 0) {
      logger.debug('EyeTrackingForm.handleSaveClick - Validando estímulos antes de guardar...');
      const isValid = validateStimuliData();
      
      if (!isValid) {
        logger.error('EyeTrackingForm.handleSaveClick - Error en validación de estímulos');
        toast.error('Hay problemas con los estímulos. Por favor, verifica que todas las imágenes se hayan subido correctamente.');
        setActiveTab('stimuli'); // Cambiar a la pestaña de estímulos para que el usuario pueda corregir
        return;
      }
      
      logger.debug('EyeTrackingForm.handleSaveClick - Validación de estímulos exitosa');
    }
    
    // Verificar si hay imágenes temporales
    const temporaryImages = formData.stimuli?.items?.filter(
      s => (s.fileUrl && s.fileUrl.startsWith('blob:')) || (!s.s3Key && s.fileUrl)
    );
    
    if (temporaryImages && temporaryImages.length > 0) {
      logger.debug('EyeTrackingForm.handleSaveClick - Se encontraron imágenes temporales:', {
        count: temporaryImages.length,
        items: temporaryImages.map(item => ({
          id: item.id,
          fileName: item.fileName
        }))
      });
      toast.success(`Se procesarán ${temporaryImages.length} imágenes antes de guardar`, {
        duration: 3000
      });
    }
    
    // Mostrar la estructura completa de datos que se enviará
    logger.debug('EyeTrackingForm.handleSaveClick - Datos completos a guardar:', formData);
    
    // Mostrar modal con los datos que se enviarían
    setShowDataModal(true);
  };

  // Handler para continuar con el guardado real
  const handleProceedWithSave = async () => {
    setShowDataModal(false);
    // Ejecutar el guardado real
    await handleSave();
  };

  return (
    <div className="py-6">
      {isUploading && (
        <div className="mb-4 p-3 bg-blue-50 text-blue-700 rounded-md flex items-center">
          <Spinner size="sm" className="mr-2" />
          <span>Subiendo archivos... Por favor, espere.</span>
        </div>
      )}
      
      {isSaving && savingMessage && (
        <div className="mb-4 p-3 bg-green-50 text-green-700 rounded-md flex items-center">
          <Spinner size="sm" className="mr-2" />
          <span>{savingMessage}</span>
        </div>
      )}

      {/* Modal para mostrar datos */}
      {showDataModal && (
        <FormDataModal
          formData={{
            ...formData,
            researchId: researchId.trim()
          }}
          onClose={() => setShowDataModal(false)}
          onSave={handleProceedWithSave}
        />
      )}

      <div className="flex items-center justify-between flex-wrap gap-4 mb-4">
        <div className="flex border-b border-neutral-200">
          <button
            type="button"
            className={`px-4 py-2 text-sm font-medium ${
              activeTab === 'setup' 
                ? 'text-blue-600 border-b-2 border-blue-600' 
                : 'text-neutral-600 hover:text-blue-500'
            } ${isUploading || isSaving ? 'opacity-50 cursor-not-allowed' : ''}`}
            onClick={() => !isUploading && !isSaving && handleTabChange('setup')}
            disabled={isUploading || isSaving}
          >
            Configuración
          </button>
          <button
            type="button"
            className={`px-4 py-2 text-sm font-medium ${
              activeTab === 'stimuli' 
                ? 'text-blue-600 border-b-2 border-blue-600' 
                : 'text-neutral-600 hover:text-blue-500'
            } ${isUploading || isSaving ? 'opacity-50 cursor-not-allowed' : ''}`}
            onClick={() => !isUploading && !isSaving && handleTabChange('stimuli')}
            disabled={isUploading || isSaving}
          >
            Estímulos
          </button>
          <button
            type="button"
            className={`px-4 py-2 text-sm font-medium ${
              activeTab === 'advanced' 
                ? 'text-blue-600 border-b-2 border-blue-600' 
                : 'text-neutral-600 hover:text-blue-500'
            } ${isUploading || isSaving ? 'opacity-50 cursor-not-allowed' : ''}`}
            onClick={() => !isUploading && !isSaving && handleTabChange('advanced')}
            disabled={isUploading || isSaving}
          >
            Avanzado
          </button>
          <button
            type="button"
            className={`px-4 py-2 text-sm font-medium ${
              activeTab === 'preview' 
                ? 'text-blue-600 border-b-2 border-blue-600' 
                : 'text-neutral-600 hover:text-blue-500'
            } ${isUploading || isSaving ? 'opacity-50 cursor-not-allowed' : ''}`}
            onClick={() => !isUploading && !isSaving && handleTabChange('preview')}
            disabled={isUploading || isSaving}
          >
            Vista previa
          </button>
        </div>
        <div className="flex items-center gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              toast.success('Cambios descartados');
              window.location.reload();
            }}
            disabled={isSaving || isUploading}
            size="sm"
          >
            Cancelar
          </Button>
          <Button
            type="button"
            variant="default"
            onClick={handleSaveClick}
            disabled={isSaving || isUploading}
            size="sm"
          >
            {isSaving && <Spinner size="sm" className="mr-2" />}
            {getSaveButtonText()}
          </Button>
        </div>
      </div>

      <div className="mt-6 border-t border-neutral-100 pt-6">
        {activeTab === 'setup' && (
          <SetupTab
            formData={formData}
            updateFormData={updateFormData}
          />
        )}
        {activeTab === 'stimuli' && (
          <StimuliTab
            formData={formData}
            researchId={researchId}
            removeStimulus={removeStimulus}
            handleFileUploaderComplete={handleFileUploaderComplete}
          />
        )}
        {activeTab === 'advanced' && (
          <AdvancedTab
            formData={formData}
            updateFormData={updateFormData}
            addAreaOfInterest={addAreaOfInterest}
            removeAreaOfInterest={removeAreaOfInterest}
          />
        )}
        {activeTab === 'preview' && (
          <PreviewTab
            formData={formData}
            updateFormData={updateFormData}
          />
        )}
      </div>
    </div>
  );
}; 