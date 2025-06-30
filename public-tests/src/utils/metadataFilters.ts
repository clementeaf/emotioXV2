import { ResponseMetadata } from './deviceInfo';

/**
 * Interfaz para la configuración de parámetros de la investigación
 */
export interface ParameterOptions {
  saveDeviceInfo?: boolean;
  saveLocationInfo?: boolean;
  saveResponseTimes?: boolean;
  saveUserJourney?: boolean;
}

/**
 * Interfaz para la configuración de enlaces
 */
export interface LinkConfig {
  allowMobile?: boolean;
  trackLocation?: boolean;
  allowMultipleAttempts?: boolean;
}

/**
 * Interfaz para la configuración completa de la investigación
 */
export interface ResearchConfig {
  parameterOptions?: ParameterOptions;
  linkConfig?: LinkConfig;
}

/**
 * Filtra la metadata según la configuración de parámetros de la investigación
 * Solo incluye los datos que están habilitados en la configuración
 */
export function filterMetadataByConfig(
  metadata: ResponseMetadata,
  config?: ResearchConfig
): ResponseMetadata {
  if (!config?.parameterOptions) {
    // Si no hay configuración, incluir toda la metadata por defecto
    return metadata;
  }

  const { parameterOptions } = config;
  const filteredMetadata: ResponseMetadata = {};

  // Filtrar deviceInfo
  if (parameterOptions.saveDeviceInfo && metadata.deviceInfo) {
    filteredMetadata.deviceInfo = metadata.deviceInfo;
  }

  // Filtrar locationInfo
  if (parameterOptions.saveLocationInfo && metadata.locationInfo) {
    filteredMetadata.locationInfo = metadata.locationInfo;
  }

  // Filtrar timingInfo (incluye response times y user journey)
  if (parameterOptions.saveResponseTimes || parameterOptions.saveUserJourney) {
    if (metadata.timingInfo) {
      filteredMetadata.timingInfo = {
        startTime: metadata.timingInfo.startTime,
        endTime: metadata.timingInfo.endTime,
        duration: metadata.timingInfo.duration
      };

      // Solo incluir sectionTimings si saveUserJourney está habilitado
      if (parameterOptions.saveUserJourney && metadata.timingInfo.sectionTimings) {
        filteredMetadata.timingInfo.sectionTimings = metadata.timingInfo.sectionTimings;
      }
    }
  }

  // Filtrar sessionInfo (parte del user journey)
  if (parameterOptions.saveUserJourney && metadata.sessionInfo) {
    filteredMetadata.sessionInfo = metadata.sessionInfo;
  }

  // Filtrar technicalInfo (siempre incluido si está disponible)
  if (metadata.technicalInfo) {
    filteredMetadata.technicalInfo = metadata.technicalInfo;
  }

  return filteredMetadata;
}

/**
 * Valida si la configuración de parámetros es válida
 */
export function validateParameterConfig(config?: ResearchConfig): {
  isValid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (!config) {
    return { isValid: true, errors: [] };
  }

  const { parameterOptions, linkConfig } = config;

  // Validar parameterOptions
  if (parameterOptions) {
    if (typeof parameterOptions.saveDeviceInfo !== 'boolean' && parameterOptions.saveDeviceInfo !== undefined) {
      errors.push('saveDeviceInfo debe ser un boolean');
    }
    if (typeof parameterOptions.saveLocationInfo !== 'boolean' && parameterOptions.saveLocationInfo !== undefined) {
      errors.push('saveLocationInfo debe ser un boolean');
    }
    if (typeof parameterOptions.saveResponseTimes !== 'boolean' && parameterOptions.saveResponseTimes !== undefined) {
      errors.push('saveResponseTimes debe ser un boolean');
    }
    if (typeof parameterOptions.saveUserJourney !== 'boolean' && parameterOptions.saveUserJourney !== undefined) {
      errors.push('saveUserJourney debe ser un boolean');
    }
  }

  // Validar linkConfig
  if (linkConfig) {
    if (typeof linkConfig.allowMobile !== 'boolean' && linkConfig.allowMobile !== undefined) {
      errors.push('allowMobile debe ser un boolean');
    }
    if (typeof linkConfig.trackLocation !== 'boolean' && linkConfig.trackLocation !== undefined) {
      errors.push('trackLocation debe ser un boolean');
    }
    if (typeof linkConfig.allowMultipleAttempts !== 'boolean' && linkConfig.allowMultipleAttempts !== undefined) {
      errors.push('allowMultipleAttempts debe ser un boolean');
    }
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Obtiene la configuración de parámetros desde diferentes fuentes posibles
 */
export function getParameterConfig(researchData?: any): ResearchConfig | undefined {
  if (!researchData) return undefined;

  // Buscar en diferentes ubicaciones posibles de la configuración
  const parameterOptions =
    researchData.parameterOptions ||
    researchData.config?.parameterOptions ||
    researchData.settings?.parameterOptions;

  const linkConfig =
    researchData.linkConfig ||
    researchData.config?.linkConfig ||
    researchData.settings?.linkConfig;

  if (!parameterOptions && !linkConfig) {
    return undefined;
  }

  return {
    parameterOptions,
    linkConfig
  };
}

/**
 * Crea metadata filtrada según la configuración de la investigación
 */
export async function createFilteredMetadata(
  researchData?: any
): Promise<ResponseMetadata> {
  const config = getParameterConfig(researchData);

  // Importar dinámicamente para evitar dependencias circulares
  const { collectResponseMetadata } = await import('./deviceInfo');

  // Recolectar toda la metadata disponible
  const fullMetadata = await collectResponseMetadata();

  // Filtrar según la configuración
  return filterMetadataByConfig(fullMetadata, config);
}

/**
 * Log de depuración para mostrar qué metadata se está enviando
 */
export function logMetadataFiltering(
  originalMetadata: ResponseMetadata,
  filteredMetadata: ResponseMetadata,
  config?: ResearchConfig
): void {
  if (process.env.NODE_ENV === 'development') {
    console.group('🔍 Metadata Filtering Debug');
    console.log('Configuración:', config);
    console.log('Metadata original:', originalMetadata);
    console.log('Metadata filtrada:', filteredMetadata);

    const originalKeys = Object.keys(originalMetadata);
    const filteredKeys = Object.keys(filteredMetadata);
    const removedKeys = originalKeys.filter(key => !filteredKeys.includes(key));

    if (removedKeys.length > 0) {
      console.log('Campos removidos:', removedKeys);
    }

    console.groupEnd();
  }
}
