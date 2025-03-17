import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Utilidad para combinar nombres de clases de Tailwind CSS
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Verifica si la aplicación está ejecutándose en modo desarrollo
 * @returns boolean indicando si estamos en desarrollo
 */
export function isDevelopmentMode(): boolean {
  if (typeof process !== 'undefined' && process.env.NODE_ENV) {
    return process.env.NODE_ENV === 'development';
  }
  
  if (typeof window !== 'undefined') {
    const hostname = window.location.hostname;
    return hostname === 'localhost' || hostname === '127.0.0.1';
  }
  
  return false;
}

/**
 * Verifica si deberíamos usar el modo offline/simulado
 * @returns boolean indicando si usar modo simulado
 */
export function shouldUseSimulatedMode(): boolean {
  // Si estamos en desarrollo, por defecto usamos modo simulado
  // a menos que explícitamente se indique lo contrario
  if (isDevelopmentMode()) {
    if (typeof window !== 'undefined') {
      // Si el flag no existe, consideramos que debe usar simulación por defecto
      return localStorage.getItem('use_simulated_api') !== 'false';
    }
    // En desarrollo sin acceso a localStorage, usar simulación por defecto
    return true;
  }
  
  return false;
}

/**
 * Funciones de utilidad para fechas
 */

/**
 * Formatea una fecha como string en formato corto localizado
 * @param dateString - String ISO de fecha o instancia de Date
 * @param locale - Código de localización (por defecto 'es')
 * @returns Fecha formateada según la localización
 */
export function formatDate(dateString: string | Date, locale: string = 'es'): string {
  const date = dateString instanceof Date ? dateString : new Date(dateString);
  
  return new Intl.DateTimeFormat(locale, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }).format(date);
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