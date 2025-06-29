import { useParticipantStore } from '../stores/participantStore';

/**
 * Interfaz para la información del dispositivo
 */
export interface DeviceInfo {
  deviceType: 'mobile' | 'tablet' | 'desktop';
  userAgent: string;
  screenWidth: number;
  screenHeight: number;
  platform: string;
  language: string;
}

/**
 * Interfaz para la información de ubicación
 */
export interface LocationInfo {
  latitude?: number;
  longitude?: number;
  city?: string;
  country?: string;
  region?: string;
  ipAddress?: string;
}

/**
 * Interfaz para la información de tiempos
 */
export interface TimingInfo {
  startTime?: number;
  endTime?: number;
  duration?: number;
  sectionTimings?: Array<{
    sectionId: string;
    startTime: number;
    endTime?: number;
    duration?: number;
  }>;
}

/**
 * Interfaz para la información de sesión
 */
export interface SessionInfo {
  reentryCount?: number;
  sessionStartTime?: number;
  lastVisitTime?: number;
  totalSessionTime?: number;
  isFirstVisit?: boolean;
}

/**
 * Interfaz para la información técnica
 */
export interface TechnicalInfo {
  browser?: string;
  browserVersion?: string;
  os?: string;
  osVersion?: string;
  connectionType?: string;
  timezone?: string;
}

/**
 * Interfaz completa de metadata
 */
export interface ResponseMetadata {
  deviceInfo?: DeviceInfo;
  locationInfo?: LocationInfo;
  timingInfo?: TimingInfo;
  sessionInfo?: SessionInfo;
  technicalInfo?: TechnicalInfo;
}

/**
 * Obtiene información del dispositivo del navegador
 */
export function getDeviceInfo(): DeviceInfo {
  const ua = navigator.userAgent;
  let deviceType: 'mobile' | 'tablet' | 'desktop' = 'desktop';

  if (/Mobi|Android|iPhone|iPad|iPod|Opera Mini|IEMobile|WPDesktop/i.test(ua)) {
    deviceType = /iPad|Tablet|PlayBook|Silk/i.test(ua) ? 'tablet' : 'mobile';
  }

  return {
    deviceType,
    userAgent: ua,
    screenWidth: window.screen.width,
    screenHeight: window.screen.height,
    platform: navigator.platform,
    language: navigator.language
  };
}

/**
 * Obtiene información técnica del navegador
 */
export function getTechnicalInfo(): TechnicalInfo {
  const ua = navigator.userAgent;

  // Detectar navegador
  let browser = 'Unknown';
  let browserVersion = '';

  if (ua.includes('Chrome')) {
    browser = 'Chrome';
    const match = ua.match(/Chrome\/(\d+)/);
    browserVersion = match ? match[1] : '';
  } else if (ua.includes('Firefox')) {
    browser = 'Firefox';
    const match = ua.match(/Firefox\/(\d+)/);
    browserVersion = match ? match[1] : '';
  } else if (ua.includes('Safari')) {
    browser = 'Safari';
    const match = ua.match(/Version\/(\d+)/);
    browserVersion = match ? match[1] : '';
  } else if (ua.includes('Edge')) {
    browser = 'Edge';
    const match = ua.match(/Edge\/(\d+)/);
    browserVersion = match ? match[1] : '';
  }

  // Detectar OS
  let os = 'Unknown';
  let osVersion = '';

  if (ua.includes('Windows')) {
    os = 'Windows';
    const match = ua.match(/Windows NT (\d+\.\d+)/);
    osVersion = match ? match[1] : '';
  } else if (ua.includes('Mac')) {
    os = 'macOS';
    const match = ua.match(/Mac OS X (\d+_\d+)/);
    osVersion = match ? match[1].replace('_', '.') : '';
  } else if (ua.includes('Linux')) {
    os = 'Linux';
  } else if (ua.includes('Android')) {
    os = 'Android';
    const match = ua.match(/Android (\d+\.\d+)/);
    osVersion = match ? match[1] : '';
  } else if (ua.includes('iOS')) {
    os = 'iOS';
    const match = ua.match(/OS (\d+_\d+)/);
    osVersion = match ? match[1].replace('_', '.') : '';
  }

  return {
    browser,
    browserVersion,
    os,
    osVersion,
    connectionType: (navigator as any).connection?.effectiveType || 'unknown',
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
  };
}

/**
 * Obtiene información de ubicación (solo si el usuario da permiso)
 */
export async function getLocationInfo(): Promise<LocationInfo> {
  try {
    // Verificar si la geolocalización está soportada
    if (typeof navigator === 'undefined' || !('geolocation' in navigator)) {
      console.log('Geolocalización no soportada en este navegador');
      return await getLocationByIP();
    }

    // Intentar obtener ubicación precisa
    const position = await new Promise<GeolocationPosition>((resolve, reject) => {
      navigator.geolocation.getCurrentPosition(resolve, reject, {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 60000
      });
    });

    // Obtener información adicional por IP para completar los datos
    const ipInfo = await getLocationByIP();

    return {
      latitude: position.coords.latitude,
      longitude: position.coords.longitude,
      city: ipInfo.city,
      country: ipInfo.country,
      region: ipInfo.region,
      ipAddress: ipInfo.ipAddress
    };
  } catch (error) {
    console.log('No se pudo obtener ubicación precisa:', error);

    // Fallback a ubicación por IP
    try {
      return await getLocationByIP();
    } catch (ipError) {
      console.log('Fallback a IP también falló:', ipError);
      return {};
    }
  }
}

/**
 * Obtiene ubicación aproximada por IP
 */
async function getLocationByIP(): Promise<LocationInfo> {
  try {
    const response = await fetch('https://ipapi.co/json/');
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();

    return {
      city: data.city,
      country: data.country_name,
      region: data.region,
      ipAddress: data.ip
    };
  } catch (error) {
    console.warn('No se pudo obtener ubicación por IP:', error);
    return {};
  }
}

/**
 * Obtiene información de sesión desde el store
 */
export function getSessionInfo(): SessionInfo {
  const reentryCount = useParticipantStore.getState().reentryCount;
  const startTime = useParticipantStore.getState().responsesData.startTime;
  const researchId = useParticipantStore.getState().researchId;
  const participantId = useParticipantStore.getState().participantId;

  // Obtener información adicional de localStorage si está disponible
  let sessionStartTime = startTime;
  let lastVisitTime = Date.now();

  if (typeof window !== 'undefined') {
    const baseKey = `reentry_${researchId || 'unknown'}_${participantId || 'unknown'}`;

    // Obtener timestamp de primera visita
    const firstVisitKey = `${baseKey}_firstVisit`;
    const storedFirstVisit = localStorage.getItem(firstVisitKey);
    if (storedFirstVisit) {
      sessionStartTime = parseInt(storedFirstVisit, 10);
    }

    // Obtener timestamp de última visita
    const lastVisitKey = `${baseKey}_lastVisit`;
    const storedLastVisit = localStorage.getItem(lastVisitKey);
    if (storedLastVisit) {
      lastVisitTime = parseInt(storedLastVisit, 10);
    }
  }

  return {
    reentryCount,
    sessionStartTime,
    lastVisitTime,
    totalSessionTime: Date.now() - sessionStartTime,
    isFirstVisit: reentryCount === 0
  };
}

/**
 * Obtiene información de tiempos desde el store
 */
export function getTimingInfo(): TimingInfo {
  const responsesData = useParticipantStore.getState().responsesData;

  return {
    startTime: responsesData.startTime,
    endTime: responsesData.endTime,
    duration: responsesData.endTime ? responsesData.endTime - responsesData.startTime : undefined,
    sectionTimings: responsesData.sectionTimings?.map(timing => ({
      sectionId: timing.sectionId,
      startTime: timing.start,
      endTime: timing.end,
      duration: timing.duration
    }))
  };
}

/**
 * Recolecta toda la metadata disponible para una respuesta
 */
export async function collectResponseMetadata(): Promise<ResponseMetadata> {
  const deviceInfo = getDeviceInfo();
  const technicalInfo = getTechnicalInfo();
  const sessionInfo = getSessionInfo();
  const timingInfo = getTimingInfo();

  // Intentar obtener ubicación (puede fallar si el usuario no da permiso)
  let locationInfo: LocationInfo = {};
  try {
    locationInfo = await getLocationInfo();
  } catch (error) {
    console.log('No se pudo obtener información de ubicación:', error);
  }

  return {
    deviceInfo,
    locationInfo,
    timingInfo,
    sessionInfo,
    technicalInfo
  };
}
