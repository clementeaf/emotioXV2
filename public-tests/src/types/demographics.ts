// Interfaz para la configuración de preguntas demográficas
export interface DemographicConfig {
  id: string;
  enabled: boolean;
  required: boolean;
  order?: number;
  title?: string;
  description?: string;
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
  [key: string]: any;
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

// Ejemplo de configuración por defecto
export const DEFAULT_DEMOGRAPHICS_CONFIG: DemographicsSection = {
  enabled: true,
  title: 'Preguntas demográficas',
  description: 'Por favor, responde a las siguientes preguntas para ayudarnos a entender mejor a nuestros usuarios.',
  questions: {
    age: { id: 'age', enabled: true, required: true, title: 'Edad' },
    gender: { id: 'gender', enabled: true, required: true, title: 'Género' },
    education: { id: 'education', enabled: true, required: false, title: 'Nivel educativo' },
    occupation: { id: 'occupation', enabled: false, required: false, title: 'Ocupación' },
    income: { id: 'income', enabled: false, required: false, title: 'Nivel de ingresos' },
    location: { id: 'location', enabled: true, required: false, title: 'Ubicación' },
    ethnicity: { id: 'ethnicity', enabled: false, required: false, title: 'Etnia' },
    language: { id: 'language', enabled: true, required: false, title: 'Idioma principal' }
  }
}; 