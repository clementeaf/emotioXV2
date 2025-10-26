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
  // Admin (administración de usuarios)
  { pathPattern: /^\/admin/, controllerType: 'admin' },

  // Auth
  { pathPattern: /^\/auth/, controllerType: 'auth' },

  // Companies (NUEVA RUTA)
  { pathPattern: /^\/companies/, controllerType: 'companies' },

  // Educational Content
  { pathPattern: /^\/educational-content/, controllerType: 'educational-content' },

  // Welcome Screen (maneja /research/{id}/welcome-screen y /research/{id}/welcome-screen/{screenId})
  { pathPattern: /^\/research\/[^\/]+\/welcome-screen(\/[^\/]+)?$/, controllerType: 'welcome-screen' },

  // Thank You Screen
  { pathPattern: /^\/research\/[^\/]+\/thank-you-screen(\/[^\/]+)?$/, controllerType: 'thank-you-screen' },

  // Eye Tracking Recruit - Corregir patrón para que coincida con la ruta real
  { pathPattern: /^\/eye-tracking-recruit\/research\/[^\/]+/, controllerType: 'eye-tracking-recruit' },

  // Eye Tracking (Base)
  { pathPattern: /^\/research\/[^\/]+\/eye-tracking/, controllerType: 'eye-tracking' },

  // Smart VOC Form (Modificado para capturar ID opcional)
  { pathPattern: /^\/research\/[^\/]+\/smart-voc(\/[^\/]+)?$/, controllerType: 'smart-voc' },

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

  // IAT Test Execution - DEBE IR ANTES de las rutas IAT básicas
  { pathPattern: /^\/iat\/test\/start/, controllerType: 'iat-test-execution' },
  { pathPattern: /^\/iat\/test\/response/, controllerType: 'iat-test-execution' },
  { pathPattern: /^\/iat\/test\/session\/[^\/]+/, controllerType: 'iat-test-execution' },

  // IAT Performance Optimization - DEBE IR ANTES de las rutas IAT básicas
  { pathPattern: /^\/iat\/optimized-analysis/, controllerType: 'iat-performance' },
  { pathPattern: /^\/iat\/performance-stats/, controllerType: 'iat-performance' },
  { pathPattern: /^\/iat\/performance\/clean-cache/, controllerType: 'iat-performance' },
  { pathPattern: /^\/iat\/performance\/batch-sessions/, controllerType: 'iat-performance' },
  { pathPattern: /^\/iat\/performance\/participant\/[^\/]+\/sessions/, controllerType: 'iat-performance' },

  // IAT Analysis (Python Bridge) - DEBE IR ANTES de las rutas IAT básicas
  { pathPattern: /^\/iat\/advanced-analysis/, controllerType: 'iat-analysis' },
  { pathPattern: /^\/iat\/analyze/, controllerType: 'iat-analysis' },
  { pathPattern: /^\/iat\/python-status/, controllerType: 'iat-analysis' },

  // IAT (Implicit Association Test) - DEBE IR ANTES de config
  { pathPattern: /^\/iat\/test-configs/, controllerType: 'iat' },
  { pathPattern: /^\/iat\/sessions/, controllerType: 'iat' },
  { pathPattern: /^\/iat\/results/, controllerType: 'iat' },
  { pathPattern: /^\/iat\/statistics/, controllerType: 'iat' },
  { pathPattern: /^\/iat/, controllerType: 'iat' },

  // Eye Tracking Unificado (Eyedid SDK + Ogama) - RUTAS OPTIMIZADAS
  { pathPattern: /^\/eye-tracking\/start/, controllerType: 'unified-eye-tracking' },
  { pathPattern: /^\/eye-tracking\/stop/, controllerType: 'unified-eye-tracking' },
  { pathPattern: /^\/eye-tracking\/saliency/, controllerType: 'unified-eye-tracking' },
  { pathPattern: /^\/eye-tracking\/stats/, controllerType: 'unified-eye-tracking' },
  { pathPattern: /^\/eye-tracking/, controllerType: 'unified-eye-tracking' },

  // Ogama Integration (Análisis Avanzado) - RUTAS ESPECÍFICAS
  { pathPattern: /^\/ogama\/analyze/, controllerType: 'ogama-integration' },
  { pathPattern: /^\/ogama\/multi-device/, controllerType: 'ogama-integration' },
  { pathPattern: /^\/ogama\/devices/, controllerType: 'ogama-integration' },
  { pathPattern: /^\/ogama\/status/, controllerType: 'ogama-integration' },
  { pathPattern: /^\/ogama/, controllerType: 'ogama-integration' },

  // Añadir más definiciones de ruta aquí...
];
