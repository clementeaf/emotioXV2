/**
 * Utilidad para generar identificadores únicos
 * Reemplaza la dependencia de 'uuid' con una implementación propia
 */

/**
 * Genera un ID único similar a UUIDv4
 * Esta es una implementación simple que no usa la biblioteca externa uuid
 */
export function generateUniqueId(): string {
  const s4 = (): string => 
    Math.floor((1 + Math.random()) * 0x10000)
      .toString(16)
      .substring(1);
  
  return `${s4()}${s4()}-${s4()}-${s4()}-${s4()}-${s4()}${s4()}${s4()}`;
}

// Para mantener compatibilidad con el código existente que usa uuidv4
export const uuidv4 = generateUniqueId; 