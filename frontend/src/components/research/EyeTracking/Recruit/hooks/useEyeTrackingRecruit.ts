'use client';

import { useState, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';
import { useRouter } from 'next/navigation';
import { useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/providers/AuthProvider';
import { 
  EyeTrackingRecruitConfig, 
  EyeTrackingRecruitStats, 
  DemographicQuestionKey,
  LinkConfigKey,
  ParameterOptionKey,
  BacklinkKey
} from '@/shared/interfaces/eyeTracking';
import API_CONFIG from '@/config/api.config';
import { eyeTrackingFixedAPI } from '@/lib/eye-tracking-api';

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
    allowMobileDevices: boolean;
    trackLocation: boolean;
    multipleAttempts: boolean;
  };
  participantLimit: {
    enabled: boolean;
    limit: number;
  };
  backlinks: {
    complete: string;
    disqualified: string;
    overquota: string;
  };
  researchUrl: string;
  parameterOptions: {
    parameters: boolean;
    separated: boolean;
    with: boolean;
    comma: boolean;
    keys: boolean;
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
    allowMobileDevices: false,
    trackLocation: true,
    multipleAttempts: false
  },
  participantLimit: {
    enabled: true,
    limit: 50
  },
  backlinks: {
    complete: 'www.useremotion.com/',
    disqualified: 'www.useremotion.com/',
    overquota: 'www.useremotion.com/'
  },
  researchUrl: 'www.useremotion.com/sysgd-jye7467responding={participant_id}',
  parameterOptions: {
    parameters: true,
    separated: true,
    with: true,
    comma: true,
    keys: true
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
  
  // Función para mostrar el modal con JSON
  const showJsonModal = (json: any, action: 'save') => {
    setJsonToSend(JSON.stringify(json, null, 2));
    setPendingAction(action);
    setShowJsonPreview(true);
  };
  
  // Función para cerrar el modal JSON
  const closeJsonModal = () => {
    setShowJsonPreview(false);
    setPendingAction(null);
  };
  
  // Función para continuar con la acción después de mostrar el JSON
  const continueWithAction = () => {
    closeJsonModal();
    
    if (pendingAction === 'save') {
      // Ejecutar la acción para guardar
      try {
        const dataToSaveObj = JSON.parse(jsonToSend);
        console.log('[EyeTrackingRecruit] Enviando datos al backend:', dataToSaveObj);
        setSaving(true);
        
        // Usar la API para guardar
        eyeTrackingFixedAPI.saveRecruitConfig(dataToSaveObj)
          .then(() => {
            toast.success('Configuración guardada correctamente');
            setSaving(false);
            // Invalida las consultas para recargar datos
            queryClient.invalidateQueries({ queryKey: ['eyeTrackingRecruitConfig', researchId] });
          })
          .catch((error: any) => {
            console.error('Error al guardar configuración:', error);
            toast.error('Error al guardar la configuración');
            setSaving(false);
          });
      } catch (error) {
        console.error('[EyeTrackingRecruit] Error al procesar JSON:', error);
        toast.error('Error al procesar los datos del formulario');
      }
    }
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
        limit: value
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
    if (formData.participantLimit.enabled && formData.participantLimit.limit <= 0) {
      toast.error('El límite de participantes debe ser mayor a 0');
      return;
    }
    
    // Validar URL de investigación
    if (!formData.researchUrl.trim()) {
      toast.error('La URL de investigación no puede estar vacía');
      return;
    }
    
    // Mostrar modal JSON antes de guardar
    showJsonModal(formData, 'save');
  }, [formData, researchId, isAuthenticated]);
  
  const generateRecruitmentLink = useCallback(() => {
    return `https://useremotion.com/link/${researchId}`;
  }, [researchId]);
  
  const generateQRCode = useCallback(() => {
    toast.success('QR generado correctamente');
  }, []);
  
  const copyLinkToClipboard = useCallback(() => {
    const link = generateRecruitmentLink();
    navigator.clipboard.writeText(link);
    toast.success('Enlace copiado al portapapeles');
  }, [generateRecruitmentLink]);
  
  const previewLink = useCallback(() => {
    const link = generateRecruitmentLink();
    window.open(link, '_blank');
  }, [generateRecruitmentLink]);
  
  // Crear el elemento modal de JSON para mostrar el código
  useEffect(() => {
    // Solo crear el modal si se va a mostrar
    if (showJsonPreview && jsonToSend) {
      // Crear HTML para el modal
      const modalHtml = `
        <div id="jsonPreviewModal" style="position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; z-index: 9999;">
          <div style="background: white; border-radius: 8px; max-width: 90%; width: 800px; max-height: 90vh; display: flex; flex-direction: column; box-shadow: 0 4px 20px rgba(0,0,0,0.2); overflow: hidden;">
            <div style="display: flex; justify-content: space-between; align-items: center; padding: 16px 24px; border-bottom: 1px solid #e5e7eb;">
              <h2 style="margin: 0; font-size: 18px; font-weight: 600;">JSON a enviar</h2>
              <button id="closeJsonModal" style="background: none; border: none; cursor: pointer; font-size: 20px; color: #6b7280;">&times;</button>
            </div>
            <div style="padding: 24px; overflow-y: auto; flex-grow: 1;">
              <p style="margin: 0 0 16px; color: #6b7280; font-size: 14px;">
                Este es el JSON que se enviará al servidor. Revise los datos antes de continuar.
              </p>
              <pre style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; padding: 12px; overflow: auto; max-height: 400px; font-family: monospace; font-size: 14px; white-space: pre-wrap; word-break: break-word;">${jsonToSend.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</pre>
            </div>
            <div style="padding: 16px 24px; border-top: 1px solid #e5e7eb; display: flex; justify-content: flex-end; gap: 12px;">
              <button id="cancelJsonAction" style="background: #f3f4f6; color: #374151; border: 1px solid #d1d5db; border-radius: 6px; padding: 8px 16px; font-weight: 500; cursor: pointer;">Cancelar</button>
              <button id="continueJsonAction" style="background: #3f51b5; color: white; border: none; border-radius: 6px; padding: 8px 16px; font-weight: 500; cursor: pointer;">
                Guardar
              </button>
            </div>
          </div>
        </div>
      `;
      
      // Crear elemento en el DOM
      const modalContainer = document.createElement('div');
      modalContainer.innerHTML = modalHtml;
      document.body.appendChild(modalContainer);
      
      // Configurar eventos
      document.getElementById('closeJsonModal')?.addEventListener('click', () => {
        document.body.removeChild(modalContainer);
        closeJsonModal();
      });
      
      document.getElementById('cancelJsonAction')?.addEventListener('click', () => {
        document.body.removeChild(modalContainer);
        closeJsonModal();
      });
      
      document.getElementById('continueJsonAction')?.addEventListener('click', () => {
        document.body.removeChild(modalContainer);
        continueWithAction();
      });
      
      // También permitir cerrar haciendo clic fuera del modal
      modalContainer.addEventListener('click', (e) => {
        if (e.target === modalContainer.firstChild) {
          document.body.removeChild(modalContainer);
          closeJsonModal();
        }
      });
      
      // Limpiar al desmontar
      return () => {
        if (document.body.contains(modalContainer)) {
          document.body.removeChild(modalContainer);
        }
      };
    }
  }, [showJsonPreview, jsonToSend, pendingAction]);
  
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
    closeJsonModal
  };
} 