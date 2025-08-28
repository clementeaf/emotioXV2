/**
 * Biblioteca de API para endpoints de debug en desarrollo
 * IMPORTANTE: Estos endpoints solo funcionan en el entorno de desarrollo
 */

/**
 * Utilidades simplificadas para desarrollo
 */

/**
 * Verifica si estamos en un entorno de desarrollo local
 */
export const isLocalDevelopment = (): boolean => {
  if (typeof window === 'undefined') {return false;}
  return process.env.NODE_ENV === 'development';
};

/**
 * Obtiene un token de desarrollo para pruebas
 */
export const getDevToken = async (): Promise<string> => {
  if (!isLocalDevelopment()) {
    throw new Error('Esta función solo debe usarse en desarrollo local');
  }

  const response = await fetch('/api/debug/get-dev-token');
  const data = await response.json();

  if (data.success && data.token) {
    return data.token;
  }

  throw new Error('No se pudo obtener un token de desarrollo');
};

/**
 * Crea una investigación en modo de desarrollo/debug
 * @param data Datos básicos de la investigación
 * @returns Objeto con el ID de la investigación creada
 */
export const createResearch = async (data: any): Promise<{ id: string }> => {
  if (!isLocalDevelopment()) {
    throw new Error('Esta función solo debe usarse en desarrollo local');
  }

  // Generar un ID único para la investigación
  const id = `dev-research-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

  // Simular un retraso de red
  await new Promise(resolve => setTimeout(resolve, 800));

  // Guardar datos en localStorage para simular persistencia
  localStorage.setItem(`research_${id}`, JSON.stringify({
    id,
    ...data,
    createdAt: new Date().toISOString(),
    status: 'draft'
  }));


  // Devolver respuesta simulada
  return { id };
};
