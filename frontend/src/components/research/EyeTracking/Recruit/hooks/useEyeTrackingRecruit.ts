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
  EyeTrackingRecruitResponse
} from '@/shared/interfaces/eyeTracking';
import { eyeTrackingAPI } from '@/shared/api/eyeTracking';

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
  success?: boolean;
  error?: string;
  data?: EyeTrackingRecruitConfig;
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

export function useEyeTrackingRecruit({ researchId }: UseEyeTrackingRecruitProps): UseEyeTrackingRecruitResult {
  const router = useRouter();
  const queryClient = useQueryClient();
  
  // Estados
  const [formData, setFormData] = useState<Omit<EyeTrackingRecruitConfig, 'researchId'>>(DEFAULT_CONFIG);
  const [stats, setStats] = useState<EyeTrackingRecruitStats | null>(null);
  
  // Consulta para obtener la configuración
  const { data: configData, isLoading } = useQuery<ConfigResponse>({
    queryKey: ['eyeTracking', 'recruitConfig', researchId],
    queryFn: async () => {
      try {
        if (!researchId) return { success: false, error: 'ID de investigación no válido' };
        
        // Usar el método de Alova
        const response = await eyeTrackingAPI.getEyeTrackingRecruitConfig(researchId).send();
        return response as ConfigResponse;
      } catch (error) {
        console.error('Error al cargar la configuración inicial:', error);
        
        // Si obtenemos un 404, no es un error real, simplemente no hay configuración
        // Esto es normal para investigaciones nuevas
        if (error?.response?.status === 404 || 
            (error?.message && error.message.includes('404')) ||
            (typeof error === 'object' && error && 'notFound' in error)) {
          console.log('No se encontró configuración para esta investigación - esto es normal si es nueva');
          return { 
            success: true, 
            data: null, 
            message: 'No existe configuración previa' 
          };
        }
        
        return { success: false, error: 'Error al cargar la configuración' };
      }
    },
    enabled: !!researchId,
    refetchOnWindowFocus: false
  });
  
  // Consulta para obtener estadísticas
  const { data: statsData } = useQuery<EyeTrackingRecruitStats>({
    queryKey: ['eyeTracking', 'recruitStats', researchId],
    queryFn: async () => {
      try {
        if (!researchId) return DEFAULT_STATS;
        
        // Usar el método de Alova
        const response = await eyeTrackingAPI.getEyeTrackingRecruitStats(researchId).send();
        
        // Si la respuesta tiene un formato estándar, extraer data
        if (response && typeof response === 'object' && 'data' in response) {
          return response.data || DEFAULT_STATS;
        }
        
        // Si la respuesta es directamente los datos
        return response as EyeTrackingRecruitStats || DEFAULT_STATS;
      } catch (error) {
        console.error('Error al cargar estadísticas:', error);
        // Para errores 404, retornar estadísticas por defecto sin mostrar error
        if (error?.response?.status === 404 || 
            (error?.message && error.message.includes('404')) ||
            (typeof error === 'object' && error && 'notFound' in error)) {
          console.log('No se encontraron estadísticas - esto es normal para configuraciones nuevas');
        }
        return DEFAULT_STATS;
      }
    },
    enabled: !!researchId,
    refetchOnWindowFocus: false
  });
  
  // Efecto para actualizar el estado cuando se cargan los datos
  useEffect(() => {
    if (configData?.success && configData.data) {
      // Eliminar researchId del objeto de datos
      const { researchId: _, ...configDataWithoutId } = configData.data;
      setFormData(configDataWithoutId);
    }
    
    if (statsData) {
      setStats(statsData);
    }
  }, [configData, statsData]);
  
  // Mutación para guardar la configuración
  const { mutate: saveConfig, isPending: saving } = useMutation<ConfigResponse, Error>({
    mutationFn: async () => {
      if (!researchId) throw new Error('ID de investigación no válido');
      
      // Usar el método de Alova
      const response = await eyeTrackingAPI.updateEyeTrackingRecruitConfig({
        researchId,
        config: formData
      }).send();
      
      return response as ConfigResponse;
    },
    onSuccess: (response) => {
      if (response.success) {
        toast.success('Configuración guardada correctamente');
        queryClient.invalidateQueries({ queryKey: ['eyeTracking', 'recruitConfig', researchId] });
        queryClient.invalidateQueries({ queryKey: ['eyeTracking', 'recruitStats', researchId] });
      } else {
        toast.error(`Error al guardar: ${response.error || 'Error desconocido'}`);
      }
    },
    onError: (error) => {
      console.error('Error al guardar el formulario:', error);
      toast.error('No se pudo guardar la configuración');
    }
  });
  
  // Mutación para generar enlace de reclutamiento
  const { mutate: mutateGenerateLink } = useMutation<LinkResponse, Error>({
    mutationFn: async () => {
      if (!researchId) throw new Error('ID de investigación no válido');
      
      // Usar el método de Alova
      const response = await eyeTrackingAPI.generateRecruitmentLink(researchId).send();
      return response as LinkResponse;
    },
    onSuccess: (response) => {
      if (response?.data?.link) {
        navigator.clipboard.writeText(response.data.link);
        toast.success('Enlace generado y copiado al portapapeles');
      } else {
        toast.error('No se pudo generar el enlace');
      }
    },
    onError: (error) => {
      console.error('Error al generar enlace:', error);
      toast.error('No se pudo generar el enlace');
    }
  });
  
  // Mutación para generar código QR
  const { mutate: mutateGenerateQR } = useMutation<QRResponse, Error>({
    mutationFn: async () => {
      if (!researchId) throw new Error('ID de investigación no válido');
      
      // Usar el método de Alova
      const response = await eyeTrackingAPI.generateQRCode(researchId).send();
      return response as QRResponse;
    },
    onSuccess: (response) => {
      if (response?.data?.qrImageUrl) {
        window.open(response.data.qrImageUrl, '_blank');
        toast.success('Código QR generado');
      } else {
        toast.error('No se pudo generar el código QR');
      }
    },
    onError: (error) => {
      console.error('Error al generar QR:', error);
      toast.error('No se pudo generar el código QR');
    }
  });
  
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
  
  // Acciones
  const saveForm = useCallback(async () => {
    if (!researchId) {
      toast.error('ID de investigación no válido');
      return;
    }
    
    saveConfig();
  }, [researchId, saveConfig]);
  
  const generateRecruitmentLink = useCallback(async () => {
    if (!researchId) {
      toast.error('ID de investigación no válido');
      return;
    }
    
    mutateGenerateLink();
  }, [researchId, mutateGenerateLink]);
  
  const generateQRCode = useCallback(async () => {
    if (!researchId) {
      toast.error('ID de investigación no válido');
      return;
    }
    
    mutateGenerateQR();
  }, [researchId, mutateGenerateQR]);
  
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
    loading: isLoading,
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