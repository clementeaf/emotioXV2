'use client';

import { useState, useEffect, useCallback } from 'react';
import { toast } from 'react-hot-toast';
import { useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

import { 
  EyeTrackingRecruitConfig, 
  EyeTrackingRecruitStats, 
  DemographicQuestionKey,
  LinkConfigKey,
  ParameterOptionKey,
  BacklinkKey,
  EyeTrackingRecruitRequest
} from '@/shared/interfaces/eyeTracking';
import { eyeTrackingAPI } from '@/shared/api/eyeTracking';
import API_CONFIG from '@/config/api.config';

interface UseEyeTrackingRecruitProps {
  researchId: string;
}

interface UseEyeTrackingRecruitResult {
  // Estados del formulario
  loading: boolean;
  saving: boolean;
  formData: Omit<EyeTrackingRecruitConfig, 'researchId'>;
  stats: EyeTrackingRecruitStats | null;
  
  // Métodos para manipular el formulario
  handleDemographicChange: (key: DemographicQuestionKey, value: boolean) => void;
  handleLinkConfigChange: (key: LinkConfigKey, value: boolean) => void;
  handleBacklinkChange: (key: BacklinkKey, value: string) => void;
  handleParamOptionChange: (key: ParameterOptionKey, value: boolean) => void;
  setLimitParticipants: (value: boolean) => void;
  setParticipantLimit: (value: number) => void;
  setResearchUrl: (value: string) => void;
  
  // Acciones
  saveForm: () => Promise<void>;
  generateRecruitmentLink: () => Promise<void>;
  generateQRCode: () => Promise<void>;
  copyLinkToClipboard: () => void;
  previewLink: () => void;
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

// Interfaces para tipos de respuesta
interface ConfigResponse {
  success: boolean;
  data?: EyeTrackingRecruitConfig | null;
  error?: string;
  message?: string;
}

interface LinkResponse {
  data?: {
    link?: string;
  };
}

interface QRResponse {
  data?: {
    qrImageUrl?: string;
  };
}

// Modificar la definición del tipo de error para incluir response y message
type ApiError = Error & {
  response?: {
    status?: number;
  };
  message?: string;
  notFound?: boolean;
};

// Añadir una función para detectar si el módulo backend está disponible
const isEyeTrackingRecruitModuleAvailable = async (researchId: string): Promise<boolean> => {
  try {
    const response = await fetch(`${API_CONFIG.baseURL}/eye-tracking-recruit/research/${researchId}/config`, {
      method: 'OPTIONS',
      headers: {
        'Content-Type': 'application/json'
      }
    });
    return response.status !== 404;
  } catch (error) {
    console.log('Error verificando disponibilidad del módulo eye-tracking-recruit:', error);
    return false;
  }
};

// Modificar la función checkEndpointAvailability
const checkEndpointAvailability = async (researchId: string, endpoint: string): Promise<boolean> => {
  // Prueba directa sin verificar localStorage para forzar la verificación en cada carga
  try {
    console.log(`Verificando disponibilidad del endpoint: ${endpoint}`);
    
    // Hacer una petición OPTIONS para verificar si el endpoint existe
    const response = await fetch(`${API_CONFIG.baseURL}${endpoint}`.replace('{researchId}', researchId), {
      method: 'OPTIONS',
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    const isAvailable = response.status !== 404;
    console.log(`Endpoint ${endpoint} ${isAvailable ? 'disponible' : 'no disponible'} - Status: ${response.status}`);
    
    return isAvailable;
  } catch (error) {
    console.log(`Error verificando disponibilidad del endpoint ${endpoint}:`, error);
    return false;
  }
};

export function useEyeTrackingRecruit({ researchId }: UseEyeTrackingRecruitProps): UseEyeTrackingRecruitResult {
  const router = useRouter();
  const queryClient = useQueryClient();
  
  // Estados
  const [formData, setFormData] = useState<Omit<EyeTrackingRecruitConfig, 'researchId'>>(DEFAULT_CONFIG);
  const [stats, setStats] = useState<EyeTrackingRecruitStats | null>(DEFAULT_STATS);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  
  // Eliminar las consultas que causan errores 404
  // const { data: configData, isLoading } = useQuery...
  // const { data: statsData } = useQuery...
  
  // MODO DE SIMULACIÓN TEMPORAL
  // Simular carga inicial
  useEffect(() => {
    console.log('Usando datos simulados para eye-tracking-recruit');
    setFormData(DEFAULT_CONFIG);
    setStats(DEFAULT_STATS);
  }, [researchId]);
  
  // Métodos para manipular el formulario (memoizados para mejor rendimiento)
  const handleDemographicChange = useCallback((key: DemographicQuestionKey, value: boolean) => {
    setFormData(prev => ({
      ...prev,
      demographicQuestions: {
        ...prev.demographicQuestions,
        [key]: value
      }
    }));
  }, []);
  
  const handleLinkConfigChange = useCallback((key: LinkConfigKey, value: boolean) => {
    setFormData(prev => ({
      ...prev,
      linkConfig: {
        ...prev.linkConfig,
        [key]: value
      }
    }));
  }, []);
  
  const handleBacklinkChange = useCallback((key: BacklinkKey, value: string) => {
    setFormData(prev => ({
      ...prev,
      backlinks: {
        ...prev.backlinks,
        [key]: value
      }
    }));
  }, []);
  
  const handleParamOptionChange = useCallback((key: ParameterOptionKey, value: boolean) => {
    setFormData(prev => ({
      ...prev,
      parameterOptions: {
        ...prev.parameterOptions,
        [key]: value
      }
    }));
  }, []);
  
  const setLimitParticipants = useCallback((value: boolean) => {
    setFormData(prev => ({
      ...prev,
      participantLimit: {
        ...prev.participantLimit,
        enabled: value
      }
    }));
  }, []);
  
  const setParticipantLimit = useCallback((value: number) => {
    setFormData(prev => ({
      ...prev,
      participantLimit: {
        ...prev.participantLimit,
        limit: value
      }
    }));
  }, []);
  
  const setResearchUrl = useCallback((value: string) => {
    setFormData(prev => ({
      ...prev,
      researchUrl: value
    }));
  }, []);
  
  // Acciones simuladas
  const saveForm = useCallback(async () => {
    setSaving(true);
    console.log('Simulando guardado de configuración eye-tracking-recruit');
    
    // Simular delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    setSaving(false);
    toast.success('Configuración guardada exitosamente (simulado)');
  }, [formData]);
  
  const generateRecruitmentLink = useCallback(async () => {
    console.log('Simulando generación de enlace de reclutamiento');
    
    // Simular delay
    await new Promise(resolve => setTimeout(resolve, 800));
    
    const simulatedLink = `https://example.com/recruit?id=${researchId}&t=${Date.now()}`;
    
    try {
      await navigator.clipboard.writeText(simulatedLink);
      toast.success('Enlace simulado copiado al portapapeles');
    } catch (e) {
      console.error('Error al copiar:', e);
      toast.error('No se pudo copiar el enlace');
    }
  }, [researchId]);
  
  const generateQRCode = useCallback(async () => {
    console.log('Simulando generación de código QR');
    
    // Simular delay
    await new Promise(resolve => setTimeout(resolve, 800));
    
    toast.success('Código QR generado correctamente (simulado)');
  }, [researchId]);
  
  const copyLinkToClipboard = useCallback(() => {
    if (formData.researchUrl) {
      try {
        navigator.clipboard.writeText(formData.researchUrl);
        toast.success('Enlace copiado al portapapeles');
      } catch (error) {
        console.error('Error al copiar:', error);
        toast.error('No se pudo copiar el enlace');
      }
    }
  }, [formData.researchUrl]);
  
  const previewLink = useCallback(() => {
    if (formData.researchUrl) {
      window.open(formData.researchUrl, '_blank');
    }
  }, [formData.researchUrl]);
  
  return {
    loading,
    saving,
    formData,
    stats,
    handleDemographicChange,
    handleLinkConfigChange,
    handleBacklinkChange,
    handleParamOptionChange,
    setLimitParticipants,
    setParticipantLimit,
    setResearchUrl,
    saveForm,
    generateRecruitmentLink,
    generateQRCode,
    copyLinkToClipboard,
    previewLink
  };
} 