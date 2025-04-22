/**
 * Archivo centralizado de rutas para la aplicación
 * Contiene todas las rutas disponibles como constantes para evitar errores de tipeo
 */

// Rutas públicas
export const PUBLIC_ROUTES = {
  HOME: '/',
  LOGIN: '/login',
  REGISTER: '/register',
  FORGOT_PASSWORD: '/forgot-password',
  RESET_PASSWORD: '/reset-password'
};

// Rutas del dashboard autenticadas
export const DASHBOARD_ROUTES = {
  DASHBOARD: '/dashboard',
  PROFILE: '/dashboard/profile',
  SETTINGS: '/dashboard/settings'
};

// Rutas para investigación
export const RESEARCH_ROUTES = {
  LIST: '/research',
  CREATE: '/research/create',
  EDIT: (id: string) => `/research/edit/${id}`,
  VIEW: (id: string) => `/research/view/${id}`
};

// Rutas para pantallas de bienvenida
export const WELCOME_SCREEN_ROUTES = {
  LIST: '/welcome-screens',
  CREATE: '/welcome-screens/create',
  EDIT: (id: string) => `/welcome-screens/edit/${id}`,
  VIEW: (id: string) => `/welcome-screens/view/${id}`
};

// Rutas para pantallas de agradecimiento
export const THANK_YOU_SCREEN_ROUTES = {
  LIST: '/thank-you-screens',
  CREATE: '/thank-you-screens/create',
  EDIT: (id: string) => `/thank-you-screens/edit/${id}`,
  VIEW: (id: string) => `/thank-you-screens/view/${id}`
};

// Rutas para tareas cognitivas
export const COGNITIVE_TASK_ROUTES = {
  LIST: '/cognitive-tasks',
  CREATE: '/cognitive-tasks/create',
  EDIT: (id: string) => `/cognitive-tasks/edit/${id}`,
  VIEW: (id: string) => `/cognitive-tasks/view/${id}`
};

// Rutas para eye tracking
export const EYE_TRACKING_ROUTES = {
  LIST: '/eye-tracking',
  CREATE: '/eye-tracking/create',
  EDIT: (id: string) => `/eye-tracking/edit/${id}`,
  VIEW: (id: string) => `/eye-tracking/view/${id}`
};

// Rutas para participantes
export const PARTICIPANT_ROUTES = {
  LIST: '/participants',
  CREATE: '/participants/create',
  EDIT: (id: string) => `/participants/edit/${id}`,
  VIEW: (id: string) => `/participants/view/${id}`
};

// Rutas para SmartVOC
export const SMART_VOC_ROUTES = {
  LIST: '/smart-voc',
  CREATE: '/smart-voc/create',
  EDIT: (id: string) => `/smart-voc/edit/${id}`,
  VIEW: (id: string) => `/smart-voc/view/${id}`
};

// Función helper para obtener una ruta basada en su nombre
export function getRoute(routeName: string, id?: string): string {
  const allRoutes = {
    ...PUBLIC_ROUTES,
    ...DASHBOARD_ROUTES,
    ...RESEARCH_ROUTES,
    ...WELCOME_SCREEN_ROUTES,
    ...THANK_YOU_SCREEN_ROUTES,
    ...COGNITIVE_TASK_ROUTES,
    ...EYE_TRACKING_ROUTES,
    ...PARTICIPANT_ROUTES,
    ...SMART_VOC_ROUTES
  };

  const route = allRoutes[routeName as keyof typeof allRoutes];
  
  if (typeof route === 'function' && id) {
    return route(id);
  }
  
  return route as string || '/';
}

export default {
  PUBLIC_ROUTES,
  DASHBOARD_ROUTES,
  RESEARCH_ROUTES,
  WELCOME_SCREEN_ROUTES,
  THANK_YOU_SCREEN_ROUTES,
  COGNITIVE_TASK_ROUTES,
  EYE_TRACKING_ROUTES,
  PARTICIPANT_ROUTES,
  SMART_VOC_ROUTES,
  getRoute
}; 