/**
 * Definiciones de Rutas para el Router Principal
 *
 * El orden es importante: las rutas más específicas deben ir ANTES que las más generales.
 * Usamos expresiones regulares para patrones que incluyen parámetros o variaciones.
 */

export interface RouteDefinition {
  // Expresión regular para probar contra el event.path
  pathPattern: RegExp;
  // Identificador del controlador a cargar (coincide con las claves en getHandler)
  controllerType: string;
}

export const ROUTE_DEFINITIONS: RouteDefinition[] = [
  // Auth
  { pathPattern: /^\/auth/, controllerType: 'auth' },

  // Companies (NUEVA RUTA)
  { pathPattern: /^\/companies/, controllerType: 'companies' },

  // Welcome Screen (maneja /research/{id}/welcome-screen y /research/{id}/welcome-screen/{screenId})
  { pathPattern: /^\/research\/[^\/]+\/welcome-screen(\/[^\/]+)?$/, controllerType: 'welcome-screen' },

  // Thank You Screen
  { pathPattern: /^\/research\/[^\/]+\/thank-you-screen(\/[^\/]+)?$/, controllerType: 'thank-you-screen' },

  // Eye Tracking Recruit - Corregir patrón para que coincida con la ruta real
  { pathPattern: /^\/eye-tracking-recruit\/research\/[^\/]+/, controllerType: 'eye-tracking-recruit' },

  // Eye Tracking (Base)
  { pathPattern: /^\/research\/[^\/]+\/eye-tracking/, controllerType: 'eye-tracking' },

  // Smart VOC Form
  { pathPattern: /^\/research\/[^\/]+\/smart-voc/, controllerType: 'smart-voc' },

  // Cognitive Task (Modificado para capturar ID opcional)
  { pathPattern: /^\/research\/[^\/]+\/cognitive-task(\/[^\/]+)?$/, controllerType: 'cognitive-task' },

  // Module Responses (Para todos los módulos de public-tests)
  { pathPattern: /^\/module-responses(\/complete)?$/, controllerType: 'module-responses' },
  { pathPattern: /^\/module-responses\/grouped-by-question\/[^\/]+$/, controllerType: 'module-responses' },
  { pathPattern: /^\/module-responses\/[^\/]+$/, controllerType: 'module-responses' },
  { pathPattern: /^\/module-responses\/research\/[^\/]+$/, controllerType: 'module-responses' },

  // Module Responses - Rutas específicas para SmartVOC (DEBE IR ANTES de las rutas generales)
  { pathPattern: /^\/module-responses\/cpv\/[^\/]+$/, controllerType: 'module-responses' },
  { pathPattern: /^\/module-responses\/trustflow\/[^\/]+$/, controllerType: 'module-responses' },
  { pathPattern: /^\/module-responses\/smartvoc\/[^\/]+$/, controllerType: 'module-responses' },

  // Research Forms/Steps (NUEVA RUTA)
  { pathPattern: /^\/research\/[^\/]+\/forms$/, controllerType: 'researchForms' },

  // Research In Progress (NUEVAS RUTAS) - DEBE IR ANTES de la ruta general de research
  { pathPattern: /^\/research\/[^\/]+\/participants\/status$/, controllerType: 'researchInProgress' },
  { pathPattern: /^\/research\/[^\/]+\/metrics$/, controllerType: 'researchInProgress' },
  { pathPattern: /^\/research\/[^\/]+\/participants\/[^\/]+$/, controllerType: 'researchInProgress' },
  { pathPattern: /^\/research\/[^\/]+\/participants$/, controllerType: 'researchInProgress' },

  // Research (Ruta base - DEBE IR DESPUÉS de las rutas específicas de research)
  { pathPattern: /^\/research/, controllerType: 'research' },

  // S3 (Ajustar regex para download sin parámetro de ruta)
  { pathPattern: /^\/s3\/(upload|download|delete-object)$/, controllerType: 's3' },

  // Participants
  { pathPattern: /^\/participants/, controllerType: 'participants' },

  // Añadir más definiciones de ruta aquí...
];
