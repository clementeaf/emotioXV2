'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import React, { useCallback, useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import {
    DemographicQuestionKeys,
    EyeTrackingRecruitStats,
    LinkConfigKeys,
    ParameterOptionKeys,
} from 'shared/interfaces/eyeTrackingRecruit.interface';

import { useErrorLog } from '@/components/utils/ErrorLogger';
import { eyeTrackingFixedAPI } from '@/lib/eye-tracking-api';
import { QuestionType } from '../../../../../../../shared/interfaces/question-types.enum';


// Interfaces
interface ErrorModalData {
  title: string;
  message: string | React.ReactNode;
  type: 'error' | 'info' | 'success' | 'warning';
}

interface UseEyeTrackingRecruitProps {
  researchId: string;
}

// Definición de interfaces para datos del formulario
interface EyeTrackingRecruitFormData {
  id?: string;
  researchId: string;
  questionKey: string;
  demographicQuestions: {
    age: {
      enabled: boolean;
      required: boolean;
      options: string[];
      disqualifyingAges?: string[];
    };
    country: {
      enabled: boolean;
      required: boolean;
      options: string[];
      disqualifyingCountries?: string[];
    };
    gender: {
      enabled: boolean;
      required: boolean;
      options: string[];
      disqualifyingGenders?: string[];
    };
    educationLevel: {
      enabled: boolean;
      required: boolean;
      options: string[];
      disqualifyingEducation?: string[];
    };
    householdIncome: {
      enabled: boolean;
      required: boolean;
      options: string[];
      disqualifyingIncomes?: string[];
    };
    employmentStatus: {
      enabled: boolean;
      required: boolean;
      options: string[];
      disqualifyingEmploymentStatuses?: string[];
    };
    dailyHoursOnline: {
      enabled: boolean;
      required: boolean;
      options: string[];
      disqualifyingHours?: string[];
    };
    technicalProficiency: {
      enabled: boolean;
      required: boolean;
      options: string[];
      disqualifyingProficiencies?: string[];
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
  updateAgeOptions: (options: string[]) => void;
  updateDisqualifyingAges: (disqualifyingAges: string[]) => void;
  updateCountryOptions: (options: string[]) => void;
  updateDisqualifyingCountries: (disqualifyingCountries: string[]) => void;
  updateGenderOptions: (options: string[]) => void;
  updateDisqualifyingGenders: (disqualifyingGenders: string[]) => void;
  updateEducationOptions: (options: string[]) => void;
  updateDisqualifyingEducation: (disqualifyingEducation: string[]) => void;
  updateHouseholdIncomeOptions: (options: string[]) => void;
  updateDisqualifyingHouseholdIncomes: (disqualifyingIncomes: string[]) => void;
  updateEmploymentStatusOptions: (options: string[]) => void;
  updateDisqualifyingEmploymentStatuses: (disqualifyingEmploymentStatuses: string[]) => void;
  updateDailyHoursOnlineOptions: (options: string[]) => void;
  updateDisqualifyingDailyHoursOnline: (disqualifyingHours: string[]) => void;
  updateTechnicalProficiencyOptions: (options: string[]) => void;
  updateDisqualifyingTechnicalProficiencies: (disqualifyingProficiencies: string[]) => void;

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

// Añadir esta función auxiliar para garantizar que options sea siempre un array
const ensureOptionsArray = (options?: string[]): string[] => {
  return options || [];
};

// Configuración sin opciones hardcodeadas - el usuario debe definir sus propias opciones
const DEFAULT_CONFIG: EyeTrackingRecruitFormData = {
  researchId: '',
  questionKey: QuestionType.DEMOGRAPHICS,
  demographicQuestions: {
    age: {
      enabled: false,
      required: false,
      options: [],
      disqualifyingAges: []
    },
    country: {
      enabled: false,
      required: false,
      options: []
    },
    gender: {
      enabled: false,
      required: false,
      options: [],
      disqualifyingGenders: []
    },
    educationLevel: {
      enabled: false,
      required: false,
      options: [],
      disqualifyingEducation: []
    },
    householdIncome: {
      enabled: false,
      required: false,
      options: [],
      disqualifyingIncomes: []
    },
    employmentStatus: {
      enabled: false,
      required: false,
      options: [],
      disqualifyingEmploymentStatuses: []
    },
    dailyHoursOnline: {
      enabled: false,
      required: false,
      options: [],
      disqualifyingHours: []
    },
    technicalProficiency: {
      enabled: false,
      required: false,
      options: [],
      disqualifyingProficiencies: []
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

// Función para procesar la respuesta de la API y asegurar que todas las opciones sean arrays
const processApiResponse = (response: any): EyeTrackingRecruitFormData => {
  // Empezar con una configuración segura basada en los valores predeterminados
  const safeResponse: EyeTrackingRecruitFormData = {
    ...DEFAULT_CONFIG,
    researchId: response?.researchId || DEFAULT_CONFIG.researchId
  };

  // Si no hay respuesta, devolver la configuración predeterminada
  if (!response) {return safeResponse;}

  try {
    // ID
    if (response.id && typeof response.id === 'string' && response.id.length > 0) {
      safeResponse.id = response.id;
    }

    // Preguntas demográficas
    if (response.demographicQuestions) {
      const demographicKeys: DemographicQuestionKeys[] = [
        'age', 'country', 'gender', 'educationLevel',
        'householdIncome', 'employmentStatus',
        'dailyHoursOnline', 'technicalProficiency'
      ];

      // Procesar cada categoría demográfica
      demographicKeys.forEach(key => {
        if (response.demographicQuestions[key]) {
          safeResponse.demographicQuestions[key] = {
            enabled: response.demographicQuestions[key].enabled || false,
            required: response.demographicQuestions[key].required || false,
            // Usar ensureOptionsArray para garantizar que options sea un array
            options: ensureOptionsArray(response.demographicQuestions[key].options) || []
          };
        }
      });
    }

    // Configuración de enlaces
    if (response.linkConfig) {
      safeResponse.linkConfig = {
        allowMobile: response.linkConfig.allowMobile || false,
        trackLocation: response.linkConfig.trackLocation || false,
        allowMultipleAttempts: response.linkConfig.allowMultipleAttempts || false
      };
    }

    // Límite de participantes
    if (response.participantLimit) {
      safeResponse.participantLimit = {
        enabled: response.participantLimit.enabled || false,
        value: response.participantLimit.value || 50
      };
    }

    // Enlaces de retorno
    if (response.backlinks) {
      safeResponse.backlinks = {
        complete: response.backlinks.complete || '',
        disqualified: response.backlinks.disqualified || '',
        overquota: response.backlinks.overquota || ''
      };
    }

    // URL de investigación
    if (response.researchUrl) {
      safeResponse.researchUrl = response.researchUrl;
    }

    // Opciones de parámetros
    if (response.parameterOptions) {
      safeResponse.parameterOptions = {
        saveDeviceInfo: response.parameterOptions.saveDeviceInfo || false,
        saveLocationInfo: response.parameterOptions.saveLocationInfo || false,
        saveResponseTimes: response.parameterOptions.saveResponseTimes || false,
        saveUserJourney: response.parameterOptions.saveUserJourney || false
      };
    }

  } catch (error) {
    console.error('[useEyeTrackingRecruit] Error procesando respuesta:', error);
  }

  return safeResponse;
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
  const [apiErrors, setApiErrors] = useState<{visible: boolean, title: string, message: string} | undefined>(undefined);

  // Nuevos estados para QR
  const [qrCodeData, setQrCodeData] = useState<string | null>(null);
  const [showQRModal, setShowQRModal] = useState<boolean>(false);

  // Función para generar el enlace de reclutamiento
  const generateRecruitmentLink = useCallback(() => {
    const actualResearchId = researchId === 'current' ? '1234' : researchId;
    // Usar el mismo formato que en el sidebar unificado para asegurar consistencia
    const publicTestsBaseUrl = process.env.NEXT_PUBLIC_PUBLIC_TESTS_URL || 'https://useremotion.com';
    return `${publicTestsBaseUrl}/link/${actualResearchId}`;
  }, [researchId]);

  // Cargar configuración existente
  const actualResearchId = researchId === 'current' ? '1234' : researchId;
  const { isLoading: isLoadingConfig } = useQuery({
    queryKey: ['eyeTrackingRecruit', actualResearchId],
    queryFn: async () => {
      try {
        // console.log('[useEyeTrackingRecruit] Cargando config para:', actualResearchId);
        const response = await eyeTrackingFixedAPI.getRecruitConfig(actualResearchId).send();
        // console.log('[useEyeTrackingRecruit] Config cargada (respuesta API):', response);

        // Si no hay datos en la respuesta, crear una configuración predeterminada
        if (!response) {
          // console.log('[useEyeTrackingRecruit] Sin respuesta, usando configuración predeterminada');
          return createDefaultConfig(actualResearchId);
        }

        // Verificar si la respuesta contiene los datos necesarios
        if (!response.id) {
          // console.log('[useEyeTrackingRecruit] Respuesta sin ID, usando configuración predeterminada');
          return createDefaultConfig(actualResearchId);
        }

        // Procesar la respuesta para adaptarla a nuestra estructura
        // Si estamos usando la API de eye-tracking normal, necesitamos adaptarla
        const configData = processApiResponse(response);

        // Asegurarnos de usar el researchId correcto
        configData.researchId = actualResearchId;

        // Actualizar el estado del formulario
        setFormData(configData);

        // Determinar si hay preguntas demográficas habilitadas
        const hasDemographics = Object.values(configData.demographicQuestions).some(
          (q: any) => q.enabled
        );
        setDemographicQuestionsEnabledState(hasDemographics);

        // Determinar si hay opciones de configuración de enlace habilitadas
        const hasLinkConfig = Object.values(configData.linkConfig).some(value => value);
        setLinkConfigEnabledState(hasLinkConfig);

        return configData;
      } catch (error: any) {
        // console.log('[useEyeTrackingRecruit] Error al cargar:', error);
        if (error.statusCode === 404) {
          // console.log('[useEyeTrackingRecruit] No hay configuración previa para:', actualResearchId);
          return createDefaultConfig(actualResearchId);
        }
        toast.error(`Error al cargar configuración: ${error.message || 'Error desconocido'}`);
        throw error;
      }
    },
    enabled: !!actualResearchId
  });

  // Actualizar estado de carga cuando termina la consulta y asignar URL automáticamente
  useEffect(() => {
    if (!isLoadingConfig) {
      setLoading(false);

      // Establecer automáticamente la URL de investigación al cargar
      const generatedLink = generateRecruitmentLink();
      setFormData(prev => ({
        ...prev,
        researchUrl: generatedLink
      }));
    }
  }, [isLoadingConfig, generateRecruitmentLink]);

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
      // console.log('[useEyeTrackingRecruit] Errores de validación:', errors);
      return false;
    }

    return true;
  }, [formData]);

  // Configuración de la mutación para guardar
  const saveConfigMutation = useMutation({
    mutationFn: async (data: any) => {
      return await eyeTrackingFixedAPI.saveRecruitConfig(data).send();
    },
    onSuccess: () => {
      // Eliminamos el toast de aquí para evitar duplicados
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

  // Función que ejecuta el guardado real
  const handleConfirmSave = React.useCallback(async () => {
    setLoading(true);

    try {
      // Preparamos los datos para enviar
      const actualResearchId = researchId === 'current' ? '1234' : researchId;

      // Extraer los datos excluyendo el id, para forzar al backend a usar updateByResearchId
      const { id, ...restFormData } = formData;
      const dataToSave = {
        ...restFormData,
        researchId: actualResearchId,
        questionKey: restFormData.questionKey === QuestionType.DEMOGRAPHICS ? restFormData.questionKey : QuestionType.DEMOGRAPHICS
      };

      // console.log('[useEyeTrackingRecruit] Guardando config con ID de investigación:', dataToSave.researchId);
      // console.log('[useEyeTrackingRecruit] ID original de configuración eliminado:', id || 'No tenía ID');
      // console.log('[useEyeTrackingRecruit] Payload completo:', JSON.stringify(dataToSave, null, 2));

      // Enviamos los datos al servidor
      const result = await saveConfigMutation.mutateAsync(dataToSave);
      // console.log('[useEyeTrackingRecruit] Resultado exitoso:', result);

      // Mostrar modal de éxito (tipo info para usar azul)
      showModal({
        title: 'Éxito',
        message: 'Configuración de reclutamiento guardada correctamente.',
        type: 'info'
      });
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
  }, [formData, saveConfigMutation, researchId, showModal, setApiErrors]);

  // Función para guardar el formulario (punto de entrada principal)
  const saveForm = React.useCallback(async () => {
    setLoading(true);
    setApiErrors(undefined);

    try {
      // Validamos los datos antes de enviar
      if (checkRequiredFields()) {
        // Guardar directamente sin modal de confirmación
        await handleConfirmSave();
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
  }, [checkRequiredFields, handleConfirmSave]);

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

  // Función para actualizar las opciones de edad
  const updateAgeOptions = useCallback((options: string[]) => {
    setFormData(prevData => ({
      ...prevData,
      demographicQuestions: {
        ...prevData.demographicQuestions,
        age: {
          ...prevData.demographicQuestions.age,
          options: options
        }
      }
    }));
  }, []);

  // Función para actualizar las edades descalificantes
  const updateDisqualifyingAges = useCallback((disqualifyingAges: string[]) => {
    setFormData(prevData => ({
      ...prevData,
      demographicQuestions: {
        ...prevData.demographicQuestions,
        age: {
          ...prevData.demographicQuestions.age,
          disqualifyingAges: disqualifyingAges
        }
      }
    }));
  }, []);

  // Función para actualizar las opciones de países
  const updateCountryOptions = useCallback((options: string[]) => {
    setFormData(prevData => ({
      ...prevData,
      demographicQuestions: {
        ...prevData.demographicQuestions,
        country: {
          ...prevData.demographicQuestions.country,
          options: options
        }
      }
    }));
  }, []);

  // Función para actualizar los países descalificantes
  const updateDisqualifyingCountries = useCallback((disqualifyingCountries: string[]) => {
    setFormData(prevData => ({
      ...prevData,
      demographicQuestions: {
        ...prevData.demographicQuestions,
        country: {
          ...prevData.demographicQuestions.country,
          disqualifyingCountries: disqualifyingCountries
        }
      }
    }));
  }, []);

  // Función para actualizar las opciones de géneros
  const updateGenderOptions = useCallback((options: string[]) => {
    setFormData(prevData => ({
      ...prevData,
      demographicQuestions: {
        ...prevData.demographicQuestions,
        gender: {
          ...prevData.demographicQuestions.gender,
          options: options
        }
      }
    }));
  }, []);

  // Función para actualizar los géneros descalificantes
  const updateDisqualifyingGenders = useCallback((disqualifyingGenders: string[]) => {
    setFormData(prevData => ({
      ...prevData,
      demographicQuestions: {
        ...prevData.demographicQuestions,
        gender: {
          ...prevData.demographicQuestions.gender,
          disqualifyingGenders: disqualifyingGenders
        }
      }
    }));
  }, []);

  // Función para actualizar las opciones de niveles educativos
  const updateEducationOptions = useCallback((options: string[]) => {
    setFormData(prevData => ({
      ...prevData,
      demographicQuestions: {
        ...prevData.demographicQuestions,
        educationLevel: {
          ...prevData.demographicQuestions.educationLevel,
          options: options
        }
      }
    }));
  }, []);

  // Función para actualizar los niveles educativos descalificantes
  const updateDisqualifyingEducation = useCallback((disqualifyingEducation: string[]) => {
    setFormData(prevData => ({
      ...prevData,
      demographicQuestions: {
        ...prevData.demographicQuestions,
        educationLevel: {
          ...prevData.demographicQuestions.educationLevel,
          disqualifyingEducation: disqualifyingEducation
        }
      }
    }));
  }, []);

  // Función para actualizar las opciones de ingresos familiares
  const updateHouseholdIncomeOptions = useCallback((options: string[]) => {
    setFormData(prevData => ({
      ...prevData,
      demographicQuestions: {
        ...prevData.demographicQuestions,
        householdIncome: {
          ...prevData.demographicQuestions.householdIncome,
          options: options
        }
      }
    }));
  }, []);

  // Función para actualizar los ingresos familiares descalificantes
  const updateDisqualifyingHouseholdIncomes = useCallback((disqualifyingIncomes: string[]) => {
    setFormData(prevData => ({
      ...prevData,
      demographicQuestions: {
        ...prevData.demographicQuestions,
        householdIncome: {
          ...prevData.demographicQuestions.householdIncome,
          disqualifyingIncomes: disqualifyingIncomes
        }
      }
    }));
  }, []);

  // Función para actualizar las opciones de situación laboral
  const updateEmploymentStatusOptions = useCallback((options: string[]) => {
    setFormData(prevData => ({
      ...prevData,
      demographicQuestions: {
        ...prevData.demographicQuestions,
        employmentStatus: {
          ...prevData.demographicQuestions.employmentStatus,
          options: options
        }
      }
    }));
  }, []);

  // Función para actualizar las situaciones laborales descalificantes
  const updateDisqualifyingEmploymentStatuses = useCallback((disqualifyingEmploymentStatuses: string[]) => {
    setFormData(prevData => ({
      ...prevData,
      demographicQuestions: {
        ...prevData.demographicQuestions,
        employmentStatus: {
          ...prevData.demographicQuestions.employmentStatus,
          disqualifyingEmploymentStatuses: disqualifyingEmploymentStatuses
        }
      }
    }));
  }, []);

  // Función para actualizar las opciones de horas diarias en línea
  const updateDailyHoursOnlineOptions = useCallback((options: string[]) => {
    setFormData(prevData => ({
      ...prevData,
      demographicQuestions: {
        ...prevData.demographicQuestions,
        dailyHoursOnline: {
          ...prevData.demographicQuestions.dailyHoursOnline,
          options: options
        }
      }
    }));
  }, []);

  // Función para actualizar las horas diarias en línea descalificantes
  const updateDisqualifyingDailyHoursOnline = useCallback((disqualifyingHours: string[]) => {
    setFormData(prevData => ({
      ...prevData,
      demographicQuestions: {
        ...prevData.demographicQuestions,
        dailyHoursOnline: {
          ...prevData.demographicQuestions.dailyHoursOnline,
          disqualifyingHours: disqualifyingHours
        }
      }
    }));
  }, []);

  // Función para actualizar las opciones de competencia técnica
  const updateTechnicalProficiencyOptions = useCallback((options: string[]) => {
    setFormData(prevData => ({
      ...prevData,
      demographicQuestions: {
        ...prevData.demographicQuestions,
        technicalProficiency: {
          ...prevData.demographicQuestions.technicalProficiency,
          options: options
        }
      }
    }));
  }, []);

  // Función para actualizar las competencias técnicas descalificantes
  const updateDisqualifyingTechnicalProficiencies = useCallback((disqualifyingProficiencies: string[]) => {
    setFormData(prevData => ({
      ...prevData,
      demographicQuestions: {
        ...prevData.demographicQuestions,
        technicalProficiency: {
          ...prevData.demographicQuestions.technicalProficiency,
          disqualifyingProficiencies: disqualifyingProficiencies
        }
      }
    }));
  }, []);

  // Acciones
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

  // Función auxiliar para crear una configuración predeterminada
  const createDefaultConfig = (researchId: string) => {
    const defaultConfig = {
      ...DEFAULT_CONFIG,
      researchId
    };

    // Actualizar el estado del formulario
    setFormData(defaultConfig);

    return defaultConfig;
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
    showConfirmModal: false,
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
    updateAgeOptions,
    updateDisqualifyingAges,
    updateCountryOptions,
    updateDisqualifyingCountries,
    updateGenderOptions,
    updateDisqualifyingGenders,
    updateEducationOptions,
    updateDisqualifyingEducation,
    updateHouseholdIncomeOptions,
    updateDisqualifyingHouseholdIncomes,
    updateEmploymentStatusOptions,
    updateDisqualifyingEmploymentStatuses,
    updateDailyHoursOnlineOptions,
    updateDisqualifyingDailyHoursOnline,
    updateTechnicalProficiencyOptions,
    updateDisqualifyingTechnicalProficiencies,

    // Acciones
    saveForm,
    handleConfirmSave,
    generateRecruitmentLink,
    generateQRCode,
    copyLinkToClipboard
  };
}
