// public-tests/src/types/smart-voc.interface.ts

// Interfaz base para la configuración de cualquier pregunta de escala
export interface BaseScaleConfig {
  scaleRange: { start: number; end: number };
  startLabel?: string; // Etiqueta para el inicio de la escala (ej. "Muy fácil", "Poco valor")
  endLabel?: string;   // Etiqueta para el final de la escala (ej. "Muy difícil", "Mucho valor")
  // Podrías añadir más campos comunes a todas las escalas aquí
}

// Configuración específica para CES (Customer Effort Score)
export interface CESConfig extends BaseScaleConfig {
  // CES típicamente usa escala 1-7. Los labels pueden ser "Muy fácil" / "Muy difícil".
  // No necesita campos adicionales por ahora, pero se puede extender.
}

// Configuración específica para CV (Customer Value)
export interface CVConfig extends BaseScaleConfig {
  // CV puede usar diferentes escalas (ej. 1-5, 1-7, 1-10). Labels: "Poco valor" / "Mucho valor".
}

// Configuración específica para NPS (Net Promoter Score)
export interface NPSConfig extends BaseScaleConfig {
  // NPS típicamente usa escala 0-10. Labels: "Nada probable" / "Extremadamente probable".
}

// Configuración específica para CSAT (Customer Satisfaction)
// Aunque CSATView es diferente, definimos su config por consistencia si es necesario en otro lugar.
export interface CSATConfig {
  scaleSize?: 5 | 7; // CSAT puede ser 1-5 o 1-7
  companyName?: string;
  // Otros campos específicos de CSAT si los hay
}

// Interfaz principal para una pregunta SmartVOC
// Esta es la que `questionConfig` en los componentes de pregunta recibirá.
export interface SmartVOCQuestion {
  id: string;                // ID único de la pregunta/paso (ej. "ces_1", "cv_valor_producto")
  type: string;              // Tipo de pregunta (ej. "smartvoc_ces", "smartvoc_cv", "smartvoc_nps", "smartvoc_csat")
  title?: string;             // Título principal/interno de la pregunta (útil para logs, nombres de API)
  description?: string;       // El texto/pregunta principal que se muestra al usuario
  instructions?: string;      // Instrucciones adicionales para el usuario
  required?: boolean;         // Si la pregunta es obligatoria
  companyName?: string;       // Para CSAT, si se usa [company] en el texto
  
  // `config` contendrá la configuración específica del tipo de pregunta
  config: CESConfig | CVConfig | NPSConfig | CSATConfig | any; // Usar 'any' como fallback temporal si hay otros tipos no definidos aquí
} 