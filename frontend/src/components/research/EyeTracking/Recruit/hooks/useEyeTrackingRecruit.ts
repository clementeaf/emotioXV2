'use client';

import { useState, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';
import { useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/providers/AuthProvider';
import { 
  EyeTrackingRecruitConfig,
  EyeTrackingRecruitStats,
  DemographicQuestionKeys,
  LinkConfigKeys,
  ParameterOptionKeys,
  CreateEyeTrackingRecruitRequest,
  LinkConfig,
  ParticipantLimit,
  Backlinks,
  ParameterOptions,
  DemographicQuestions
} from 'shared/interfaces/eyeTrackingRecruit.interface';
import API_CONFIG from '@/config/api.config';
import { eyeTrackingFixedAPI } from "@/lib/eye-tracking-api";

// Interfaces
interface ErrorModalData {
  title: string;
  message: string | React.ReactNode;
  type: 'error' | 'info' | 'success';
}

interface UseEyeTrackingRecruitProps {
  researchId: string;
}

// Definición de interfaces para datos del formulario
interface EyeTrackingRecruitFormData {
  id?: string;
  researchId: string;
  demographicQuestions: {
    age: {
      enabled: boolean;
      required: boolean;
      options?: string[];
    };
    country: {
      enabled: boolean;
      required: boolean;
      options?: string[];
    };
    gender: {
      enabled: boolean;
      required: boolean;
      options?: string[];
    };
    educationLevel: {
      enabled: boolean;
      required: boolean;
      options?: string[];
    };
    householdIncome: {
      enabled: boolean;
      required: boolean;
      options?: string[];
    };
    employmentStatus: {
      enabled: boolean;
      required: boolean;
      options?: string[];
    };
    dailyHoursOnline: {
      enabled: boolean;
      required: boolean;
      options?: string[];
    };
    technicalProficiency: {
      enabled: boolean;
      required: boolean;
      options?: string[];
    };
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
  handleDemographicChange: (key: DemographicQuestionKeys, value: boolean) => void;
  handleDemographicRequired: (key: DemographicQuestionKeys, required: boolean) => void;
  handleLinkConfigChange: (key: LinkConfigKeys, value: any) => void;
  handleBacklinkChange: (key: string, value: any) => void;
  handleParamOptionChange: (key: ParameterOptionKeys, value: boolean) => void;
  setLimitParticipants: (value: boolean) => void;
  setParticipantLimit: (value: number) => void;
  setResearchUrl: (value: string) => void;
  
  // Acciones
  saveForm: () => void;
  generateRecruitmentLink: () => string;
  generateQRCode: () => void;
  copyLinkToClipboard: () => void;
  previewLink: () => void;
  
  // Estados para los modales
  modalError: ErrorModalData | null;
  modalVisible: boolean;
  showJsonPreview: boolean;
  jsonToSend: string;
  pendingAction: 'save' | 'preview' | null;
  
  // Métodos para los modales
  closeModal: () => void;
  closeJsonModal: () => void;
  continueWithAction: () => void;
  
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
    percentage: 0
  },
  disqualified: {
    count: 0,
    percentage: 0
  },
  overquota: {
    count: 0,
    percentage: 0
  }
};

const DEFAULT_CONFIG: EyeTrackingRecruitFormData = {
  researchId: '',
  demographicQuestions: {
    age: {
      enabled: false,
      required: false,
      options: ['18-24', '25-34', '35-44', '45-54', '55-64', '65+']
    },
    country: {
      enabled: false,
      required: false,
      options: ['ES', 'MX', 'AR', 'CO', 'CL', 'PE']
    },
    gender: {
      enabled: false,
      required: false,
      options: ['M', 'F', 'O', 'P']
    },
    educationLevel: {
      enabled: false,
      required: false,
      options: ['1', '2', '3', '4', '5', '6', '7']
    },
    householdIncome: {
      enabled: false,
      required: false,
      options: ['1', '2', '3', '4', '5']
    },
    employmentStatus: {
      enabled: false,
      required: false,
      options: ['employed', 'unemployed', 'student', 'retired']
    },
    dailyHoursOnline: {
      enabled: false,
      required: false,
      options: ['0-2', '2-4', '4-6', '6-8', '8+']
    },
    technicalProficiency: {
      enabled: false,
      required: false,
      options: ['beginner', 'intermediate', 'advanced', 'expert']
    }
  },
  linkConfig: {
    allowMobile: false,
    trackLocation: false,
    allowMultipleAttempts: false
  },
  participantLimit: {
    enabled: false,
    value: 50
  },
  backlinks: {
    complete: '',
    disqualified: '',
    overquota: ''
  },
  researchUrl: '',
  parameterOptions: {
    saveDeviceInfo: false,
    saveLocationInfo: false,
    saveResponseTimes: false,
    saveUserJourney: false
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
  
  // Estados para los switches principales
  const [demographicQuestionsEnabled, setDemographicQuestionsEnabled] = useState(true);
  const [linkConfigEnabled, setLinkConfigEnabled] = useState(true);
  
  // Estados para los modales
  const [modalError, setModalError] = useState<ErrorModalData | null>(null);
  const [modalVisible, setModalVisible] = useState<boolean>(false);
  const [showJsonPreview, setShowJsonPreview] = useState<boolean>(false);
  const [jsonToSend, setJsonToSend] = useState<string>('');
  const [pendingAction, setPendingAction] = useState<'save' | 'preview' | null>(null);
  
  // Nuevos estados para QR y Preview
  const [qrCodeData, setQrCodeData] = useState<string | null>(null);
  const [showQRModal, setShowQRModal] = useState<boolean>(false);
  const [showLinkPreview, setShowLinkPreview] = useState<boolean>(false);
  
  // Handlers para el modal de error
  const closeModal = useCallback(() => setModalVisible(false), []);
  const showModal = useCallback((errorData: ErrorModalData) => {
    setModalError(errorData);
    setModalVisible(true);
  }, []);
  
  // Función para cerrar el modal JSON
  const closeJsonModal = useCallback(() => {
    setShowJsonPreview(false);
    setPendingAction(null);
    setJsonToSend('');
    console.log('[useEyeTrackingRecruit] Modal JSON cerrado');
  }, []);
  
  // Función para cerrar el modal QR
  const closeQRModal = useCallback(() => {
    setShowQRModal(false);
  }, []);
  
  // Función para cerrar la vista previa del enlace
  const closeLinkPreview = useCallback(() => {
    setShowLinkPreview(false);
  }, []);
  
  // Función para mostrar el modal con JSON
  const showJsonModal = useCallback((json: any, action: 'save' | 'preview') => {
    try {
      const stringifiedJson = JSON.stringify(json, null, 2);
      JSON.parse(stringifiedJson); // Verificar que sea un JSON válido
      
      setJsonToSend(stringifiedJson);
      setPendingAction(action);
      setShowJsonPreview(true);
      
      console.log(`[useEyeTrackingRecruit] Mostrando modal JSON para acción: ${action}`);
      console.log('[useEyeTrackingRecruit] JSON válido:', stringifiedJson);
    } catch (error) {
      console.error('[useEyeTrackingRecruit] Error al procesar JSON:', error);
      showModal({
        title: 'Error al procesar datos',
        message: 'Los datos no tienen un formato JSON válido. Por favor, revise la estructura de los datos.',
        type: 'error'
      });
    }
  }, [showModal]);
  
  // Mutación para guardar datos
  const { mutate } = useMutation({
    mutationFn: async (data: CreateEyeTrackingRecruitRequest) => {
      try {
        if (!isAuthenticated) {
          throw new Error('No autenticado: Se requiere un token de autenticación');
        }
        
        console.log('[useEyeTrackingRecruit] Enviando datos al backend:', data);
        return await eyeTrackingFixedAPI.saveRecruitConfig(data);
      } catch (error: any) {
        console.error('[useEyeTrackingRecruit] Error al guardar:', error);
        throw error;
      }
    },
    onSuccess: (response) => {
      console.log('[useEyeTrackingRecruit] Guardado exitoso:', response);
      toast.success('Configuración guardada correctamente');
      
      // Invalidar queries para recargar datos
      queryClient.invalidateQueries({ queryKey: ['eyeTrackingRecruit', researchId] });
    },
    onError: (error: any) => {
      console.error('[useEyeTrackingRecruit] Error en mutación:', error);
      
      let errorMessage = 'Error al guardar la configuración';
      if (error.statusCode === 404) {
        errorMessage = 'Error 404: API no encontrada';
      } else if (error.statusCode === 400) {
        errorMessage = `Error 400: Datos inválidos - ${error.message || ''}`;
      } else if (error.statusCode === 401 || error.statusCode === 403) {
        errorMessage = 'Error de autenticación: Inicie sesión nuevamente';
      } else if (error.message) {
        errorMessage = `Error: ${error.message}`;
      }
      
      showModal({
        title: 'Error al guardar',
        message: errorMessage,
        type: 'error'
      });
      
      toast.error(errorMessage);
    }
  });

  // Función para guardar el formulario
  const saveForm = useCallback(() => {
    try {
      if (!isAuthenticated) {
        toast.error('Debe iniciar sesión para guardar configuración');
        return;
      }

      if (!researchId) {
        toast.error('ID de investigación inválido');
        return;
      }

      // Validaciones
      if (formData.participantLimit.enabled && formData.participantLimit.value <= 0) {
        toast.error('El límite de participantes debe ser mayor a 0');
        return;
      }

      if (!formData.researchUrl.trim()) {
        toast.error('La URL de investigación no puede estar vacía');
        return;
      }

      // Preparar datos para mostrar en el modal
      const configToSave: CreateEyeTrackingRecruitRequest = {
        researchId,
        demographicQuestions: formData.demographicQuestions,
        linkConfig: {
          allowMobile: formData.linkConfig.allowMobile,
          trackLocation: formData.linkConfig.trackLocation,
          allowMultipleAttempts: formData.linkConfig.allowMultipleAttempts
        },
        participantLimit: {
          enabled: formData.participantLimit.enabled,
          value: formData.participantLimit.value
        },
        backlinks: formData.backlinks,
        researchUrl: formData.researchUrl,
        parameterOptions: formData.parameterOptions
      };

      // Mostrar modal con JSON
      showJsonModal(configToSave, 'save');
    } catch (error) {
      console.error('[useEyeTrackingRecruit] Error al preparar datos:', error);
      showModal({
        title: 'Error al preparar datos',
        message: 'Ocurrió un error al preparar los datos para guardar.',
        type: 'error'
      });
    }
  }, [formData, researchId, isAuthenticated, showJsonModal, showModal]);
  
  // Función para previsualizar el enlace
  const previewLink = useCallback(() => {
    try {
      const dataToPreview = {
        ...formData,
        researchId
      };
      
      // Mostrar modal de confirmación con JSON
      showJsonModal(dataToPreview, 'preview');
    } catch (error) {
      console.error('[useEyeTrackingRecruit] Error al preparar datos para previsualizar:', error);
      showModal({
        title: 'Error al previsualizar',
        message: 'Ocurrió un error al preparar los datos para la previsualización.',
        type: 'error'
      });
    }
  }, [formData, researchId, showModal]);
  
  // Función para continuar con la acción después de mostrar el JSON
  const continueWithAction = useCallback(() => {
    if (!pendingAction) return;

    try {
      const data = JSON.parse(jsonToSend);
      console.log('[useEyeTrackingRecruit] Ejecutando acción:', pendingAction);

      if (pendingAction === 'save') {
        setSaving(true);
        mutate(data);
      } else if (pendingAction === 'preview') {
        setShowLinkPreview(true);
      }
    } catch (error) {
      console.error('[useEyeTrackingRecruit] Error al procesar JSON:', error);
      showModal({
        title: 'Error al procesar datos',
        message: 'Los datos no tienen un formato JSON válido.',
        type: 'error'
      });
    } finally {
      closeJsonModal();
      setSaving(false);
    }
  }, [pendingAction, jsonToSend, showModal, closeJsonModal, mutate]);
  
  // Cargar datos (simulado por ahora)
  useEffect(() => {
    // Simular carga de datos
    setTimeout(() => {
      setLoading(false);
    }, 1000);
  }, []);
  
  // Métodos para manipular el formulario
  const handleDemographicChange = useCallback((key: DemographicQuestionKeys, value: boolean) => {
    setFormData(prevData => ({
      ...prevData,
      demographicQuestions: {
        ...prevData.demographicQuestions,
        [key]: {
          ...prevData.demographicQuestions[key],
          enabled: value,
          required: value // Por defecto, si está habilitado, es requerido
        }
      }
    }));
  }, []);
  
  // Nuevo método para manejar el cambio de required en preguntas demográficas
  const handleDemographicRequired = useCallback((key: DemographicQuestionKeys, required: boolean) => {
    setFormData(prevData => ({
      ...prevData,
      demographicQuestions: {
        ...prevData.demographicQuestions,
        [key]: {
          ...prevData.demographicQuestions[key],
          required
        }
      }
    }));
  }, []);
  
  const handleLinkConfigChange = useCallback((key: LinkConfigKeys, value: any) => {
    setFormData(prevData => ({
      ...prevData,
      linkConfig: {
        ...prevData.linkConfig,
        [key]: value
      }
    }));
  }, []);
  
  const handleBacklinkChange = useCallback((key: string, value: string) => {
    setFormData(prevData => ({
      ...prevData,
      backlinks: {
        ...prevData.backlinks,
        [key]: value
      }
    }));
  }, []);
  
  const handleParamOptionChange = useCallback((key: ParameterOptionKeys, value: boolean) => {
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
                      <p style="margin: 0 0 8px; font-size: 14px; color: #0c4a6e;">El estudio tomará aproximadamente <strong>10-15 minutos</strong> en completarse.</p>
                      ${formData.researchUrl ? `
                      <p style="margin: 8px 0 0; font-size: 14px; color: #0c4a6e;">
                        <strong>URL del estudio:</strong> <a href="${formData.researchUrl}" target="_blank" style="color: #2563eb; text-decoration: none;">${formData.researchUrl}</a>
                      </p>
                      ` : ''}
                    </div>

                    <!-- Enlaces de retorno si están configurados -->
                    ${Object.entries(formData.backlinks).some(([_, value]) => value) ? `
                    <div style="margin-bottom: 28px; padding: 16px; background: #fef3c7; border: 1px solid #fcd34d; border-radius: 8px;">
                      <h3 style="margin: 0 0 12px; font-size: 16px; color: #92400e;">Enlaces de retorno</h3>
                      ${formData.backlinks.complete ? `
                      <p style="margin: 0 0 8px; font-size: 14px; color: #92400e;">
                        <strong>Al completar:</strong> <a href="${formData.backlinks.complete}" target="_blank" style="color: #2563eb; text-decoration: none;">${formData.backlinks.complete}</a>
                      </p>
                      ` : ''}
                      ${formData.backlinks.disqualified ? `
                      <p style="margin: 0 0 8px; font-size: 14px; color: #92400e;">
                        <strong>Si es descalificado:</strong> <a href="${formData.backlinks.disqualified}" target="_blank" style="color: #2563eb; text-decoration: none;">${formData.backlinks.disqualified}</a>
                      </p>
                      ` : ''}
                      ${formData.backlinks.overquota ? `
                      <p style="margin: 0; font-size: 14px; color: #92400e;">
                        <strong>Si se excede la cuota:</strong> <a href="${formData.backlinks.overquota}" target="_blank" style="color: #2563eb; text-decoration: none;">${formData.backlinks.overquota}</a>
                      </p>
                      ` : ''}
                    </div>
                    ` : ''}
                    
                    <!-- Formulario demográfico si está habilitado -->
                    ${demographicQuestionsEnabled ? `
                    <div style="margin-bottom: 32px;">
                      <h3 style="margin: 0 0 16px; font-size: 18px; color: #334155;">Información demográfica</h3>
                      <p style="margin: 0 0 16px; font-size: 14px; color: #64748b;">Por favor, proporcione la siguiente información para ayudarnos a clasificar sus respuestas.</p>
                      
                      <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 20px;">
                        ${Object.entries(formData.demographicQuestions).map(([key, value]) => value.enabled ? `
                        <div style="margin-bottom: 16px;">
                          <label style="display: block; font-size: 14px; color: #334155; font-weight: 500; margin-bottom: 4px;">
                            ${key === 'age' ? 'Edad' :
                              key === 'country' ? 'País' :
                              key === 'gender' ? 'Género' :
                              key === 'educationLevel' ? 'Nivel educativo' :
                              key === 'householdIncome' ? 'Ingresos del hogar' :
                              key === 'employmentStatus' ? 'Situación laboral' :
                              key === 'dailyHoursOnline' ? 'Horas diarias en línea' :
                              key === 'technicalProficiency' ? 'Nivel técnico' :
                              key.charAt(0).toUpperCase() + key.slice(1).replace(/([A-Z])/g, ' $1')}
                            ${value.required ? '<span style="color: #ef4444;">*</span>' : ''}
                          </label>
                          <select style="width: 100%; padding: 10px 14px; border: 1px solid #cbd5e1; border-radius: 6px; background: white; font-size: 14px;">
                            <option value="">Seleccione una opción</option>
                            ${value.options?.map(opt => `<option value="${opt}">${getOptionLabel(key, opt)}</option>`).join('')}
                          </select>
                          ${!value.required ? '<p style="margin: 4px 0 0; font-size: 12px; color: #6b7280;">Opcional</p>' : ''}
                        </div>
                        ` : '').join('')}
                      </div>
                    </div>
                    ` : ''}
                    
                    <!-- Configuración del enlace -->
                    ${linkConfigEnabled ? `
                    <div style="margin-bottom: 32px;">
                      <h3 style="margin: 0 0 16px; font-size: 18px; color: #334155;">Configuración del estudio</h3>
                      <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 20px;">
                        ${formData.linkConfig.allowMobile ? `
                        <div style="margin-bottom: 12px; padding: 8px 12px; background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 6px;">
                          <p style="margin: 0; font-size: 14px; color: #166534;">✓ Este estudio es compatible con dispositivos móviles</p>
                        </div>
                        ` : `
                        <div style="margin-bottom: 12px; padding: 8px 12px; background: #fef2f2; border: 1px solid #fecaca; border-radius: 6px;">
                          <p style="margin: 0; font-size: 14px; color: #991b1b;">✕ Este estudio no es compatible con dispositivos móviles</p>
                        </div>
                        `}
                        
                        ${formData.linkConfig.trackLocation ? `
                        <div style="margin-bottom: 12px; padding: 8px 12px; background: #fff7ed; border: 1px solid #fed7aa; border-radius: 6px;">
                          <p style="margin: 0; font-size: 14px; color: #9a3412;">ℹ️ Se solicitará acceso a tu ubicación</p>
                        </div>
                        ` : ''}
                        
                        ${formData.linkConfig.allowMultipleAttempts ? `
                        <div style="padding: 8px 12px; background: #f0f9ff; border: 1px solid #bae6fd; border-radius: 6px;">
                          <p style="margin: 0; font-size: 14px; color: #0369a1;">ℹ️ Puedes participar múltiples veces en este estudio</p>
                        </div>
                        ` : ''}
                      </div>
                    </div>
                    ` : ''}

                    <!-- Parámetros adicionales -->
                    <div style="margin-bottom: 32px;">
                      <h3 style="margin: 0 0 16px; font-size: 18px; color: #334155;">Información adicional</h3>
                      <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 20px;">
                        ${formData.participantLimit.enabled ? `
                        <div style="margin-bottom: 12px; padding: 8px 12px; background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 6px;">
                          <p style="margin: 0; font-size: 14px; color: #166534;">
                            ℹ️ Este estudio está limitado a ${formData.participantLimit.value} participantes
                          </p>
                        </div>
                        ` : ''}

                        ${Object.entries(formData.parameterOptions).map(([key, value]) => value ? `
                        <div style="margin-bottom: 12px; padding: 8px 12px; background: #fff7ed; border: 1px solid #fed7aa; border-radius: 6px;">
                          <p style="margin: 0; font-size: 14px; color: #9a3412;">
                            ℹ️ ${key === 'saveDeviceInfo' ? 'Se recopilará información de tu dispositivo' :
                                key === 'saveLocationInfo' ? 'Se guardará información de tu ubicación' :
                                key === 'saveResponseTimes' ? 'Se registrarán tus tiempos de respuesta' :
                                'Se registrará tu recorrido durante el estudio'}
                          </p>
                        </div>
                        ` : '').join('')}
                      </div>
                    </div>

                    <!-- Botones de acción -->
                    <div style="text-align: center; margin-top: 36px;">
                      <button id="previewContinueButton" style="background: #3b82f6; color: white; border: none; padding: 12px 32px; border-radius: 8px; font-weight: 500; cursor: pointer; font-size: 16px; transition: all 0.2s;">
                        Continuar
                      </button>
                      <p style="margin: 8px 0 0; font-size: 13px; color: #94a3b8;">
                        Al continuar, aceptas los términos y condiciones de este estudio${formData.parameterOptions.saveDeviceInfo || formData.parameterOptions.saveLocationInfo ? 
                        ' y la recopilación de datos mencionada anteriormente' : ''}.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
              
              <!-- Resumen de configuración -->
              <div style="background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 8px; padding: 16px; color: #166534; margin-top: 20px;">
                <div style="display: flex; gap: 12px; align-items: start;">
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#16a34a" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                    <polyline points="22 4 12 14.01 9 11.01"></polyline>
                  </svg>
                  <div>
                    <p style="margin: 0 0 8px; font-size: 15px; font-weight: 500;">Resumen de configuración:</p>
                    <ul style="margin: 0; padding-left: 20px; font-size: 14px;">
                      <li style="margin-bottom: 8px;">Preguntas demográficas:
                        <ul style="margin-top: 4px;">
                          ${Object.entries(formData.demographicQuestions)
                            .filter(([_, value]) => value.enabled)
                            .map(([key, value]) => `
                              <li>${key.charAt(0).toUpperCase() + key.slice(1).replace(/([A-Z])/g, ' $1')} 
                                ${value.required ? '(Requerido)' : '(Opcional)'}</li>
                            `).join('')}
                        </ul>
                      </li>
                      <li style="margin-bottom: 8px;">Configuración del enlace:
                        <ul style="margin-top: 4px;">
                          <li>Dispositivos móviles: ${formData.linkConfig.allowMobile ? 'Permitidos' : 'No permitidos'}</li>
                          <li>Rastreo de ubicación: ${formData.linkConfig.trackLocation ? 'Activado' : 'Desactivado'}</li>
                          <li>Múltiples intentos: ${formData.linkConfig.allowMultipleAttempts ? 'Permitidos' : 'No permitidos'}</li>
                        </ul>
                      </li>
                      ${formData.participantLimit.enabled ? `
                      <li style="margin-bottom: 8px;">Límite de participantes: ${formData.participantLimit.value}</li>
                      ` : ''}
                      <li>Recopilación de datos:
                        <ul style="margin-top: 4px;">
                          ${Object.entries(formData.parameterOptions)
                            .filter(([_, value]) => value)
                            .map(([key, _]) => `
                              <li>${
                                key === 'saveDeviceInfo' ? 'Información del dispositivo' :
                                key === 'saveLocationInfo' ? 'Información de ubicación' :
                                key === 'saveResponseTimes' ? 'Tiempos de respuesta' :
                                'Recorrido del usuario'
                              }</li>
                            `).join('')}
                        </ul>
                      </li>
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
  
  const getOptionLabel = (key: string, value: string) => {
    const labels: { [key: string]: { [key: string]: string } } = {
      age: {
        '18-24': '18-24 años',
        '25-34': '25-34 años',
        '35-44': '35-44 años',
        '45-54': '45-54 años',
        '55-64': '55-64 años',
        '65+': '65 años o más'
      },
      country: {
        'ES': 'España',
        'MX': 'México',
        'AR': 'Argentina',
        'CO': 'Colombia',
        'CL': 'Chile',
        'PE': 'Perú'
      },
      gender: {
        'M': 'Masculino',
        'F': 'Femenino',
        'O': 'Otro',
        'P': 'Prefiero no decirlo'
      },
      educationLevel: {
        '1': 'Educación primaria',
        '2': 'Educación secundaria',
        '3': 'Bachillerato',
        '4': 'Formación profesional',
        '5': 'Grado universitario',
        '6': 'Máster/Postgrado',
        '7': 'Doctorado'
      },
      householdIncome: {
        '1': 'Menos de 20.000€',
        '2': '20.000€ - 40.000€',
        '3': '40.000€ - 60.000€',
        '4': '60.000€ - 80.000€',
        '5': 'Más de 80.000€'
      },
      employmentStatus: {
        'employed': 'Empleado',
        'unemployed': 'Desempleado',
        'student': 'Estudiante',
        'retired': 'Jubilado'
      },
      dailyHoursOnline: {
        '0-2': '0-2 horas',
        '2-4': '2-4 horas',
        '4-6': '4-6 horas',
        '6-8': '6-8 horas',
        '8+': 'Más de 8 horas'
      },
      technicalProficiency: {
        'beginner': 'Principiante',
        'intermediate': 'Intermedio',
        'advanced': 'Avanzado',
        'expert': 'Experto'
      }
    };

    return labels[key]?.[value] || value;
  };
  
  return {
    // Estados del formulario
    loading,
    saving,
    formData,
    stats,
    
    // Estados para los switches principales
    demographicQuestionsEnabled,
    setDemographicQuestionsEnabled,
    linkConfigEnabled,
    setLinkConfigEnabled,
    
    // Estados para los modales
    modalError,
    modalVisible,
    showJsonPreview,
    jsonToSend,
    pendingAction,
    
    // Métodos para los modales
    closeModal,
    closeJsonModal,
    continueWithAction,
    
    // Nuevos estados para QR y Preview
    qrCodeData,
    showQRModal,
    closeQRModal,
    showLinkPreview,
    closeLinkPreview,
    
    // Métodos del formulario
    handleDemographicChange,
    handleDemographicRequired,
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
    previewLink
  };
} 