/**
 * Utilidades para formateo y manipulación de fechas
 */

/**
 * Formatea una fecha en formato español (DD-MM-YYYY)
 * @param dateString - String de fecha a formatear
 * @returns Fecha formateada en formato DD-MM-YYYY
 */
export const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toLocaleDateString('es-ES', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  }).replace(/\//g, '-');
};

/**
 * Formatea una fecha en formato largo español
 * @param dateString - String de fecha a formatear
 * @returns Fecha formateada en formato largo
 */
export const formatDateLong = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toLocaleDateString('es-ES', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
};

/**
 * Obtiene fecha relativa (hace X días)
 * @param dateString - String de fecha
 * @returns String con tiempo relativo
 */
export const getRelativeTime = (dateString: string): string => {
  const date = new Date(dateString);
  const now = new Date();
  const diffTime = Math.abs(now.getTime() - date.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays === 1) return 'Hace 1 día';
  if (diffDays < 7) return `Hace ${diffDays} días`;
  if (diffDays < 30) return `Hace ${Math.ceil(diffDays / 7)} semanas`;
  return formatDate(dateString);
};
