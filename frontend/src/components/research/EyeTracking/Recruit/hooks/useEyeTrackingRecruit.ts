'use client';

import { useState, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';
import { useRouter } from 'next/navigation';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useErrorLog } from '@/components/utils/ErrorLogger';
import { 
  EyeTrackingRecruitStats,
  DemographicQuestionKeys,
  LinkConfigKeys,
  ParameterOptionKeys,
  CreateEyeTrackingRecruitRequest,
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
  generateRecruitmentLink: () => string;
  generateQRCode: () => void;
  copyLinkToClipboard: () => void;
  
  // Estados para los modales
  modalError: ErrorModalData | null;
  modalVisible: boolean;
  
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
    researchId
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
  
  // Nuevos estados para QR
  const [qrCodeData, setQrCodeData] = useState<string | null>(null);
  const [showQRModal, setShowQRModal] = useState<boolean>(false);
  
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
  
  // Mutación para guardar datos
  const { mutate } = useMutation({
    mutationFn: async (data: CreateEyeTrackingRecruitRequest) => {
      try {
        console.log('[useEyeTrackingRecruit] Enviando datos al backend:', data);
        return await eyeTrackingFixedAPI.saveRecruitConfig(data);
      } catch (error: any) {
        console.error('[useEyeTrackingRecruit] Error al guardar:', error);
        throw error;
      }
    },
    onSuccess: (response) => {
      console.log('[useEyeTrackingRecruit] Guardado exitoso:', response);
      toast.success('Configuración guardada correctamente', {
        duration: 4000,
        style: {
          background: '#10b981',
          color: '#fff',
          fontWeight: 'bold'
        },
        icon: '✅'
      });
      
      // Invalidar queries para recargar datos
      queryClient.invalidateQueries({ queryKey: ['eyeTrackingRecruit', researchId] });
      
      // Restablecer el estado de guardado
      setTimeout(() => setSaving(false), 300);
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
      
      // Restablecer el estado de guardado
      setSaving(false);
    },
    onSettled: () => {
      // Asegurar que siempre se restablezca el estado de guardado, independientemente del resultado
      setSaving(false);
    }
  });

  // Función para guardar el formulario
  const saveForm = useCallback(() => {
    try {
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

      // Preparar datos para enviar
      const linkConfigData = {
        allowMobile: formData.linkConfig.allowMobile,
        allowMobileDevices: formData.linkConfig.allowMobile, // Para compatibilidad con la API
        trackLocation: formData.linkConfig.trackLocation,
        allowMultipleAttempts: formData.linkConfig.allowMultipleAttempts
      };
      
      const configToSave: CreateEyeTrackingRecruitRequest = {
        researchId,
        demographicQuestions: formData.demographicQuestions,
        linkConfig: linkConfigData,
        participantLimit: {
          enabled: formData.participantLimit.enabled,
          value: formData.participantLimit.value
        },
        backlinks: formData.backlinks,
        researchUrl: formData.researchUrl,
        parameterOptions: formData.parameterOptions
      };

      // Mostrar modal de confirmación con los datos
      const confirmModalContainer = document.createElement('div');
      confirmModalContainer.innerHTML = `
        <div style="position: fixed; inset: 0; background-color: rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; z-index: 9999; font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
          <div style="background: white; border-radius: 12px; max-width: 90%; width: 650px; max-height: 90vh; display: flex; flex-direction: column; box-shadow: 0 8px 30px rgba(0,0,0,0.12); overflow: hidden; animation: fadeIn 0.2s ease-out;">
            <div style="display: flex; justify-content: space-between; align-items: center; padding: 20px 24px; border-bottom: 1px solid #f1f1f1;">
              <h2 style="margin: 0; font-size: 24px; font-weight: 600; color: #111827;">Confirmar configuración</h2>
              <button id="closeConfirmModal" style="background: none; border: none; cursor: pointer; width: 32px; height: 32px; display: flex; align-items: center; justify-content: center; color: #6b7280; border-radius: 50%; transition: background-color 0.2s; font-size: 24px;">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              </button>
            </div>
            <div style="padding: 24px; overflow-y: auto; max-height: 60vh;">
              <p style="margin: 0 0 24px; color: #4b5563; font-size: 16px;">¿Estás seguro de que deseas guardar la siguiente configuración?</p>
              
              <div style="margin-bottom: 24px;">
                <h3 style="font-size: 18px; margin: 0 0 12px; color: #111827; font-weight: 600;">Preguntas demográficas</h3>
                <div style="background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 8px; padding: 16px;">
                  ${demographicQuestionsEnabled ? 
                    (Object.entries(formData.demographicQuestions)
                      .filter(([_, value]) => value.enabled)
                      .map(([key, _]) => `
                        <div style="padding: 8px 0; color: #4b5563; display: flex; align-items: center;">
                          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#4d7c0f" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="margin-right: 8px;">
                            <circle cx="12" cy="12" r="10"></circle>
                            <path d="M8 12l2 2 6-6"></path>
                          </svg>
                          ${key}
                        </div>
                      `).join('') || '<div style="color: #6b7280; padding: 8px 0;">No se han seleccionado preguntas demográficas</div>'
                    ) : '<div style="color: #ef4444; padding: 8px 0; display: flex; align-items: center;"><svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="margin-right: 8px;"><circle cx="12" cy="12" r="10"></circle><line x1="15" y1="9" x2="9" y2="15"></line><line x1="9" y1="9" x2="15" y2="15"></line></svg>Preguntas demográficas desactivadas</div>'
                  }
                </div>
              </div>

              <div style="margin-bottom: 24px;">
                <h3 style="font-size: 18px; margin: 0 0 12px; color: #111827; font-weight: 600;">Configuración del enlace</h3>
                <div style="background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 8px; padding: 16px;">
                  ${linkConfigEnabled ?
                    (Object.entries(formData.linkConfig)
                      .filter(([_, value]) => value)
                      .map(([key, _]) => `
                        <div style="padding: 8px 0; color: #4b5563; display: flex; align-items: center;">
                          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#4d7c0f" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="margin-right: 8px;">
                            <circle cx="12" cy="12" r="10"></circle>
                            <path d="M8 12l2 2 6-6"></path>
                          </svg>
                          ${key}
                        </div>
                      `).join('') || '<div style="color: #6b7280; padding: 8px 0;">No se ha configurado ninguna opción</div>'
                    ) : '<div style="color: #ef4444; padding: 8px 0; display: flex; align-items: center;"><svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="margin-right: 8px;"><circle cx="12" cy="12" r="10"></circle><line x1="15" y1="9" x2="9" y2="15"></line><line x1="9" y1="9" x2="15" y2="15"></line></svg>Configuración del enlace desactivada</div>'
                  }
                </div>
              </div>

              <div style="margin-bottom: 24px;">
                <h3 style="font-size: 18px; margin: 0 0 12px; color: #111827; font-weight: 600;">URL de la investigación</h3>
                <div style="background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 8px; padding: 16px; color: #4b5563;">
                  ${formData.researchUrl || 'No se ha especificado URL'}
                </div>
              </div>

              ${Object.values(formData.parameterOptions).some(value => value) ? `
                <div style="margin-bottom: 24px;">
                  <h3 style="font-size: 18px; margin: 0 0 12px; color: #111827; font-weight: 600;">Parámetros a guardar</h3>
                  <div style="background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 8px; padding: 16px;">
                    ${Object.entries(formData.parameterOptions)
                      .filter(([_, value]) => value)
                      .map(([key, _]) => `
                        <div style="padding: 8px 0; color: #4b5563; display: flex; align-items: center;">
                          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#4d7c0f" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="margin-right: 8px;">
                            <circle cx="12" cy="12" r="10"></circle>
                            <path d="M8 12l2 2 6-6"></path>
                          </svg>
                          ${key}
                        </div>
                      `).join('')
                    }
                  </div>
                </div>
              ` : ''}
            </div>
            <div style="padding: 20px 24px; border-top: 1px solid #f1f1f1; display: flex; justify-content: flex-end; gap: 12px;">
              <button id="cancelConfirmation" style="background: #f9fafb; color: #4b5563; border: 1px solid #e5e7eb; border-radius: 8px; padding: 10px 20px; font-weight: 500; cursor: pointer; font-size: 16px; transition: all 0.2s;">
                Cancelar
              </button>
              <button id="confirmSave" style="background: #4f46e5; color: white; border: none; border-radius: 8px; padding: 10px 20px; font-weight: 500; cursor: pointer; font-size: 16px; transition: all 0.2s; box-shadow: 0 2px 4px rgba(79, 70, 229, 0.2);">
                Confirmar y guardar
              </button>
            </div>
          </div>
        </div>
        <style>
          @keyframes fadeIn {
            from { opacity: 0; transform: scale(0.98); }
            to { opacity: 1; transform: scale(1); }
          }
          #closeConfirmModal:hover {
            background-color: #f3f4f6;
          }
          #cancelConfirmation:hover {
            background-color: #f3f4f6;
            border-color: #d1d5db;
          }
          #confirmSave:hover {
            background-color: #4338ca;
            box-shadow: 0 4px 6px rgba(79, 70, 229, 0.25);
          }
        </style>
      `;
      
      document.body.appendChild(confirmModalContainer);
      
      // Configurar eventos
      document.getElementById('closeConfirmModal')?.addEventListener('click', () => {
        document.body.removeChild(confirmModalContainer);
      });
      
      document.getElementById('cancelConfirmation')?.addEventListener('click', () => {
        document.body.removeChild(confirmModalContainer);
      });
      
      document.getElementById('confirmSave')?.addEventListener('click', () => {
        document.body.removeChild(confirmModalContainer);
        setSaving(true);
        
        // Llamar a la mutación y manejar manualmente el resultado
        mutate(configToSave, {
          onSuccess: () => {
            // Asegurarse de que el estado "saving" se restablezca
            setTimeout(() => setSaving(false), 300);
          },
          onError: () => {
            // Asegurarse de que el estado "saving" se restablezca
            setTimeout(() => setSaving(false), 300);
          }
        });
      });

      // También permitir cerrar haciendo clic fuera del modal
      confirmModalContainer.addEventListener('click', (e) => {
        if (e.target === confirmModalContainer.firstChild) {
          document.body.removeChild(confirmModalContainer);
        }
      });
    } catch (error) {
      console.error('[useEyeTrackingRecruit] Error al preparar datos:', error);
      showModal({
        title: 'Error al preparar datos',
        message: 'Ocurrió un error al preparar los datos para guardar.',
        type: 'error'
      });
      setSaving(false);
    }
  }, [formData, researchId, showModal, mutate, demographicQuestionsEnabled, linkConfigEnabled]);
  
  // Cargar datos (simulado por ahora)
  useEffect(() => {
    // Simular carga de datos
    setTimeout(() => {
      setLoading(false);
    }, 1000);
  }, []);
  
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
    generateRecruitmentLink,
    generateQRCode,
    copyLinkToClipboard
  };
} 