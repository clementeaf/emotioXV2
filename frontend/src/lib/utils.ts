import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Combina múltiples clases de Tailwind de manera inteligente,
 * resolviendo conflictos y optimizando la salida.
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Verifica si la aplicación está ejecutándose en modo desarrollo
 * @returns boolean indicando si estamos en desarrollo
 */
export function isDevelopmentMode(): boolean {
  // Solo usar NODE_ENV para determinar si estamos en desarrollo
  if (typeof process !== 'undefined' && process.env.NODE_ENV) {
    return process.env.NODE_ENV === 'development';
  }

  // Si no hay NODE_ENV, asumir que no estamos en desarrollo
  return false;
}

/**
 * Verifica si deberíamos usar el modo offline/simulado
 * @returns boolean indicando si usar modo simulado
 */
export function shouldUseSimulatedMode(): boolean {
  // Siempre devolver false para usar la API real en todo momento
  return false;
}

/**
 * Funciones de utilidad para fechas
 */

/**
 * Utilitario para formatear fechas
 * @param date Fecha a formatear
 * @returns Fecha formateada
 */
export function formatDate(date: Date | string): string {
  if (!date) {
    return '';
  }
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString('es-ES', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

/**
 * Retrasa la ejecución por un número de milisegundos
 * @param ms Milisegundos a esperar
 * @returns Promise que se resuelve después del tiempo especificado
 */
export function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Genera un ID único
 * @returns String con ID único
 */
export function generateId(): string {
  return Math.random().toString(36).substring(2, 11);
}

/**
 * Formatea una fecha como string en formato largo localizado
 * @param dateString - String ISO de fecha o instancia de Date
 * @param locale - Código de localización (por defecto 'es')
 * @returns Fecha formateada según la localización, incluyendo hora
 */
export function formatDateLong(dateString: string | Date, locale: string = 'es'): string {
  const date = dateString instanceof Date ? dateString : new Date(dateString);

  return new Intl.DateTimeFormat(locale, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }).format(date);
}

/**
 * Obtiene tiempo relativo (hace X minutos, hace X horas, etc.)
 * @param dateString - String ISO de fecha o instancia de Date
 * @param locale - Código de localización (por defecto 'es')
 * @returns String con el tiempo relativo
 */
export function getTimeAgo(dateString: string | Date, locale: string = 'es'): string {
  const date = dateString instanceof Date ? dateString : new Date(dateString);
  const now = new Date();
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  // Si es futuro, retornar string en localización española o inglesa
  if (seconds < 0) {
    return locale === 'es' ? 'en el futuro' : 'in the future';
  }

  // Intervalos de tiempo en segundos
  const intervals = {
    year: 31536000,
    month: 2592000,
    week: 604800,
    day: 86400,
    hour: 3600,
    minute: 60,
    second: 1
  };

  // Textos según localización
  const timeTexts = {
    es: {
      year: ['año', 'años'],
      month: ['mes', 'meses'],
      week: ['semana', 'semanas'],
      day: ['día', 'días'],
      hour: ['hora', 'horas'],
      minute: ['minuto', 'minutos'],
      second: ['segundo', 'segundos'],
      ago: 'hace'
    },
    en: {
      year: ['year', 'years'],
      month: ['month', 'months'],
      week: ['week', 'weeks'],
      day: ['day', 'days'],
      hour: ['hour', 'hours'],
      minute: ['minute', 'minutes'],
      second: ['second', 'seconds'],
      ago: 'ago'
    }
  };

  // Usar español por defecto, o inglés si se especifica
  const texts = locale === 'es' ? timeTexts.es : timeTexts.en;

  // Encontrar el intervalo más apropiado
  for (const [key, value] of Object.entries(intervals)) {
    const interval = Math.floor(seconds / value);
    if (interval >= 1) {
      const textKey = key as keyof typeof texts;
      const plural = interval === 1 ? 0 : 1;

      // Construir frase según localización
      return locale === 'es'
        ? `${texts.ago} ${interval} ${texts[textKey][plural]}`
        : `${interval} ${texts[textKey][plural]} ${texts.ago}`;
    }
  }

  return locale === 'es' ? 'ahora mismo' : 'just now';
}
