'use client';

import { useState, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';
import { useRouter } from 'next/navigation';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { useErrorLog } from '@/components/utils/ErrorLogger';
import { 
  EyeTrackingRecruitStats,
  DemographicQuestionKeys,
  LinkConfigKeys,
  ParameterOptionKeys,
} from 'shared/interfaces/eyeTrackingRecruit.interface';
import { eyeTrackingFixedAPI } from "@/lib/eye-tracking-api";
import React from 'react';

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
  handleConfirmSave: () => Promise<void>;
  generateRecruitmentLink: () => string;
  generateQRCode: () => void;
  copyLinkToClipboard: () => void;
  
  // Estados para los modales
  modalError: ErrorModalData | null;
  modalVisible: boolean;
  showConfirmModal: boolean;
  apiErrors: {visible: boolean, title: string, message: string} | undefined;
  
  // Métodos para los modales
  closeModal: () => void;
  
  // Nuevos estados para QR
  qrCodeData: string | null;
  showQRModal: boolean;
  closeQRModal: () => void;
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
  const logger = useErrorLog();
  const queryClient = useQueryClient();
  
  // Estados
  const [formData, setFormData] = useState<EyeTrackingRecruitFormData>({
    ...DEFAULT_CONFIG,
    researchId: researchId === 'current' ? '1234' : researchId // Replicando WelcomeScreen: si es 'current', usa un ID real
  });
  const [stats, setStats] = useState<EyeTrackingRecruitStats | null>(DEFAULT_STATS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  // Estados para los switches principales
  const [demographicQuestionsEnabled, setDemographicQuestionsEnabledState] = useState(true);
  const [linkConfigEnabled, setLinkConfigEnabledState] = useState(true);
  
  // Estados para los modales
  const [modalError, setModalError] = useState<ErrorModalData | null>(null);
  const [modalVisible, setModalVisible] = useState<boolean>(false);
  const [showConfirmModal, setShowConfirmModal] = useState<boolean>(false);
  const [apiErrors, setApiErrors] = useState<{visible: boolean, title: string, message: string} | undefined>(undefined);
  
  // Nuevos estados para QR
  const [qrCodeData, setQrCodeData] = useState<string | null>(null);
  const [showQRModal, setShowQRModal] = useState<boolean>(false);
  
  // Cargar configuración existente
  const actualResearchId = researchId === 'current' ? '1234' : researchId;
  const { isLoading: isLoadingConfig } = useQuery({
    queryKey: ['eyeTrackingRecruit', actualResearchId],
    queryFn: async () => {
      try {
        console.log('[useEyeTrackingRecruit] Cargando config para:', actualResearchId);
        const data = await eyeTrackingFixedAPI.getRecruitConfig(actualResearchId);
        console.log('[useEyeTrackingRecruit] Config cargada (respuesta API):', data);
        
        const configData = data?.config; 
        
        if (configData && configData.id) { 
          console.log('[useEyeTrackingRecruit] Datos de configuración encontrados en data.config:', configData);
          setFormData({
            ...configData,
            researchId: actualResearchId 
          });
          
          const hasDemographics = Object.values(configData.demographicQuestions).some(
            (q: any) => q.enabled
          );
          setDemographicQuestionsEnabledState(hasDemographics);
          
          const hasLinkConfig = Object.values(configData.linkConfig).some(value => value);
          setLinkConfigEnabledState(hasLinkConfig);
          
          return configData; 
        } else {
          console.warn('[useEyeTrackingRecruit] La respuesta de la API no contiene configData válido:', data);
          return null;
        }

      } catch (error: any) {
        console.log('[useEyeTrackingRecruit] Error al cargar:', error);
        if (error.statusCode === 404) {
          console.log('[useEyeTrackingRecruit] No hay configuración previa para:', actualResearchId);
          return null;
        }
        toast.error(`Error al cargar configuración: ${error.message || 'Error desconocido'}`);
        throw error;
      }
    },
    enabled: !!actualResearchId
  });
  
  // Actualizar estado de carga cuando termina la consulta
  useEffect(() => {
    if (!isLoadingConfig) {
      setLoading(false);
    }
  }, [isLoadingConfig]);
  
  // Función para validar campos requeridos
  const checkRequiredFields = useCallback(() => {
    const errors: string[] = [];
    
    // Verificar que tenga una URL de investigación
    if (!formData.researchUrl) {
      errors.push('URL de investigación es requerida');
    }
    
    // Verificar campos demográficos marcados como required
    Object.entries(formData.demographicQuestions).forEach(([key, value]) => {
      if (value.enabled && value.required) {
        // Aquí podríamos verificar más condiciones si fuera necesario
      }
    });
    
    // Verificar otras condiciones según sea necesario...
    
    if (errors.length > 0) {
      console.log('[useEyeTrackingRecruit] Errores de validación:', errors);
      return false;
    }
    
    return true;
  }, [formData]);

  // Configuración de la mutación para guardar
  const saveConfigMutation = useMutation({
    mutationFn: async (data: any) => {
      return await eyeTrackingFixedAPI.saveRecruitConfig(data);
    },
    onSuccess: () => {
      toast.success('Configuración guardada correctamente');
      const actualResearchId = researchId === 'current' ? '1234' : researchId;
      queryClient.invalidateQueries({ queryKey: ['eyeTrackingRecruit', actualResearchId] });
    },
    onError: (error: any) => {
      console.error('[useEyeTrackingRecruit] Error en mutación:', error);
      setApiErrors({
        visible: true,
        title: 'Error al guardar',
        message: error.message || 'Ocurrió un error inesperado'
      });
    }
  });
  
  // Handlers para el modal de error
  const closeModal = useCallback(() => {
    setModalVisible(false);
    setModalError(null);
  }, []);
  
  // Función para cerrar el modal QR
  const closeQRModal = useCallback(() => {
    setShowQRModal(false);
  }, []);

  // Función para mostrar un modal
  const showModal = useCallback((data: ErrorModalData) => {
    setModalError(data);
    setModalVisible(true);
  }, []);
  
  // Función para guardar el formulario
  const saveForm = React.useCallback(async () => {
    setLoading(true);
    setApiErrors(undefined);
    
    try {
      // Validamos los datos antes de enviar
      if (checkRequiredFields()) {
        // Mostramos la ventana de confirmación
        setShowConfirmModal(true);
      } else {
        toast.error('Por favor complete todos los campos requeridos');
      }
    } catch (error: any) {
      console.error('[useEyeTrackingRecruit] Error al preparar datos para guardar:', error);
      setApiErrors({
        visible: true,
        title: 'Error al preparar datos',
        message: error.message || 'Ocurrió un error inesperado al preparar los datos para guardar'
      });
    } finally {
      setLoading(false);
    }
  }, [checkRequiredFields]);

  // Función que se ejecuta cuando se confirma el guardado
  const handleConfirmSave = React.useCallback(async () => {
    setLoading(true);
    setShowConfirmModal(false);
    
    try {
      // Preparamos los datos para enviar (exactamente como en WelcomeScreen)
      const actualResearchId = researchId === 'current' ? '1234' : researchId; // Replicando WelcomeScreen
      
      const dataToSave = {
        ...formData,
        researchId: actualResearchId // Usar el ID real, no "current"
      };
      
      console.log('[useEyeTrackingRecruit] Guardando config con ID:', dataToSave.researchId);
      console.log('[useEyeTrackingRecruit] Payload completo:', JSON.stringify(dataToSave, null, 2));
      
      // Enviamos los datos al servidor (igual que WelcomeScreen)
      const result = await saveConfigMutation.mutateAsync(dataToSave);
      console.log('[useEyeTrackingRecruit] Resultado exitoso:', result);
      
    } catch (error: any) {
      console.error('[useEyeTrackingRecruit] Error al guardar:', error);
      
      // Mostrar información detallada del error
      let errorMessage = '';
      if (error.statusCode) {
        errorMessage = `Error ${error.statusCode}: ${error.message || 'Error desconocido'}`;
      } else if (error.message) {
        errorMessage = error.message;
      } else {
        errorMessage = 'Error desconocido al guardar la configuración';
      }
      
      toast.error(`Error: ${errorMessage}`);
      
      // Mostrar el modal de error
      setApiErrors({
        visible: true,
        title: 'Error al guardar',
        message: errorMessage
      });
    } finally {
      setLoading(false);
    }
  }, [formData, saveConfigMutation, researchId]);

  // Actualizar el efecto de demographicQuestionsEnabled
  useEffect(() => {
    if (!demographicQuestionsEnabled) {
      setFormData(prev => ({
        ...prev,
        demographicQuestions: {
          age: { ...prev.demographicQuestions.age, enabled: false },
          country: { ...prev.demographicQuestions.country, enabled: false },
          gender: { ...prev.demographicQuestions.gender, enabled: false },
          educationLevel: { ...prev.demographicQuestions.educationLevel, enabled: false },
          householdIncome: { ...prev.demographicQuestions.householdIncome, enabled: false },
          employmentStatus: { ...prev.demographicQuestions.employmentStatus, enabled: false },
          dailyHoursOnline: { ...prev.demographicQuestions.dailyHoursOnline, enabled: false },
          technicalProficiency: { ...prev.demographicQuestions.technicalProficiency, enabled: false }
        }
      }));
    }
  }, [demographicQuestionsEnabled]);
  
  // Actualizar el efecto de linkConfigEnabled
  useEffect(() => {
    if (!linkConfigEnabled) {
      setFormData(prev => ({
        ...prev,
        linkConfig: {
          allowMobile: false,
          trackLocation: false,
          allowMultipleAttempts: false
        }
      }));
    }
  }, [linkConfigEnabled]);
  
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
    const actualResearchId = researchId === 'current' ? '1234' : researchId;
    return `https://useremotion.com/link/${actualResearchId}?respondent={participant_id}`;
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
  
  // Actualizar el handler de demographicQuestionsEnabled
  const setDemographicQuestionsEnabled = useCallback((enabled: boolean) => {
    if (!enabled) {
      // Desactivar todas las preguntas demográficas
      setFormData(prev => ({
        ...prev,
        demographicQuestions: {
          age: { ...prev.demographicQuestions.age, enabled: false },
          country: { ...prev.demographicQuestions.country, enabled: false },
          gender: { ...prev.demographicQuestions.gender, enabled: false },
          educationLevel: { ...prev.demographicQuestions.educationLevel, enabled: false },
          householdIncome: { ...prev.demographicQuestions.householdIncome, enabled: false },
          employmentStatus: { ...prev.demographicQuestions.employmentStatus, enabled: false },
          dailyHoursOnline: { ...prev.demographicQuestions.dailyHoursOnline, enabled: false },
          technicalProficiency: { ...prev.demographicQuestions.technicalProficiency, enabled: false }
        }
      }));
    }
    setDemographicQuestionsEnabledState(enabled);
  }, []);
  
  // Actualizar el handler de linkConfigEnabled
  const setLinkConfigEnabled = useCallback((enabled: boolean) => {
    if (!enabled) {
      // Desactivar todas las opciones de configuración del enlace
      setFormData(prev => ({
        ...prev,
        linkConfig: {
          allowMobile: false,
          trackLocation: false,
          allowMultipleAttempts: false
        }
      }));
    }
    setLinkConfigEnabledState(enabled);
  }, []);
  
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
    showConfirmModal,
    apiErrors,
    
    // Métodos para los modales
    closeModal,
    
    // Nuevos estados para QR
    qrCodeData,
    showQRModal,
    closeQRModal,
    
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
    handleConfirmSave,
    generateRecruitmentLink,
    generateQRCode,
    copyLinkToClipboard
  };
} 