// Interfaz para la configuración de preguntas demográficas
export interface DemographicConfig {
  id: string;
  enabled: boolean;
  required: boolean;
  order?: number;
  title?: string;
  description?: string;
  options?: SelectOption[];
}

// Configuración específica para cada tipo de pregunta demográfica
export interface DemographicQuestions {
  age: DemographicConfig;
  gender: DemographicConfig;
  education: DemographicConfig;
  occupation: DemographicConfig;
  income: DemographicConfig;
  location: DemographicConfig;
  ethnicity: DemographicConfig;
  language: DemographicConfig;
  // Se pueden añadir más según sea necesario
}

// Interfaz completa para la sección de preguntas demográficas
export interface DemographicsSection {
  enabled: boolean;
  title: string;
  description?: string;
  questions: DemographicQuestions;
}

// Respuestas a las preguntas demográficas
export interface DemographicResponses {
  age?: string | number;
  gender?: string;
  education?: string;
  occupation?: string;
  income?: string;
  location?: string;
  ethnicity?: string;
  language?: string;
  // Otras respuestas
  [key: string]: unknown;
}

// Tipo para las opciones disponibles en preguntas de selección
export interface SelectOption {
  value: string;
  label: string;
}

// Opciones predefinidas para algunos campos
export const GENDER_OPTIONS: SelectOption[] = [
  { value: 'male', label: 'Masculino' },
  { value: 'female', label: 'Femenino' },
  { value: 'non_binary', label: 'No binario' },
  { value: 'other', label: 'Otro' },
  { value: 'prefer_not_to_say', label: 'Prefiero no decirlo' }
];

export const EDUCATION_OPTIONS: SelectOption[] = [
  { value: 'primary', label: 'Educación primaria' },
  { value: 'secondary', label: 'Educación secundaria' },
  { value: 'high_school', label: 'Bachillerato' },
  { value: 'technical', label: 'Educación técnica' },
  { value: 'university', label: 'Universidad' },
  { value: 'postgraduate', label: 'Postgrado' },
  { value: 'doctorate', label: 'Doctorado' },
  { value: 'other', label: 'Otro' }
];

export interface DemographicResponse {
  value: string | string[];
  timestamp: number;
}

export interface DemographicResponseData {
  [questionId: string]: DemographicResponse;
}

// Interfaz para definir la estructura de un 'step' dentro de all_steps
export interface StepDefinition {
  stepType?: string;
  type?: string;
  response?: unknown;
  id?: string;
  // Añade aquí otras propiedades que pueda tener un 'step' si son conocidas
}

// Tipo para la respuesta de getDemographicResponses
export interface DemographicDataPayload {
  responses: DemographicResponseData;
  documentId: string | null;
  demographicModuleResponseId: string | null;
}