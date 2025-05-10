import React, { useState, useEffect } from 'react';
import { 
  DemographicsSection, 
  DemographicResponses,
  DEFAULT_DEMOGRAPHICS_CONFIG
} from '../../types/demographics';
import { DemographicQuestion } from './DemographicQuestion';
import { demographicsService } from '../../services/demographics.service';
import { useParticipantStore } from '../../stores/participantStore';

interface DemographicsFormProps {
  config?: DemographicsSection;
  initialValues?: DemographicResponses;
  onSubmit: (responses: DemographicResponses) => void;
  onCancel?: () => void;
  isLoading?: boolean;
}

export const DemographicsForm: React.FC<DemographicsFormProps> = ({
  config = DEFAULT_DEMOGRAPHICS_CONFIG,
  initialValues = {},
  onSubmit,
  onCancel,
  isLoading = false,
}) => {
  const [apiError, setApiError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [dataLoading, setDataLoading] = useState(true);
  const [dataExisted, setDataExisted] = useState(false); // Para decidir si crear o actualizar
  const token = useParticipantStore(state => state.token);
  const researchId = useParticipantStore(state => state.researchId);
  const participantId = useParticipantStore(state => state.participantId);

  const [responses, setResponses] = useState<DemographicResponses>(initialValues);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  // Efecto para cargar datos desde la API cuando el componente se monta
  useEffect(() => {
    const fetchExistingResponses = async () => {
      if (!researchId || !participantId || !token) {
        console.log('[DemographicsForm] No se pueden obtener datos (faltan credenciales)');
        setDataLoading(false);
        return;
      }

      try {
        console.log(`[DemographicsForm] Obteniendo respuestas guardadas para research: ${researchId}, participant: ${participantId}`);
        const result = await demographicsService.getDemographicResponses(
          researchId as string,
          participantId as string,
          token as string
        );

        if (result.error) {
          console.error('[DemographicsForm] Error obteniendo datos:', result.message);
        } else if (result.data && Object.keys(result.data).length > 0) {
          console.log('[DemographicsForm] Datos obtenidos correctamente:', result.data);
          // Marcar que los datos existían previamente
          setDataExisted(true);
          // Actualizar el estado con los datos obtenidos
          setResponses(result.data);
        } else {
          console.log('[DemographicsForm] No hay datos guardados anteriormente');
          // Marcar que los datos NO existían previamente
          setDataExisted(false);
          // Usar los initialValues si no hay datos en la API
          setResponses(initialValues);
        }
      } catch (error) {
        console.error('[DemographicsForm] Error al obtener datos:', error);
      } finally {
        setDataLoading(false);
      }
    };

    fetchExistingResponses();
  }, [researchId, participantId, token, initialValues]);

  // Si la configuración cambia, actualizar las respuestas para mantener solo campos relevantes
  useEffect(() => {
    const updatedResponses: DemographicResponses = {};
    
    // Mantener solo las respuestas de preguntas habilitadas
    Object.entries(config.questions).forEach(([key, questionConfig]) => {
      if (questionConfig.enabled && responses[key] !== undefined) {
        updatedResponses[key] = responses[key];
      }
    });
    
    setResponses(updatedResponses);
  }, [config]);

  // Función para manejar cambios en las respuestas
  const handleChange = (id: string, value: any) => {
    setResponses(prev => {
      const newResponses = { ...prev, [id]: value };
      return newResponses;
    });
    
    // Limpiar error si el campo ahora tiene valor
    if (value && formErrors[id]) {
      setFormErrors(prev => {
        const updated = { ...prev };
        delete updated[id];
        return updated;
      });
    }
  };

  // Función para validar el formulario antes de enviar
  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};
    
    // Verificar si todos los campos requeridos tienen valor
    Object.entries(config.questions).forEach(([key, questionConfig]) => {
      if (questionConfig.enabled && questionConfig.required && !responses[key]) {
        errors[key] = `El campo ${questionConfig.title || key} es obligatorio.`;
      }
    });
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Función para guardar datos en el servidor
  const saveToServer = async (responseData: DemographicResponses): Promise<boolean> => {
    if (!researchId || !participantId || !token) {
      console.error("Faltan datos necesarios para guardar en servidor (researchId, participantId o token)");
      return false;
    }

    setIsSaving(true);
    setApiError(null);
    
    try {
      // Decidir si crear o actualizar según si los datos existían
      const method = dataExisted ? 'PUT' : 'POST';
      console.log(`[DemographicsForm] ${dataExisted ? 'Actualizando' : 'Creando'} datos para research: ${researchId}, participant: ${participantId}`);
      
      // Llamar al método apropiado según el caso
      const result = dataExisted 
        ? await demographicsService.updateDemographicResponses(
            researchId as string,
            participantId as string,
            responseData,
            token as string
          )
        : await demographicsService.saveDemographicResponses(
            researchId as string,
            participantId as string,
            responseData,
            token as string
          );
      
      if (result.error || !result.data) {
        console.error(`[DemographicsForm] Error ${dataExisted ? 'actualizando' : 'guardando'} datos en servidor:`, result.message);
        setApiError(result.message || `Error ${dataExisted ? 'actualizando' : 'guardando'} datos en el servidor`);
        return false;
      }
      
      console.log(`[DemographicsForm] Datos ${dataExisted ? 'actualizados' : 'guardados'} correctamente en servidor`, result.data);
      // Si los datos no existían antes, ahora sí existen
      if (!dataExisted) {
        setDataExisted(true);
      }
      return true;
    } catch (error) {
      console.error(`[DemographicsForm] Excepción ${dataExisted ? 'actualizando' : 'guardando'} datos:`, error);
      setApiError(error instanceof Error ? error.message : "Error desconocido");
      return false;
    } finally {
      setIsSaving(false);
    }
  };

  // Manejar el envío del formulario
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    // Guardar en servidor antes de continuar
    const serverSaveSuccess = await saveToServer(responses);
    
    if (serverSaveSuccess) {
      // Solo continuar con el flujo si la API funcionó correctamente
      onSubmit(responses);
    } else {
      // Mostrar mensaje de error pero no continuar
      setApiError("No se pudo completar el formulario debido a un error de conexión con el servidor.");
    }
  };

  // Si la sección no está habilitada, no mostrar nada
  if (!config.enabled) {
    return null;
  }

  // Mostrar pantalla de carga mientras se obtienen datos
  if (dataLoading) {
    return (
      <div className="w-full max-w-lg mx-auto bg-white p-6 rounded-lg shadow-md text-center">
        <h2 className="text-2xl font-bold text-gray-800 mb-4">{config.title}</h2>
        <p className="text-gray-600">Cargando datos del servidor...</p>
      </div>
    );
  }

  // Obtener solo las preguntas habilitadas y ordenarlas si tienen orden
  const enabledQuestions = Object.entries(config.questions)
    .filter(([_, questionConfig]) => questionConfig.enabled)
    .sort(([_, a], [__, b]) => {
      // Ordenar por la propiedad order si existe, de lo contrario mantener el orden original
      if (a.order !== undefined && b.order !== undefined) {
        return a.order - b.order;
      }
      return 0;
    })
    .map(([key, questionConfig]) => ({ key, config: questionConfig }));

  return (
    <div className="w-full max-w-lg mx-auto bg-white p-6 rounded-lg shadow-md">
      <h2 className="text-2xl font-bold text-center text-gray-800 mb-4">{config.title}</h2>
      {config.description && (
        <p className="text-gray-600 text-center mb-6">{config.description}</p>
      )}
      
      {apiError && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
          <p className="text-sm">Error: {apiError}</p>
        </div>
      )}
      
      <form onSubmit={handleSubmit}>
        {enabledQuestions.map(({ key, config: questionConfig }) => (
          <div key={key} className={formErrors[key] ? 'has-error' : ''}>
            <DemographicQuestion
              config={questionConfig}
              value={responses[key]}
              onChange={handleChange}
            />
            {formErrors[key] && (
              <p className="text-red-500 text-xs mt-1">{formErrors[key]}</p>
            )}
          </div>
        ))}
        
        <div className="flex justify-between mt-8">
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-500"
              disabled={dataLoading || isSaving}
            >
              Cancelar
            </button>
          )}
          <button
            type="submit"
            className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50"
            disabled={dataLoading || isSaving}
          >
            {dataLoading || isSaving ? 'Enviando...' : 'Continuar'}
          </button>
        </div>
      </form>
      {/* Panel de debug */}
      <details className="mt-4 text-xs">
        <summary className="cursor-pointer font-medium">Estado de la API</summary>
        <div className="mt-1 bg-gray-100 p-2 rounded text-gray-700 overflow-auto text-xs">
          <p><strong>Estado API:</strong> {apiError ? 'Error' : (isSaving ? 'Enviando...' : 'Listo')}</p>
          <p><strong>Método a usar:</strong> {dataExisted ? 'PUT (actualizar)' : 'POST (crear)'}</p>
          <p><strong>Research ID:</strong> {researchId || 'No disponible'}</p>
          <p><strong>Participant ID:</strong> {participantId || 'No disponible'}</p>
          <p><strong>Token disponible:</strong> {token ? 'Sí' : 'No'}</p>
          <p><strong>Datos actuales:</strong></p>
          <pre>{JSON.stringify(responses, null, 2)}</pre>
        </div>
      </details>
    </div>
  );
}; 