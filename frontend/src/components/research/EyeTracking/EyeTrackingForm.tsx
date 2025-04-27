import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Tabs, Tab } from '@/components/ui/Tabs';
import { useErrorLog } from '@/components/utils/ErrorLogger';
import { StimuliTab } from '../StimuliTab/StimuliTab';
import { CalibrationTab } from './CalibrationTab';
import { SettingsTab } from './SettingsTab';
import { Save } from 'lucide-react';

interface EyeTrackingFormProps {
  researchId: string;
  initialData?: any;
  onSubmit: (data: any) => void;
  onPreview?: () => void;
  isSaving?: boolean;
  eyeTrackingId?: string | null;
}

export const EyeTrackingForm: React.FC<EyeTrackingFormProps> = ({
  researchId,
  initialData,
  onSubmit: onSave,
  onPreview,
  isSaving,
  eyeTrackingId
}) => {
  // Usar logger al inicio del componente
  const logger = useErrorLog();
  
  // Estado del formulario
  const [activeTab, setActiveTab] = useState('stimuli');
  const [formData, setFormData] = useState(() => {
    return initialData || {
      stimuli: {
        items: [],
        settings: {
          displayMode: 'sequential',
          stimulusDuration: 5,
          interStimulusDuration: 0.5
        }
      },
      calibration: {
        type: 'standard',
        pointCount: 5,
        targetSize: 'medium',
        targetColor: '#FF0000',
        backgroundColor: '#FFFFFF'
      },
      settings: {
        captureMode: 'continuous',
        sampleRate: 60,
        recordAudio: false,
        showGaze: false,
        allowPause: true
      }
    };
  });
  
  // Referencias para evitar problemas en efectos
  const formDataRef = useRef(formData);
  const tabCompletionRef = useRef({
    stimuli: false,
    calibration: false,
    settings: false
  });
  
  // Crear funciones de logger estables con useCallback
  const logDebug = useCallback((message: string, details?: any) => {
    setTimeout(() => {
      logger.debug(message, details);
    }, 0);
  }, [logger]);
  
  const logError = useCallback((message: string, details?: any) => {
    setTimeout(() => {
      logger.error(message, details);
    }, 0);
  }, [logger]);
  
  // Actualizar referencia cuando cambie formData
  useEffect(() => {
    formDataRef.current = formData;
  }, [formData]);
  
  // Actualizar formData con datos parciales
  const handleUpdateData = useCallback((partialData: any) => {
    setFormData((prev: typeof formData) => {
      const newData = { ...prev, ...partialData };
      // Mover el logging fuera del renderizado
      setTimeout(() => {
        logDebug('EyeTrackingForm - Datos actualizados', { 
          changedFields: Object.keys(partialData),
          tab: activeTab
        });
      }, 0);
      return newData;
    });
  }, [activeTab, logDebug]);
  
  // Cambiar de pestaña
  const handleChangeTab = useCallback((tabId: string) => {
    setActiveTab(tabId);
    // Log después del cambio de estado
    setTimeout(() => {
      logDebug('EyeTrackingForm - Cambio de pestaña', { from: activeTab, to: tabId });
    }, 0);
  }, [activeTab, logDebug]);
  
  // Marcar una pestaña como completada
  const handleTabCompletion = useCallback((tab: string, isComplete: boolean) => {
    tabCompletionRef.current = {
      ...tabCompletionRef.current,
      [tab]: isComplete
    };
    // Log después de la actualización
    setTimeout(() => {
      logDebug('EyeTrackingForm - Estado de completado de pestaña', { 
        tab, 
        isComplete,
        allTabs: tabCompletionRef.current
      });
    }, 0);
  }, [logDebug]);
  
  // Enviar el formulario
  const handleSubmit = useCallback(() => {
    try {
      // Verificar si hay datos para enviar
      if (!formDataRef.current) {
        logError('EyeTrackingForm - No hay datos para enviar');
        return;
      }
      
      logDebug('EyeTrackingForm - Enviando formulario', { 
        stimuliCount: formDataRef.current.stimuli?.items?.length || 0,
        completedTabs: tabCompletionRef.current
      });
      
      onSave(formDataRef.current);
    } catch (err) {
      logError('EyeTrackingForm - Error al guardar formulario', err);
    }
  }, [onSave, logDebug, logError]);
  
  return (
    <Card className="p-6">
      <h2 className="text-2xl font-bold mb-4">Configuración de Seguimiento Ocular</h2>
      
      {/* --- Información Contextual --- */}
      <div className="mb-6 p-3 bg-gray-50 border rounded-md text-sm text-gray-600">
        <p><span className="font-semibold">Estado:</span> {eyeTrackingId ? 'Configuración existente' : 'Configuración nueva'}</p>
        {eyeTrackingId && (
          <p><span className="font-semibold">ID:</span> {eyeTrackingId}</p>
        )}
        <p><span className="font-semibold">Research ID:</span> {researchId}</p>
      </div>
      {/* --- Fin Información Contextual --- */}
      
      <Tabs activeTab={activeTab} onChange={handleChangeTab}>
        <Tab id="stimuli" label="Estímulos">
          <StimuliTab
            formData={formData}
            onUpdate={handleUpdateData}
            researchId={researchId}
          />
        </Tab>
        
        <Tab id="calibration" label="Calibración">
          <CalibrationTab
            formData={formData}
            onUpdate={handleUpdateData}
          />
        </Tab>
        
        <Tab id="settings" label="Configuración">
          <SettingsTab
            formData={formData}
            onUpdate={handleUpdateData}
          />
        </Tab>
      </Tabs>
      
      <div className="flex justify-between items-center pt-6 border-t mt-8">
        {onPreview && (
          <Button 
            type="button" 
            variant="outline" 
            onClick={onPreview}
            disabled={isSaving}
          >
            Vista previa
          </Button>
        )}
        
        <div className="flex ml-auto gap-4">
          <Button 
            type="button" 
            onClick={handleSubmit}
            disabled={isSaving}
          >
            {isSaving ? (
              <>
                <span className="animate-spin mr-2">
                  <Save className="h-4 w-4" />
                </span>
                Guardando...
              </>
            ) : eyeTrackingId ? (
              <>
                <Save className="h-4 w-4 mr-2" />
                Actualizar
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Guardar
              </>
            )}
          </Button>
        </div>
      </div>
    </Card>
  );
}; 