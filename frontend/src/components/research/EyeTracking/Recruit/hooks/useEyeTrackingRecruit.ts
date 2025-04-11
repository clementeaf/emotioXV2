'use client';

import { useState, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';
import { useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/providers/AuthProvider';
import { 
  EyeTrackingRecruitConfig, 
  EyeTrackingRecruitStats, 
  DemographicQuestionKey,
  LinkConfigKey,
  ParameterOptionKey,
  BacklinkKey,
  EyeTrackingRecruitRequest
} from '@/shared/interfaces/eyeTracking';
import API_CONFIG from '@/config/api.config';
import { eyeTrackingFixedAPI } from "@/lib/eye-tracking-api";

// Interfaces
interface UseEyeTrackingRecruitProps {
  researchId: string;
}

// Definición de interfaces para datos del formulario
interface EyeTrackingRecruitFormData {
  id?: string;
  researchId: string;
  demographicQuestions: {
    age: boolean;
    country: boolean;
    gender: boolean;
    educationLevel: boolean;
    householdIncome: boolean;
    employmentStatus: boolean;
    dailyHoursOnline: boolean;
    technicalProficiency: boolean;
  };
  linkConfig: {
    allowMobile: boolean;
    trackLocation: boolean;
    allowMultipleAttempts: boolean;
  };
  participantLimit: {
    enabled: boolean;
    value: number;
  };
  backlinks: {
    complete: string;
    disqualified: string;
    overquota: string;
  };
  researchUrl: string;
  parameterOptions: {
    saveDeviceInfo: boolean;
    saveLocationInfo: boolean;
    saveResponseTimes: boolean;
    saveUserJourney: boolean;
  };
}

interface UseEyeTrackingRecruitResult {
  // Estados del formulario
  loading: boolean;
  saving: boolean;
  formData: EyeTrackingRecruitFormData;
  stats: EyeTrackingRecruitStats | null;
  
  // Estados para los switches principales
  demographicQuestionsEnabled: boolean;
  setDemographicQuestionsEnabled: (value: boolean) => void;
  linkConfigEnabled: boolean;
  setLinkConfigEnabled: (value: boolean) => void;
  
  // Métodos para manipular el formulario
  handleDemographicChange: (key: DemographicQuestionKey, value: boolean) => void;
  handleLinkConfigChange: (key: LinkConfigKey, value: any) => void;
  handleBacklinkChange: (key: BacklinkKey, value: any) => void;
  handleParamOptionChange: (key: ParameterOptionKey, value: boolean) => void;
  setLimitParticipants: (value: boolean) => void;
  setParticipantLimit: (value: number) => void;
  setResearchUrl: (value: string) => void;
  
  // Acciones
  saveForm: () => void;
  generateRecruitmentLink: () => string;
  generateQRCode: () => void;
  copyLinkToClipboard: () => void;
  previewLink: () => void;
  
  // Estados para el modal JSON
  showJsonPreview: boolean;
  jsonToSend: string;
  closeJsonModal: () => void;
  
  // Nuevos estados para QR y Preview
  qrCodeData: string | null;
  showQRModal: boolean;
  closeQRModal: () => void;
  showLinkPreview: boolean;
  closeLinkPreview: () => void;
}

// Configuraciones por defecto
const DEFAULT_STATS: EyeTrackingRecruitStats = {
  complete: {
    count: 0,
    percentage: 0,
    label: 'Complete',
    description: 'IDs have been successful'
  },
  disqualified: {
    count: 0,
    percentage: 0,
    label: 'Disqualified',
    description: 'IDs have been redirected'
  },
  overquota: {
    count: 0,
    percentage: 0,
    label: 'Overquota',
    description: 'IDs have been redirected'
  }
};

const DEFAULT_CONFIG: Omit<EyeTrackingRecruitConfig, 'researchId'> = {
  demographicQuestions: {
    age: false,
    country: true,
    gender: false,
    educationLevel: true,
    householdIncome: false,
    employmentStatus: true,
    dailyHoursOnline: false,
    technicalProficiency: false
  },
  linkConfig: {
    allowMobile: false,
    trackLocation: true,
    allowMultipleAttempts: false
  },
  participantLimit: {
    enabled: true,
    value: 50
  },
  backlinks: {
    complete: 'www.useremotion.com/',
    disqualified: 'www.useremotion.com/',
    overquota: 'www.useremotion.com/'
  },
  researchUrl: 'www.useremotion.com/sysgd-jye7467responding={participant_id}',
  parameterOptions: {
    saveDeviceInfo: true,
    saveLocationInfo: true,
    saveResponseTimes: true,
    saveUserJourney: true
  }
};

// Hook principal
export function useEyeTrackingRecruit({ researchId }: UseEyeTrackingRecruitProps): UseEyeTrackingRecruitResult {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { isAuthenticated } = useAuth();
  
  // Estados
  const [formData, setFormData] = useState<EyeTrackingRecruitFormData>({
    ...DEFAULT_CONFIG,
    researchId
  });
  const [stats, setStats] = useState<EyeTrackingRecruitStats | null>(DEFAULT_STATS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  // Estados adicionales para los switches principales
  const [demographicQuestionsEnabled, setDemographicQuestionsEnabled] = useState(true);
  const [linkConfigEnabled, setLinkConfigEnabled] = useState(true);
  
  // Estados para el modal JSON
  const [showJsonPreview, setShowJsonPreview] = useState<boolean>(false);
  const [jsonToSend, setJsonToSend] = useState<string>('');
  const [pendingAction, setPendingAction] = useState<'save' | null>(null);
  
  // Nuevos estados para QR y Preview
  const [qrCodeData, setQrCodeData] = useState<string | null>(null);
  const [showQRModal, setShowQRModal] = useState<boolean>(false);
  const [showLinkPreview, setShowLinkPreview] = useState<boolean>(false);
  
  // Función para mostrar el modal de confirmación con JSON
  const showJsonModal = useCallback(() => {
    if (!showJsonPreview || !jsonToSend) return;

    const formDataObj = JSON.parse(jsonToSend);
    
    // Contar preguntas demográficas habilitadas
    const enabledDemographicQuestions = Object.entries(formDataObj.demographicQuestions)
      .filter(([key, value]) => value === true)
      .map(([key]) => {
        const labels: Record<string, string> = {
          age: 'Edad',
          country: 'País',
          gender: 'Género',
          educationLevel: 'Nivel de educación',
          householdIncome: 'Ingresos familiares',
          employmentStatus: 'Estado laboral',
          dailyHoursOnline: 'Horas online',
          technicalProficiency: 'Habilidades técnicas'
        };
        return labels[key as string] || key;
      });
    
    // Contar configuraciones de enlaces habilitadas
    const enabledLinkConfig = Object.entries(formDataObj.linkConfig)
      .filter(([key, value]) => value === true)
      .map(([key]) => {
        const labels: Record<string, string> = {
          allowMobile: 'Permitir dispositivos móviles',
          trackLocation: 'Rastrear ubicación',
          allowMultipleAttempts: 'Permitir múltiples intentos'
        };
        return labels[key as string] || key;
      });
    
    // Construir la opción de límite de participantes
    let participantLimitText = 'Sin límite de participantes';
    if (formDataObj.participantLimit?.enabled) {
      participantLimitText = `Límite: ${formDataObj.participantLimit.value} participantes`;
    }
    
    // Crear el HTML para el modal
    const modalHtml = `
      <div style="position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; z-index: 9999;">
        <div style="background: white; border-radius: 12px; max-width: 90%; width: 550px; max-height: 90vh; display: flex; flex-direction: column; box-shadow: 0 4px 20px rgba(0,0,0,0.2); overflow: hidden;">
          <div style="display: flex; justify-content: space-between; align-items: center; padding: 16px 24px; border-bottom: 1px solid #e5e7eb;">
            <h2 style="margin: 0; font-size: 18px; font-weight: 600;">Confirmar configuración</h2>
            <button id="closeJsonModal" style="background: transparent; border: none; cursor: pointer; width: 32px; height: 32px; border-radius: 50%; display: flex; align-items: center; justify-content: center; color: #555555; transition: all 0.2s; font-size: 24px;">&times;</button>
          </div>
          
          <div style="padding: 24px; overflow-y: auto; flex-grow: 1;">
            <p style="margin: 0 0 20px; color: #6b7280; font-size: 14px;">
              Revise la configuración antes de guardar. Esta es la información que se enviará al servidor.
            </p>
            
            <div style="background: #f0f9ff; border: 1px solid #bae6fd; border-radius: 12px; padding: 20px; margin-bottom: 20px;">
              <h3 style="margin: 0 0 16px; font-size: 16px; color: #0369a1; font-weight: 600;">Enlaces de retorno</h3>
              <div style="display: flex; flex-direction: column; gap: 8px;">
                <div style="display: flex; align-items: center; gap: 10px;">
                  <span style="min-width: 140px; color: #0c4a6e; font-size: 14px;">Completados:</span>
                  <span style="font-family: monospace; font-size: 13px; color: #0c4a6e; word-break: break-all;">${formDataObj.backlinks.complete || 'No definido'}</span>
                </div>
                <div style="display: flex; align-items: center; gap: 10px;">
                  <span style="min-width: 140px; color: #0c4a6e; font-size: 14px;">Descalificados:</span>
                  <span style="font-family: monospace; font-size: 13px; color: #0c4a6e; word-break: break-all;">${formDataObj.backlinks.disqualified || 'No definido'}</span>
                </div>
                <div style="display: flex; align-items: center; gap: 10px;">
                  <span style="min-width: 140px; color: #0c4a6e; font-size: 14px;">Cuota excedida:</span>
                  <span style="font-family: monospace; font-size: 13px; color: #0c4a6e; word-break: break-all;">${formDataObj.backlinks.overquota || 'No definido'}</span>
                </div>
              </div>
            </div>
            
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 20px;">
              <div style="background: #f8f9fa; border: 1px solid #e9ecef; border-radius: 12px; padding: 20px;">
                <h3 style="margin: 0 0 16px; font-size: 16px; color: #495057; font-weight: 600;">Preguntas demográficas</h3>
                ${enabledDemographicQuestions.length > 0 
                  ? `<ul style="margin: 0; padding-left: 20px; color: #495057;">
                      ${enabledDemographicQuestions.map(q => `<li style="margin-bottom: 6px;">${q}</li>`).join('')}
                    </ul>`
                  : `<p style="margin: 0; color: #6c757d; font-size: 14px;">No hay preguntas demográficas habilitadas</p>`
                }
              </div>
              
              <div style="background: #f8f9fa; border: 1px solid #e9ecef; border-radius: 12px; padding: 20px;">
                <h3 style="margin: 0 0 16px; font-size: 16px; color: #495057; font-weight: 600;">Configuración de enlace</h3>
                ${enabledLinkConfig.length > 0 
                  ? `<ul style="margin: 0; padding-left: 20px; color: #495057;">
                      ${enabledLinkConfig.map(c => `<li style="margin-bottom: 6px;">${c}</li>`).join('')}
                    </ul>`
                  : `<p style="margin: 0; color: #6c757d; font-size: 14px;">No hay configuraciones de enlace habilitadas</p>`
                }
                <div style="margin-top: 16px; padding-top: 16px; border-top: 1px solid #dee2e6;">
                  <p style="margin: 0; color: #495057; font-weight: 500;">${participantLimitText}</p>
                </div>
              </div>
            </div>
            
            <div style="background: #ecfdf5; border: 1px solid #a7f3d0; border-radius: 12px; padding: 20px; margin-bottom: 20px;">
              <h3 style="margin: 0 0 16px; font-size: 16px; color: #065f46; font-weight: 600;">URL de investigación</h3>
              <p style="margin: 0; font-family: monospace; font-size: 13px; color: #065f46; word-break: break-all;">
                ${formDataObj.researchUrl || 'No definida'}
              </p>
            </div>
            
            <div style="background: #f5f7f5; border: 1px solid #e5eae5; border-radius: 12px; padding: 20px; color: #333333; font-size: 14px; margin-top: 24px;">
              <div style="display: flex; align-items: start; gap: 12px;">
                <svg style="flex-shrink: 0; margin-top: 2px;" xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#333333" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                  <polyline points="22 4 12 14.01 9 11.01"></polyline>
                </svg>
                <div>
                  <p style="margin: 0 0 10px; font-weight: 500; font-size: 15px; color: #333333;">Resumen de la configuración</p>
                  <ul style="margin: 0; padding-left: 4px; list-style-position: inside;">
                    <li style="margin-bottom: 6px; color: #444444;">Se han seleccionado ${enabledDemographicQuestions.length} de 8 preguntas demográficas.</li>
                    <li style="margin-bottom: 6px; color: #444444;">Los participantes ${formDataObj.linkConfig.allowMobile ? 'podrán' : 'no podrán'} usar dispositivos móviles.</li>
                    <li style="margin-bottom: 6px; color: #444444;">Se ${formDataObj.linkConfig.trackLocation ? 'rastreará' : 'no rastreará'} la ubicación de los participantes.</li>
                    ${formDataObj.participantLimit?.enabled ? `<li style="color: #444444;">Se limitará a un máximo de ${formDataObj.participantLimit.value} participantes.</li>` : '<li style="color: #444444;">No hay límite en el número de participantes.</li>'}
                  </ul>
                </div>
              </div>
            </div>
            
          </div>
          <div style="padding: 20px 28px; border-top: 1px solid #eaeaea; display: flex; justify-content: flex-end; gap: 16px; background: white;">
            <button id="cancelJsonAction" style="background: #f5f5f5; color: #333333; border: 1px solid #e0e0e0; border-radius: 8px; padding: 10px 20px; font-weight: 500; cursor: pointer; font-size: 14px; transition: all 0.2s;">Cancelar</button>
            <button id="continueJsonAction" style="background: #212121; color: white; border: none; border-radius: 8px; padding: 10px 20px; font-weight: 500; cursor: pointer; font-size: 14px; transition: all 0.2s; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
              Guardar configuración
            </button>
          </div>
        </div>
      </div>
    `;
    
    // Crear elemento en el DOM
    const modalContainer = document.createElement('div');
    modalContainer.innerHTML = modalHtml;
    document.body.appendChild(modalContainer);
    
    // Añadir hover effects
    const closeButton = document.getElementById('closeJsonModal');
    if (closeButton) {
      closeButton.addEventListener('mouseover', () => {
        closeButton.style.backgroundColor = '#f1f1f1';
        closeButton.style.color = '#333333';
      });
      closeButton.addEventListener('mouseout', () => {
        closeButton.style.backgroundColor = 'transparent';
        closeButton.style.color = '#555555';
      });
    }
    
    const cancelButton = document.getElementById('cancelJsonAction');
    if (cancelButton) {
      cancelButton.addEventListener('mouseover', () => {
        cancelButton.style.backgroundColor = '#e9e9e9';
      });
      cancelButton.addEventListener('mouseout', () => {
        cancelButton.style.backgroundColor = '#f5f5f5';
      });
    }
    
    const continueButton = document.getElementById('continueJsonAction');
    if (continueButton) {
      continueButton.addEventListener('mouseover', () => {
        continueButton.style.backgroundColor = '#000000';
      });
      continueButton.addEventListener('mouseout', () => {
        continueButton.style.backgroundColor = '#212121';
      });
    }
    
    // Función para manejar la acción de continuar - definida aquí para evitar problemas de scope
    const handleContinueAction = () => {
      if (document.body.contains(modalContainer)) {
        document.body.removeChild(modalContainer);
      }
      // Asegurarse de que continueWithAction se ejecute después de eliminar el modal
      setTimeout(() => {
        continueWithAction();
      }, 10);
    };
    
    // Función para manejar la acción de cancelar
    const handleCancelAction = () => {
      if (document.body.contains(modalContainer)) {
        document.body.removeChild(modalContainer);
      }
      closeJsonModal();
    };
    
    // Configurar eventos
    document.getElementById('closeJsonModal')?.addEventListener('click', handleCancelAction);
    
    document.getElementById('cancelJsonAction')?.addEventListener('click', handleCancelAction);
    
    document.getElementById('continueJsonAction')?.addEventListener('click', handleContinueAction);
    
    // También permitir cerrar haciendo clic fuera del modal
    modalContainer.addEventListener('click', (e) => {
      if (e.target === modalContainer.firstChild) {
        handleCancelAction();
      }
    });
    
    // Limpiar al desmontar
    return () => {
      if (document.body.contains(modalContainer)) {
        document.body.removeChild(modalContainer);
      }
    };
  }, [showJsonPreview, jsonToSend, pendingAction, researchId]);
  
  // Función para cerrar el modal JSON
  const closeJsonModal = () => {
    setShowJsonPreview(false);
    setPendingAction(null);
  };
  
  // Función para cerrar el modal QR
  const closeQRModal = () => {
    setShowQRModal(false);
  };
  
  // Función para cerrar la vista previa del enlace
  const closeLinkPreview = () => {
    setShowLinkPreview(false);
  };
  
  // Función para continuar con la acción después de mostrar el JSON
  const continueWithAction = () => {
    console.log('[EyeTrackingRecruit] Ejecutando acción:', pendingAction);
    
    if (pendingAction === 'save') {
      // Ejecutar la acción para guardar
      try {
        const dataToSaveObj = JSON.parse(jsonToSend);
        console.log('[EyeTrackingRecruit] Enviando datos al backend:', dataToSaveObj);
        setSaving(true);
        
        // Usar la API para guardar
        eyeTrackingFixedAPI.saveRecruitConfig(dataToSaveObj)
          .then((response) => {
            console.log('[EyeTrackingRecruit] Respuesta del servidor:', response);
            toast.success('Configuración guardada correctamente');
            setSaving(false);
            // Invalidar las consultas para recargar datos
            queryClient.invalidateQueries({ queryKey: ['eyeTrackingRecruit', researchId] });
          })
          .catch((error: any) => {
            console.error('[EyeTrackingRecruit] Error al guardar configuración:', error);
            
            // Proporcionar un mensaje de error más específico basado en el tipo de error
            let errorMessage = 'Error al guardar la configuración';
            
            if (error.statusCode === 404) {
              errorMessage = `Error 404: API no encontrada. La URL del servicio no existe. Revise la configuración de la API en el backend. ${error.message || ''}`;
            } else if (error.statusCode === 400) {
              errorMessage = `Error 400: Datos de configuración inválidos. Detalles: ${error.message || 'Verifique los campos del formulario.'}`;
            } else if (error.statusCode === 401 || error.statusCode === 403) {
              errorMessage = `Error ${error.statusCode}: No tiene permisos para realizar esta acción. Intente iniciar sesión nuevamente.`;
            } else if (error.message) {
              // Si hay un mensaje específico en el error, usarlo
              errorMessage = `Error: ${error.message}`;
            }
            
            // Mostrar error en la UI
            toast.error(errorMessage);
            
            // También en consola para diagnostico
            console.error(`[EyeTrackingRecruit] Detalle del error: ${JSON.stringify({
              statusCode: error.statusCode,
              message: error.message,
              data: error.data
            }, null, 2)}`);
            
            setSaving(false);
          });
      } catch (error) {
        console.error('[EyeTrackingRecruit] Error al procesar JSON:', error);
        toast.error('Error al procesar los datos del formulario');
        setSaving(false);
      }
    }
    
    // Limpiar el estado del modal
    setShowJsonPreview(false);
    setPendingAction(null);
  };
  
  // Cargar datos (simulado por ahora)
  useEffect(() => {
    // Simular carga de datos
    setTimeout(() => {
      setLoading(false);
    }, 1000);
  }, []);
  
  // Métodos para manipular el formulario
  const handleDemographicChange = useCallback((key: DemographicQuestionKey, value: boolean) => {
    setFormData(prevData => ({
      ...prevData,
      demographicQuestions: {
        ...prevData.demographicQuestions,
        [key]: value
      }
    }));
  }, []);
  
  const handleLinkConfigChange = useCallback((key: LinkConfigKey, value: any) => {
    setFormData(prevData => ({
      ...prevData,
      linkConfig: {
        ...prevData.linkConfig,
        [key]: value
      }
    }));
  }, []);
  
  const handleBacklinkChange = useCallback((key: BacklinkKey, value: string) => {
    setFormData(prevData => ({
      ...prevData,
      backlinks: {
        ...prevData.backlinks,
        [key]: value
      }
    }));
  }, []);
  
  const handleParamOptionChange = useCallback((key: ParameterOptionKey, value: boolean) => {
    setFormData(prevData => ({
      ...prevData,
      parameterOptions: {
        ...prevData.parameterOptions,
        [key]: value
      }
    }));
  }, []);
  
  const setLimitParticipants = useCallback((value: boolean) => {
    setFormData(prevData => ({
      ...prevData,
      participantLimit: {
        ...prevData.participantLimit,
        enabled: value
      }
    }));
  }, []);
  
  const setParticipantLimit = useCallback((value: number) => {
    setFormData(prevData => ({
      ...prevData,
      participantLimit: {
        ...prevData.participantLimit,
        value: value
      }
    }));
  }, []);
  
  const setResearchUrl = useCallback((value: string) => {
    setFormData(prevData => ({
      ...prevData,
      researchUrl: value
    }));
  }, []);
  
  // Acciones
  const saveForm = useCallback(() => {
    if (!isAuthenticated) {
      toast.error('Debe iniciar sesión para guardar configuración');
      return;
    }
    
    if (!researchId) {
      toast.error('ID de investigación inválido');
      return;
    }
    
    // Validaciones adicionales
    if (formData.participantLimit.enabled && formData.participantLimit.value <= 0) {
      toast.error('El límite de participantes debe ser mayor a 0');
      return;
    }
    
    // Validar URL de investigación
    if (!formData.researchUrl.trim()) {
      toast.error('La URL de investigación no puede estar vacía');
      return;
    }

    // Preparar los datos para enviar al backend
    try {
      // Convertir los datos del formulario a formato apropiado para el backend
      const configToSave: EyeTrackingRecruitRequest = {
        researchId,
        config: {
          demographicQuestions: formData.demographicQuestions,
          linkConfig: formData.linkConfig,
          participantLimit: formData.participantLimit,
          backlinks: formData.backlinks,
          researchUrl: formData.researchUrl,
          parameterOptions: formData.parameterOptions
        }
      };
      
      // Guardar en estado para mostrar en el modal
      setJsonToSend(JSON.stringify(configToSave, null, 2));
      setShowJsonPreview(true);
      setPendingAction('save');
      
    } catch (error) {
      console.error('Error al preparar los datos:', error);
      toast.error('Error al preparar los datos del formulario');
    }
  }, [formData, researchId, isAuthenticated]);
  
  const generateRecruitmentLink = useCallback(() => {
    return `https://useremotion.com/link/${researchId}?respondent={participant_id}`;
  }, [researchId]);
  
  const generateQRCode = useCallback(() => {
    const link = generateRecruitmentLink();
    
    // Generar QR (en una aplicación real, podríamos usar una librería como qrcode.react)
    // Aquí simularemos la generación almacenando la URL en el estado
    setQrCodeData(link);
    setShowQRModal(true);
    
    // Aquí es donde normalmente generaríamos el QR con una librería
    // Por ejemplo: const qrCodeSvg = await QRCode.toString(link, { type: 'svg' });
    
    toast.success('Código QR generado correctamente');
  }, [generateRecruitmentLink]);
  
  const copyLinkToClipboard = useCallback(() => {
    const link = generateRecruitmentLink();
    navigator.clipboard.writeText(link);
    toast.success('Enlace copiado al portapapeles');
  }, [generateRecruitmentLink]);
  
  const previewLink = useCallback(() => {
    // Generamos una vista previa interactiva del enlace
    setShowLinkPreview(true);
  }, []);
  
  // Efecto para crear el modal QR
  useEffect(() => {
    if (showQRModal && qrCodeData) {
      // Crear el HTML para el modal QR
      const qrModalHtml = `
        <div id="qrPreviewModal" style="position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; z-index: 9999;">
          <div style="background: white; border-radius: 8px; max-width: 90%; width: 400px; max-height: 90vh; display: flex; flex-direction: column; box-shadow: 0 4px 20px rgba(0,0,0,0.2); overflow: hidden;">
            <div style="display: flex; justify-content: space-between; align-items: center; padding: 16px 24px; border-bottom: 1px solid #e5e7eb;">
              <h2 style="margin: 0; font-size: 18px; font-weight: 600;">Código QR generado</h2>
              <button id="closeQRModal" style="background: none; border: none; cursor: pointer; font-size: 20px; color: #6b7280;">&times;</button>
            </div>
            <div style="padding: 24px; overflow-y: auto; flex-grow: 1; display: flex; flex-direction: column; align-items: center;">
              <p style="margin: 0 0 16px; color: #6b7280; font-size: 14px; text-align: center;">
                Este código QR contiene el enlace de reclutamiento para su investigación.
              </p>
              <div style="width: 250px; height: 250px; background: #f8fafc; display: flex; align-items: center; justify-content: center; margin-bottom: 16px; border: 1px solid #e2e8f0; border-radius: 4px;">
                <!-- Simulación del QR -->
                <svg viewBox="0 0 100 100" width="200" height="200">
                  <rect x="10" y="10" width="80" height="80" fill="#2563eb" fill-opacity="0.1" stroke="#2563eb" stroke-width="2" />
                  <rect x="25" y="25" width="50" height="50" fill="#2563eb" fill-opacity="0.2" stroke="#2563eb" stroke-width="2" />
                  <rect x="35" y="35" width="30" height="30" fill="#2563eb" fill-opacity="0.3" stroke="#2563eb" stroke-width="2" />
                  <text x="50" y="55" font-size="4" text-anchor="middle" fill="#2563eb">QR Code</text>
                </svg>
              </div>
              <p style="margin: 0; font-size: 14px; word-break: break-all; text-align: center; color: #4b5563;">
                ${qrCodeData}
              </p>
            </div>
            <div style="padding: 16px 24px; border-top: 1px solid #e5e7eb; display: flex; justify-content: space-between; gap: 12px;">
              <button id="downloadQRCode" style="background: #f3f4f6; color: #374151; border: 1px solid #d1d5db; border-radius: 6px; padding: 8px 16px; font-weight: 500; cursor: pointer; flex: 1;">Descargar QR</button>
              <button id="closeQRAction" style="background: #3f51b5; color: white; border: none; border-radius: 6px; padding: 8px 16px; font-weight: 500; cursor: pointer; flex: 1;">
                Cerrar
              </button>
            </div>
          </div>
        </div>
      `;
      
      // Crear elemento en el DOM
      const qrModalContainer = document.createElement('div');
      qrModalContainer.innerHTML = qrModalHtml;
      document.body.appendChild(qrModalContainer);
      
      // Configurar eventos
      document.getElementById('closeQRModal')?.addEventListener('click', () => {
        document.body.removeChild(qrModalContainer);
        closeQRModal();
      });
      
      document.getElementById('downloadQRCode')?.addEventListener('click', () => {
        // En una aplicación real, aquí descargaríamos la imagen del QR
        toast.success('Código QR descargado correctamente');
      });
      
      document.getElementById('closeQRAction')?.addEventListener('click', () => {
        document.body.removeChild(qrModalContainer);
        closeQRModal();
      });
      
      // También permitir cerrar haciendo clic fuera del modal
      qrModalContainer.addEventListener('click', (e) => {
        if (e.target === qrModalContainer.firstChild) {
          document.body.removeChild(qrModalContainer);
          closeQRModal();
        }
      });
      
      // Limpiar al desmontar
      return () => {
        if (document.body.contains(qrModalContainer)) {
          document.body.removeChild(qrModalContainer);
        }
      };
    }
  }, [showQRModal, qrCodeData]);
  
  // Efecto para crear el modal de previsualización del enlace
  useEffect(() => {
    if (showLinkPreview) {
      const link = generateRecruitmentLink();
      // Crear HTML para el modal de previsualización
      const previewModalHtml = `
        <div id="linkPreviewModal" style="position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; z-index: 9999;">
          <div style="background: white; border-radius: 8px; max-width: 90%; width: 800px; max-height: 90vh; display: flex; flex-direction: column; box-shadow: 0 4px 20px rgba(0,0,0,0.2); overflow: hidden;">
            <div style="display: flex; justify-content: space-between; align-items: center; padding: 16px 24px; border-bottom: 1px solid #e5e7eb;">
              <h2 style="margin: 0; font-size: 18px; font-weight: 600;">Vista previa del enlace</h2>
              <button id="closeLinkPreviewModal" style="background: none; border: none; cursor: pointer; font-size: 20px; color: #6b7280;">&times;</button>
            </div>
            <div style="padding: 24px; overflow-y: auto; flex-grow: 1;">
              <p style="margin: 0 0 16px; color: #6b7280; font-size: 14px;">
                Esta es una vista previa de cómo se verá el enlace de reclutamiento para los participantes.
              </p>
              
              <!-- Simulación de navegador web -->
              <div style="border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden; margin-bottom: 24px; box-shadow: 0 4px 6px rgba(0,0,0,0.05);">
                <!-- Barra del navegador -->
                <div style="background: #f8fafc; padding: 8px 16px; display: flex; align-items: center; border-bottom: 1px solid #e2e8f0;">
                  <div style="flex-shrink: 0; display: flex; gap: 6px; margin-right: 16px;">
                    <span style="width: 12px; height: 12px; border-radius: 50%; background: #ef4444;"></span>
                    <span style="width: 12px; height: 12px; border-radius: 50%; background: #f59e0b;"></span>
                    <span style="width: 12px; height: 12px; border-radius: 50%; background: #10b981;"></span>
                  </div>
                  <!-- Barra de URL -->
                  <div style="flex-grow: 1; display: flex; align-items: center; background: white; border: 1px solid #e2e8f0; border-radius: 4px; padding: 4px 12px;">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="margin-right: 8px;">
                      <circle cx="12" cy="12" r="10"></circle>
                      <line x1="2" y1="12" x2="22" y2="12"></line>
                      <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path>
                    </svg>
                    <div style="font-family: monospace; font-size: 12px; color: #64748b; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
                      ${link}
                    </div>
                  </div>
                </div>
                
                <!-- Contenido de la página -->
                <div style="padding: 24px; background: white; height: 480px; overflow-y: auto;">
                  <div style="max-width: 600px; margin: 0 auto; font-family: system-ui, -apple-system, sans-serif;">
                    <!-- Logotipo del sitio -->
                    <div style="text-align: center; margin-bottom: 24px;">
                      <div style="display: inline-flex; align-items: center; gap: 10px; margin-bottom: 16px;">
                        <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#2563eb" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                          <circle cx="12" cy="12" r="3"></circle>
                        </svg>
                        <span style="font-size: 20px; font-weight: 600; color: #2563eb;">UserEmotion</span>
                      </div>
                      <div style="font-size: 24px; font-weight: 600; color: #1e293b; margin-bottom: 8px;">Bienvenido/a a nuestra investigación de comportamiento</div>
                      <p style="color: #64748b; margin: 0;">Gracias por participar en nuestro estudio de Eye Tracking</p>
                    </div>
                    
                    <!-- Progreso -->
                    <div style="margin-bottom: 24px;">
                      <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 8px;">
                        <span style="font-size: 14px; color: #64748b;">Progreso</span>
                        <span style="font-size: 14px; font-weight: 500; color: #334155;">Paso 1 de 3</span>
                      </div>
                      <div style="height: 6px; background: #e2e8f0; border-radius: 3px; overflow: hidden;">
                        <div style="height: 100%; width: 33%; background: #3b82f6;"></div>
                      </div>
                    </div>
                    
                    <!-- Información de la investigación -->
                    <div style="margin-bottom: 28px; padding: 16px; background: #f0f9ff; border: 1px solid #bae6fd; border-radius: 8px;">
                      <h3 style="margin: 0 0 12px; font-size: 16px; color: #0369a1;">Información importante</h3>
                      <p style="margin: 0 0 8px; font-size: 14px; color: #0c4a6e;">Esta investigación tiene como objetivo entender cómo los usuarios interactúan con interfaces digitales.</p>
                      <p style="margin: 0; font-size: 14px; color: #0c4a6e;">El estudio tomará aproximadamente <strong>10-15 minutos</strong> en completarse.</p>
                    </div>
                    
                    <!-- Formulario demográfico si está habilitado -->
                    ${demographicQuestionsEnabled ? `
                    <div style="margin-bottom: 32px;">
                      <h3 style="margin: 0 0 16px; font-size: 18px; color: #334155;">Información demográfica</h3>
                      <p style="margin: 0 0 16px; font-size: 14px; color: #64748b;">Por favor, proporcione la siguiente información para ayudarnos a clasificar sus respuestas.</p>
                      
                      <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 20px;">
                        ${formData.demographicQuestions.country ? `
                        <div style="margin-bottom: 16px;">
                          <label style="display: block; font-size: 14px; color: #334155; font-weight: 500; margin-bottom: 4px;">País <span style="color: #ef4444;">*</span></label>
                          <select style="width: 100%; padding: 10px 14px; border: 1px solid #cbd5e1; border-radius: 6px; background: white; font-size: 14px;">
                            <option value="">Seleccione su país</option>
                            <option value="ES">España</option>
                            <option value="MX">México</option>
                            <option value="AR">Argentina</option>
                            <option value="CO">Colombia</option>
                            <option value="CL">Chile</option>
                            <option value="PE">Perú</option>
                          </select>
                        </div>
                        ` : ''}
                        
                        ${formData.demographicQuestions.age ? `
                        <div style="margin-bottom: 16px;">
                          <label style="display: block; font-size: 14px; color: #334155; font-weight: 500; margin-bottom: 4px;">Edad <span style="color: #ef4444;">*</span></label>
                          <select style="width: 100%; padding: 10px 14px; border: 1px solid #cbd5e1; border-radius: 6px; background: white; font-size: 14px;">
                            <option value="">Seleccione su rango de edad</option>
                            <option value="18-24">18-24 años</option>
                            <option value="25-34">25-34 años</option>
                            <option value="35-44">35-44 años</option>
                            <option value="45-54">45-54 años</option>
                            <option value="55-64">55-64 años</option>
                            <option value="65+">65 años o más</option>
                          </select>
                        </div>
                        ` : ''}
                        
                        ${formData.demographicQuestions.gender ? `
                        <div style="margin-bottom: 16px;">
                          <label style="display: block; font-size: 14px; color: #334155; font-weight: 500; margin-bottom: 4px;">Género <span style="color: #ef4444;">*</span></label>
                          <select style="width: 100%; padding: 10px 14px; border: 1px solid #cbd5e1; border-radius: 6px; background: white; font-size: 14px;">
                            <option value="">Seleccione su género</option>
                            <option value="M">Hombre</option>
                            <option value="F">Mujer</option>
                            <option value="O">Otro</option>
                            <option value="P">Prefiero no decirlo</option>
                          </select>
                        </div>
                        ` : ''}
                        
                        ${formData.demographicQuestions.educationLevel ? `
                        <div style="margin-bottom: 16px;">
                          <label style="display: block; font-size: 14px; color: #334155; font-weight: 500; margin-bottom: 4px;">Nivel educativo <span style="color: #ef4444;">*</span></label>
                          <select style="width: 100%; padding: 10px 14px; border: 1px solid #cbd5e1; border-radius: 6px; background: white; font-size: 14px;">
                            <option value="">Seleccione su nivel educativo</option>
                            <option value="1">Educación primaria</option>
                            <option value="2">Educación secundaria</option>
                            <option value="3">Bachillerato</option>
                            <option value="4">Formación profesional</option>
                            <option value="5">Grado universitario</option>
                            <option value="6">Máster/Postgrado</option>
                            <option value="7">Doctorado</option>
                          </select>
                        </div>
                        ` : ''}
                      </div>
                    </div>
                    ` : ''}
                    
                    <!-- Información del dispositivo si está habilitado -->
                    ${formData.parameterOptions.saveDeviceInfo ? `
                    <div style="margin-bottom: 32px;">
                      <h3 style="margin: 0 0 16px; font-size: 16px; color: #334155;">Información del dispositivo</h3>
                      <div style="background: #fef2f2; border: 1px solid #fecaca; border-radius: 8px; padding: 16px;">
                        <div style="display: flex; gap: 12px; align-items: start;">
                          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#b91c1c" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <circle cx="12" cy="12" r="10"></circle>
                            <line x1="12" y1="8" x2="12" y2="12"></line>
                            <line x1="12" y1="16" x2="12.01" y2="16"></line>
                          </svg>
                          <div>
                            <p style="margin: 0 0 8px; font-size: 14px; color: #b91c1c; font-weight: 500;">Se recogerá información de tu dispositivo</p>
                            <p style="margin: 0; font-size: 13px; color: #ef4444;">Esta investigación recopilará datos sobre tu navegador y dispositivo para mejorar la experiencia.</p>
                          </div>
                        </div>
                      </div>
                    </div>
                    ` : ''}
                    
                    <!-- Botones de acción -->
                    <div style="text-align: center; margin-top: 36px;">
                      <button id="previewContinueButton" style="background: #3b82f6; color: white; border: none; padding: 12px 32px; border-radius: 8px; font-weight: 500; cursor: pointer; font-size: 16px; transition: all 0.2s;">
                        Continuar
                      </button>
                      <p style="margin: 8px 0 0; font-size: 13px; color: #94a3b8;">Al continuar, aceptas los términos y condiciones de este estudio.</p>
                    </div>
                  </div>
                </div>
              </div>
              
              <!-- Información adicional -->
              <div style="background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 8px; padding: 16px; color: #166534; margin-top: 20px;">
                <div style="display: flex; gap: 12px; align-items: start;">
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#16a34a" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                    <polyline points="22 4 12 14.01 9 11.01"></polyline>
                  </svg>
                  <div>
                    <p style="margin: 0 0 8px; font-size: 15px; font-weight: 500;">Características activas en esta vista previa:</p>
                    <ul style="margin: 0; padding-left: 20px; font-size: 14px;">
                      ${demographicQuestionsEnabled ? `<li>Recopilación de datos demográficos habilitada</li>` : ''}
                      ${formData.linkConfig.trackLocation ? `<li>Rastreo de ubicación activado</li>` : ''}
                      ${formData.linkConfig.allowMobile ? `<li>Acceso desde dispositivos móviles permitido</li>` : ''}
                      ${formData.participantLimit.enabled ? `<li>Límite de ${formData.participantLimit.value} participantes configurado</li>` : ''}
                      ${formData.parameterOptions.saveDeviceInfo ? `<li>Recopilación de información del dispositivo activada</li>` : ''}
                      ${formData.parameterOptions.saveResponseTimes ? `<li>Registro de tiempos de respuesta activado</li>` : ''}
                      ${formData.parameterOptions.saveUserJourney ? `<li>Seguimiento del recorrido del usuario activado</li>` : ''}
                    </ul>
                  </div>
                </div>
              </div>
            </div>
            <div style="padding: 16px 24px; border-top: 1px solid #e5e7eb; display: flex; justify-content: flex-end; gap: 12px;">
              <button id="openInNewTab" style="background: #f3f4f6; color: #374151; border: 1px solid #d1d5db; border-radius: 6px; padding: 8px 16px; font-weight: 500; cursor: pointer; font-size: 14px;">Abrir en nueva pestaña</button>
              <button id="closeLinkPreviewAction" style="background: #3f51b5; color: white; border: none; border-radius: 6px; padding: 8px 16px; font-weight: 500; cursor: pointer; font-size: 14px;">
                Cerrar
              </button>
            </div>
          </div>
        </div>
      `;
      
      // Crear elemento en el DOM
      const previewModalContainer = document.createElement('div');
      previewModalContainer.innerHTML = previewModalHtml;
      document.body.appendChild(previewModalContainer);
      
      // Configurar eventos
      document.getElementById('closeLinkPreviewModal')?.addEventListener('click', () => {
        document.body.removeChild(previewModalContainer);
        closeLinkPreview();
      });
      
      document.getElementById('openInNewTab')?.addEventListener('click', () => {
        window.open(link, '_blank');
      });
      
      document.getElementById('closeLinkPreviewAction')?.addEventListener('click', () => {
        document.body.removeChild(previewModalContainer);
        closeLinkPreview();
      });
      
      // Añadir interactividad al botón de continuar
      document.getElementById('previewContinueButton')?.addEventListener('click', () => {
        toast.success('En una versión real, esto avanzaría al siguiente paso del estudio');
      });
      
      // También permitir cerrar haciendo clic fuera del modal
      previewModalContainer.addEventListener('click', (e) => {
        if (e.target === previewModalContainer.firstChild) {
          document.body.removeChild(previewModalContainer);
          closeLinkPreview();
        }
      });
      
      // Limpiar al desmontar
      return () => {
        if (document.body.contains(previewModalContainer)) {
          document.body.removeChild(previewModalContainer);
        }
      };
    }
  }, [showLinkPreview, formData, demographicQuestionsEnabled, generateRecruitmentLink]);
  
  return {
    // Estados
    loading,
    saving,
    formData,
    stats,
    
    // Estados para los switches principales
    demographicQuestionsEnabled,
    setDemographicQuestionsEnabled,
    linkConfigEnabled,
    setLinkConfigEnabled,
    
    // Métodos
    handleDemographicChange,
    handleLinkConfigChange,
    handleBacklinkChange,
    handleParamOptionChange,
    setLimitParticipants,
    setParticipantLimit,
    setResearchUrl,
    
    // Acciones
    saveForm,
    generateRecruitmentLink,
    generateQRCode,
    copyLinkToClipboard,
    previewLink,
    
    // Estados del modal JSON
    showJsonPreview,
    jsonToSend,
    closeJsonModal,
    
    // Estados para QR y Preview
    qrCodeData,
    showQRModal,
    closeQRModal,
    showLinkPreview,
    closeLinkPreview
  };
} 