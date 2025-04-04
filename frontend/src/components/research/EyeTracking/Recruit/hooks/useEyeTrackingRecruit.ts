'use client';

import { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { useRouter } from 'next/navigation';

import { 
  EyeTrackingRecruitConfig, 
  EyeTrackingRecruitStats, 
  DemographicQuestionKey,
  LinkConfigKey,
  ParameterOptionKey,
  BacklinkKey
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

export function useEyeTrackingRecruit({ researchId }: UseEyeTrackingRecruitProps): UseEyeTrackingRecruitResult {
  const router = useRouter();
  
  // Estados
  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);
  const [formData, setFormData] = useState<Omit<EyeTrackingRecruitConfig, 'researchId'>>(DEFAULT_CONFIG);
  const [stats, setStats] = useState<EyeTrackingRecruitStats | null>(null);
  
  // Cargar datos iniciales
  useEffect(() => {
    const loadInitialData = async () => {
      if (!researchId) return;
      
      setLoading(true);
      
      try {
        // Intentar cargar la configuración existente
        const configResponse = await eyeTrackingAPI.getEyeTrackingRecruitConfig(researchId);
        
        if (configResponse.success && configResponse.data) {
          // Eliminar researchId del objeto de datos
          const { researchId: _, ...configData } = configResponse.data;
          setFormData(configData);
        }
        
        // Cargar estadísticas si están disponibles
        if (configResponse.stats) {
          setStats(configResponse.stats);
        } else {
          try {
            const statsData = await eyeTrackingAPI.getEyeTrackingRecruitStats(researchId);
            setStats(statsData);
          } catch (statsError) {
            console.error('Error al cargar estadísticas:', statsError);
            setStats(DEFAULT_STATS);
          }
        }
      } catch (error) {
        console.error('Error al cargar la configuración inicial:', error);
        toast.error('No se pudo cargar la configuración de reclutamiento');
        // Usar valores predeterminados si falla la carga
        setFormData(DEFAULT_CONFIG);
        setStats(DEFAULT_STATS);
      } finally {
        setLoading(false);
      }
    };
    
    loadInitialData();
  }, [researchId]);
  
  // Métodos para manipular el formulario
  const handleDemographicChange = (key: DemographicQuestionKey, value: boolean) => {
    setFormData(prev => ({
      ...prev,
      demographicQuestions: {
        ...prev.demographicQuestions,
        [key]: value
      }
    }));
  };
  
  const handleLinkConfigChange = (key: LinkConfigKey, value: boolean) => {
    setFormData(prev => ({
      ...prev,
      linkConfig: {
        ...prev.linkConfig,
        [key]: value
      }
    }));
  };
  
  const handleBacklinkChange = (key: BacklinkKey, value: string) => {
    setFormData(prev => ({
      ...prev,
      backlinks: {
        ...prev.backlinks,
        [key]: value
      }
    }));
  };
  
  const handleParamOptionChange = (key: ParameterOptionKey, value: boolean) => {
    setFormData(prev => ({
      ...prev,
      parameterOptions: {
        ...prev.parameterOptions,
        [key]: value
      }
    }));
  };
  
  const setLimitParticipants = (value: boolean) => {
    setFormData(prev => ({
      ...prev,
      participantLimit: {
        ...prev.participantLimit,
        enabled: value
      }
    }));
  };
  
  const setParticipantLimit = (value: number) => {
    setFormData(prev => ({
      ...prev,
      participantLimit: {
        ...prev.participantLimit,
        limit: value
      }
    }));
  };
  
  const setResearchUrl = (value: string) => {
    setFormData(prev => ({
      ...prev,
      researchUrl: value
    }));
  };
  
  // Acciones
  const saveForm = async () => {
    if (!researchId) {
      toast.error('ID de investigación no válido');
      return;
    }
    
    setSaving(true);
    
    try {
      const response = await eyeTrackingAPI.updateEyeTrackingRecruitConfig({
        researchId,
        config: formData
      });
      
      if (response.success) {
        toast.success('Configuración guardada correctamente');
      } else {
        toast.error(`Error al guardar: ${response.error || 'Error desconocido'}`);
      }
    } catch (error) {
      console.error('Error al guardar el formulario:', error);
      toast.error('No se pudo guardar la configuración');
    } finally {
      setSaving(false);
    }
  };
  
  const generateRecruitmentLink = async () => {
    if (!researchId) return;
    
    try {
      const link = await eyeTrackingAPI.generateRecruitmentLink(researchId);
      setResearchUrl(link);
      toast.success('Enlace generado correctamente');
    } catch (error) {
      console.error('Error al generar enlace:', error);
      toast.error('No se pudo generar el enlace de reclutamiento');
    }
  };
  
  const generateQRCode = async () => {
    if (!researchId) return;
    
    try {
      await eyeTrackingAPI.generateQRCode(researchId);
      toast.success('Código QR generado correctamente');
    } catch (error) {
      console.error('Error al generar código QR:', error);
      toast.error('No se pudo generar el código QR');
    }
  };
  
  const copyLinkToClipboard = () => {
    if (!formData.researchUrl) {
      toast.error('No hay enlace para copiar');
      return;
    }
    
    try {
      navigator.clipboard.writeText(`https://${formData.researchUrl}`);
      toast.success('URL copiada al portapapeles');
    } catch (error) {
      console.error('Error al copiar al portapapeles:', error);
      toast.error('No se pudo copiar al portapapeles');
    }
  };
  
  const previewLink = () => {
    if (!formData.researchUrl) {
      toast.error('No hay enlace para previsualizar');
      return;
    }
    
    toast.success('Vista previa del enlace');
    // Implementar lógica real de previsualización según sea necesario
  };
  
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