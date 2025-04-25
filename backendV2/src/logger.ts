import pino from 'pino';

// Inicializar y exportar Pino Logger
const logger = pino({
  level: process.env.NODE_ENV === 'production' ? 'info' : 'debug', // Nivel según entorno
  base: { // Añadir contexto útil
    lambdaFunctionName: process.env.LAMBDA_FUNCTION_NAME || 'unknown',
  },
  // Opciones adicionales de Pino según necesidad (ej. redactar datos sensibles)
});

export default logger; 