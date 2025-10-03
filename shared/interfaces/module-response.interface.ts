/**
 * Tipos de respuestas posibles para los diferentes módulos
 */
export type ModuleResponseValue =
  | string
  | string[]
  | number
  | boolean
  | Record<string, string | number | boolean | null>
  | null;

/**
 * Interfaz para una respuesta individual de un módulo
 */
export interface ModuleResponse {
  /**
   * Identificador único de la respuesta
   */
  id: string;

  /**
   * Tipo de módulo respondido
   */
  stepType: string;

  /**
   * Título del módulo
   */
  stepTitle: string;

  /**
   * Valor de la respuesta (puede ser de diversos tipos según el módulo)
   */
  response: ModuleResponseValue;

  /**
   * Timestamp de cuándo se creó la respuesta
   */
  createdAt: string;

  /**
   * Timestamp de cuándo se actualizó la respuesta (si aplica)
   */
  updatedAt?: string;
}

/**
 * Interfaz para el documento completo de respuestas de un participante
 */
export interface ParticipantResponsesDocument {
  /**
   * Identificador único del documento
   */
  id: string;

  /**
   * Identificador del research
   */
  researchId: string;

  /**
   * Identificador del participante
   */
  participantId: string;

  /**
   * Array de respuestas a módulos
   */
  responses: ModuleResponse[];

  /**
   * Timestamp de cuándo se creó el documento
   */
  createdAt: string;

  /**
   * Timestamp de cuándo se actualizó por última vez
   */
  updatedAt: string;

  /**
   * Indica si el flujo de respuestas está completo
   */
  isCompleted: boolean;
}

/**
 * Interfaz para crear una nueva respuesta
 */
export interface CreateModuleResponseDto {
  researchId: string;
  participantId: string;
  stepType: string;
  stepTitle: string;
  response: ModuleResponseValue;
}

/**
 * Interfaz para actualizar una respuesta existente
 */
export interface UpdateModuleResponseDto {
  response: ModuleResponseValue;
}

/**
 * Interfaz para una respuesta individual en el formato agrupado por pregunta
 */
export interface QuestionResponse {
  /**
   * ID del participante que dio esta respuesta
   */
  participantId: string;

  /**
   * Valor de la respuesta (puede ser de diversos tipos según el módulo)
   */
  value: ModuleResponseValue;

  /**
   * Timestamp de cuándo se dio la respuesta
   */
  timestamp: string;

  /**
   * Metadata específica de la respuesta
   */
  metadata: Record<string, string | number | boolean | null>;

  /**
   * Timestamp de cuándo se creó la respuesta
   */
  createdAt: string;

  /**
   * Timestamp de cuándo se actualizó la respuesta (si aplica)
   */
  updatedAt?: string;
}

/**
 * Interfaz para una pregunta con todas las respuestas de todos los participantes
 */
export interface QuestionWithResponses {
  /**
   * Clave única de la pregunta
   */
  questionKey: string;

  /**
   * Array de respuestas de todos los participantes para esta pregunta
   */
  responses: QuestionResponse[];
}

/**
 * Interfaz para la respuesta del endpoint de respuestas agrupadas por pregunta
 */
export interface GroupedResponsesResponse {
  /**
   * Array de preguntas con sus respuestas
   */
  data: QuestionWithResponses[];

  /**
   * Código de estado HTTP
   */
  status: number;
}
