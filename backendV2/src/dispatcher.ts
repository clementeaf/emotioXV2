import logger from './logger';

// Cache para handlers cargados
const handlers: Record<string, any> = {};

// Mapa de importadores dinámicos para los controladores
const controllerImports = {
  'auth': () => import('./controllers/auth.controller'),
  'companies': () => import('./controllers/company.controller'),
  'research': () => import('./controllers/newResearch.controller'),
  'welcome-screen': () => import('./controllers/welcomeScreen.controller'),
  'thank-you-screen': () => import('./controllers/thankYouScreen.controller'),
  'eye-tracking': () => import('./controllers/eyeTracking.controller'),
  'eye-tracking-recruit': () => import('./controllers/eyeTrackingRecruit.controller'),
  'smart-voc': () => import('./controllers/smartVocForm.controller'),
  'cognitive-task': () => import('./controllers/cognitiveTask.controller'),
  'module-responses': () => import('./controllers/moduleResponse.controller'),
  'researchInProgress': () => import('./controllers/researchInProgress.controller'),
  'researchForms': () => import('./controllers/getResearchAvailableForms'),
  's3': () => import('./controllers/s3.controller'),
  'participants': () => import('./controllers/participant.controller'),
  'monitoring': () => import('./controllers/monitoring.controller'),
  'websocket': () => import('./controllers/websocket.controller'),
};

// Función para obtener un handler de forma lazy
export async function getHandler(type: string): Promise<Function | null> {
  if (handlers[type]) return handlers[type];

  // Buscar en el mapa de importadores
  const importer = controllerImports[type as keyof typeof controllerImports];

  if (importer) {
    try {
      const module: any = await importer();
      let handler: Function | undefined;

      // Lógica para encontrar el handler (prioriza 'handler', luego busca primera función)
      if (typeof module.handler === 'function') {
        handler = module.handler;
        logger.info(`Usando exportación 'handler' para ${type}`);
      } else {
        for (const key in module) {
          if (typeof module[key] === 'function') {
            handler = module[key];
            logger.info(`Usando la primera función exportada encontrada ('${key}') para ${type}`);
            break;
          }
        }
      }
      if (!handler && typeof module === 'function') {
        handler = module;
        logger.info(`Usando el módulo exportado directamente como handler para ${type}`);
      }

      if (handler) {
        logger.info(`Controlador listo para ${type}`);
        handlers[type] = handler;
        return handler;
      } else {
        logger.error(`No se encontró una función handler exportada válida en el módulo para ${type}`);
        return null;
      }
    } catch (error) {
      logger.error({ err: error, controllerType: type }, `Error al cargar dinámicamente el controlador ${type}`);
      // Propagar más detalles del error
      console.error(`Error detallado al cargar ${type}:`, error);
      throw error; // Propagar el error para mejor debugging
    }
  } else {
    logger.error(`Tipo de controlador desconocido: ${type}`);
    return null;
  }
}
