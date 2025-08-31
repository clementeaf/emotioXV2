import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { SmartVOCFormData, SmartVOCQuestion } from '../../../shared/interfaces/smart-voc.interface';
import {
    DEFAULT_THANK_YOU_SCREEN_VALIDATION,
    ThankYouScreenFormData
} from '../../../shared/interfaces/thank-you-screen.interface';
import { WelcomeScreenFormData } from '../../../shared/interfaces/welcome-screen.interface';
import { QuestionType } from '../../../shared/interfaces/question-types.enum';
import { NewResearch, ResearchType } from '../models/newResearch.model';
import { errorResponse } from './controller.utils';

// Constantes para mensajes de error comunes
export const ERROR_MESSAGES = {
  VALIDATION: {
    REQUIRED_FIELD: (fieldName: string) => `El campo ${fieldName} es requerido`,
    INVALID_FORMAT: (fieldName: string) => `El formato de ${fieldName} no es válido`,
    TOO_LONG: (fieldName: string, maxLength: number) => `${fieldName} no puede exceder los ${maxLength} caracteres`,
    TOO_SHORT: (fieldName: string, minLength: number) => `${fieldName} debe tener al menos ${minLength} caracteres`,
    EMPTY_ARRAY: (fieldName: string) => `${fieldName} debe contener al menos un elemento`,
    INVALID_TYPE: (fieldName: string, validTypes: string[]) =>
      `${fieldName} debe ser uno de los siguientes: ${validTypes.join(', ')}`,
    INVALID_RANGE: (fieldName: string) => `${fieldName} debe tener un rango válido`,
    MISSING_CONFIG: (fieldName: string) => `${fieldName} debe tener una configuración válida`
  },
  AUTH: {
    UNAUTHORIZED: 'Usuario no autenticado',
    FORBIDDEN: 'No tiene permisos para realizar esta operación'
  },
  RESOURCE: {
    NOT_FOUND: (resourceName: string) => `No se encontró ${resourceName}`,
    ALREADY_EXISTS: (resourceName: string) => `${resourceName} ya existe`
  },
  SERVER: {
    INTERNAL_ERROR: 'Error interno del servidor',
    DATABASE_ERROR: 'Error al acceder a la base de datos'
  }
};

/**
 * Clase para errores de validación
 */
export class ValidationError extends Error {
  public errors: Record<string, string>;

  constructor(message: string, errors: Record<string, string>) {
    super(message);
    this.name = 'ValidationError';
    this.errors = errors;
  }
}

/**
 * Valida los datos de una nueva investigación
 * @param data Datos a validar
 * @throws ValidationError si los datos no son válidos
 */
export function validateNewResearch(data: Partial<NewResearch>): void {
  const errors: Record<string, string> = {};

  // Validar campos obligatorios
  if (data.name !== undefined) {
    if (!data.name.trim()) {
      errors.name = 'El nombre de la investigación es obligatorio';
    } else if (data.name.length < 3) {
      errors.name = 'El nombre debe tener al menos 3 caracteres';
    } else if (data.name.length > 100) {
      errors.name = 'El nombre no puede exceder los 100 caracteres';
    }
  }

  if (data.enterprise !== undefined) {
    if (!data.enterprise.trim()) {
      errors.enterprise = 'La empresa es obligatoria';
    } else if (data.enterprise.length > 100) {
      errors.enterprise = 'El nombre de la empresa no puede exceder los 100 caracteres';
    }
  }

  if (data.type !== undefined) {
    const validTypes = Object.values(ResearchType);

    // Mapa para convertir los tipos mostrados en el frontend a los tipos del backend
    const typeMap: Record<string, ResearchType> = {
      'Behavioural Research': ResearchType.BEHAVIOURAL,
      'Eye Tracking': ResearchType.EYE_TRACKING,
      'Attention Prediction': ResearchType.ATTENTION_PREDICTION,
      'Cognitive Analysis': ResearchType.COGNITIVE_ANALYSIS
    };

    // Si el tipo está en el mapa, convertirlo al valor correcto
    if (typeMap[data.type as string]) {
      // Convertir automáticamente el tipo
      (data.type as any) = typeMap[data.type as string];
    }

    // Ahora validar contra los tipos válidos
    if (!validTypes.includes(data.type)) {
      errors.type = `El tipo debe ser uno de los siguientes: ${validTypes.join(', ')}`;
    }
  }

  if (data.technique !== undefined) {
    if (!data.technique.trim()) {
      errors.technique = 'La técnica es obligatoria';
    } else if (data.technique.length > 100) {
      errors.technique = 'La técnica no puede exceder los 100 caracteres';
    }
  }

  // Validar campos opcionales
  if (data.description !== undefined && data.description.length > 1000) {
    errors.description = 'La descripción no puede exceder los 1000 caracteres';
  }

  if (data.targetParticipants !== undefined) {
    if (isNaN(data.targetParticipants) || data.targetParticipants <= 0) {
      errors.targetParticipants = 'El número de participantes objetivo debe ser un número positivo';
    } else if (data.targetParticipants > 10000) {
      errors.targetParticipants = 'El número de participantes no puede exceder 10000';
    }
  }

  if (data.objectives !== undefined) {
    if (!Array.isArray(data.objectives)) {
      errors.objectives = 'Los objetivos deben ser una lista';
    } else {
      if (data.objectives.length > 10) {
        errors.objectives = 'No se pueden tener más de 10 objetivos';
      }

      for (let i = 0; i < data.objectives.length; i++) {
        const objective = data.objectives[i];
        if (typeof objective !== 'string') {
          errors.objectives = 'Todos los objetivos deben ser texto';
          break;
        } else if (objective.length > 200) {
          errors.objectives = `El objetivo ${i + 1} es demasiado largo (máximo 200 caracteres)`;
          break;
        }
      }
    }
  }

  if (data.tags !== undefined) {
    if (!Array.isArray(data.tags)) {
      errors.tags = 'Las etiquetas deben ser una lista';
    } else {
      if (data.tags.length > 20) {
        errors.tags = 'No se pueden tener más de 20 etiquetas';
      }

      for (let i = 0; i < data.tags.length; i++) {
        const tag = data.tags[i];
        if (typeof tag !== 'string') {
          errors.tags = 'Todas las etiquetas deben ser texto';
          break;
        } else if (tag.length > 50) {
          errors.tags = `La etiqueta ${i + 1} es demasiado larga (máximo 50 caracteres)`;
          break;
        }
      }
    }
  }

  if (data.status !== undefined) {
    const validStatus = ['draft', 'active', 'completed', 'canceled'];
    if (!validStatus.includes(data.status)) {
      errors.status = `El estado debe ser uno de los siguientes: ${validStatus.join(', ')}`;
    }
  }

  // Si hay errores, lanzar excepción
  if (Object.keys(errors).length > 0) {
    throw new ValidationError('Error de validación en los datos de investigación', errors);
  }
}

/**
 * Valida que todos los campos requeridos estén presentes para crear una nueva investigación
 * @param data Datos a validar
 * @throws ValidationError si faltan campos obligatorios
 */
export function validateRequiredFields(data: Partial<NewResearch>): void {
  const errors: Record<string, string> = {};

  // Lista de campos obligatorios
  const requiredFields = ['name', 'enterprise', 'type', 'technique'];

  // Verificar cada campo obligatorio
  for (const field of requiredFields) {
    if (!data[field as keyof NewResearch]) {
      errors[field] = `El campo ${field} es obligatorio`;
    }
  }

  // Si hay errores, lanzar excepción
  if (Object.keys(errors).length > 0) {
    throw new ValidationError('Faltan campos obligatorios', errors);
  }
}

/**
 * Valida el ID de investigación y devuelve un error si no es válido
 * @param researchId ID de investigación a validar
 * @returns Respuesta de error o null si es válido
 */
export function validateResearchId(researchId: string | undefined): APIGatewayProxyResult | null {
  if (!researchId) {
    console.log('No se proporcionó un ID de investigación válido');
    return errorResponse(ERROR_MESSAGES.VALIDATION.REQUIRED_FIELD('ID de investigación'), 400);
  }
  return null;
}

/**
 * Resultado del parseo del cuerpo de la petición
 */
export type ParsedBody<T> = { success: true; data: T } | { success: false; error: APIGatewayProxyResult };

/**
 * Valida el cuerpo de la petición y lo parsea
 * @param body Cuerpo de la petición
 * @returns Objeto con resultado del parseo
 */
export function parseRequestBody<T = any>(body: string | null): ParsedBody<T> {
  if (!body) {
    console.log('No se proporcionaron datos en la petición');
    return {
      success: false,
      error: errorResponse('Se requieren datos para procesar la petición', 400)
    };
  }

  try {
    const data = JSON.parse(body);
    return { success: true, data };
  } catch (e) {
    console.error('Error al parsear JSON del cuerpo:', e);
    return {
      success: false,
      error: errorResponse('Error al procesar los datos de la petición, formato JSON inválido', 400)
    };
  }
}

/**
 * Valida la autenticación del usuario
 * @param userId ID del usuario a validar
 * @returns Respuesta de error o null si es válido
 */
export function validateUserId(userId: string | undefined): APIGatewayProxyResult | null {
  if (!userId) {
    console.error('Error: No se pudo extraer el ID de usuario');
    return errorResponse(ERROR_MESSAGES.AUTH.UNAUTHORIZED, 401);
  }
  return null;
}

/**
 * Valida que un campo requerido exista y sea valido
 * @param field Valor del campo a validar
 * @param fieldName Nombre del campo para el mensaje de error
 * @returns Respuesta de error o null si es válido
 */
export function validateRequiredField(field: any, fieldName: string): APIGatewayProxyResult | null {
  if (field === undefined || field === null || field === '') {
    console.log(`Campo requerido no proporcionado: ${fieldName}`);
    return errorResponse(ERROR_MESSAGES.VALIDATION.REQUIRED_FIELD(fieldName), 400);
  }
  return null;
}

/**
 * Valida que un ID tenga el formato correcto
 * @param id ID a validar
 * @param fieldName Nombre del campo para el mensaje de error
 * @returns Respuesta de error o null si es válido
 */
export function validateIdFormat(id: string, fieldName: string): APIGatewayProxyResult | null {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (!uuidRegex.test(id)) {
    console.log(`ID con formato inválido: ${id}`);
    return errorResponse(ERROR_MESSAGES.VALIDATION.INVALID_FORMAT(fieldName), 400);
  }
  return null;
}

/**
 * Valida los datos específicos de una pantalla de bienvenida
 * @param data Datos de la pantalla de bienvenida
 * @returns Respuesta de error o null si los datos son válidos
 *
 * @example
 * // Ejemplo de datos válidos:
 * {
 *   title: "Bienvenido a nuestra investigación",
 *   message: "Gracias por participar en este estudio...",
 *   startButtonText: "Comenzar",
 *   isEnabled: true
 * }
 */
export function validateWelcomeScreenData(data: WelcomeScreenFormData): APIGatewayProxyResult | null {
  // Validar título
  if (data.title !== undefined) {
    if (data.title.trim() === '') {
      return errorResponse(ERROR_MESSAGES.VALIDATION.REQUIRED_FIELD('título'), 400);
    } else if (data.title.length < 3) {
      return errorResponse(ERROR_MESSAGES.VALIDATION.TOO_SHORT('El título', 3), 400);
    } else if (data.title.length > 100) {
      return errorResponse(ERROR_MESSAGES.VALIDATION.TOO_LONG('El título', 100), 400);
    }
  }

  // Validar mensaje
  if (data.message !== undefined && data.message.length > 1000) {
    return errorResponse(ERROR_MESSAGES.VALIDATION.TOO_LONG('El mensaje', 1000), 400);
  }

  // Validar texto del botón de inicio
  if (data.startButtonText !== undefined) {
    if (data.startButtonText.trim() === '') {
      return errorResponse(ERROR_MESSAGES.VALIDATION.REQUIRED_FIELD('texto del botón'), 400);
    } else if (data.startButtonText.length < 2) {
      return errorResponse(ERROR_MESSAGES.VALIDATION.TOO_SHORT('El texto del botón', 2), 400);
    } else if (data.startButtonText.length > 50) {
      return errorResponse(ERROR_MESSAGES.VALIDATION.TOO_LONG('El texto del botón', 50), 400);
    }
  }

  // Si isEnabled está definido, verificar que sea booleano
  if (data.isEnabled !== undefined && typeof data.isEnabled !== 'boolean') {
    return errorResponse('El estado de habilitación debe ser un valor booleano', 400);
  }

  return null;
}

/**
 * Valida los datos del formulario SmartVOC
 * @param data Datos del formulario a validar
 * @returns Respuesta de error o null si los datos son válidos
 */
export function validateSmartVOCData(data: SmartVOCFormData): APIGatewayProxyResult | null {
  // Cache para mensajes de error comunes
  const error = ERROR_MESSAGES.VALIDATION;

  // Validar que existan preguntas
  if (!data.questions || !Array.isArray(data.questions) || data.questions.length === 0) {
    return errorResponse(error.EMPTY_ARRAY('El formulario'), 400);
  }

  // Validar cada pregunta
  for (let i = 0; i < data.questions.length; i++) {
    const question = data.questions[i];
    const questionLabel = `La pregunta ${i + 1}`;

    // Validar título
    if (!question.title || question.title.trim() === '') {
      return errorResponse(error.REQUIRED_FIELD(`título de ${questionLabel.toLowerCase()}`), 400);
    }

    if (question.title.length > 100) {
      return errorResponse(error.TOO_LONG(`El título de ${questionLabel.toLowerCase()}`, 100), 400);
    }

    // Validar descripción
    if (!question.description || question.description.trim() === '') {
      return errorResponse(error.REQUIRED_FIELD(`descripción de ${questionLabel.toLowerCase()}`), 400);
    }

    if (question.description.length > 500) {
      return errorResponse(error.TOO_LONG(`La descripción de ${questionLabel.toLowerCase()}`, 500), 400);
    }

    // Validar tipo
    const validTypes = ['CSAT', 'CES', 'CV', 'NEV', 'NPS', 'VOC'];
    if (!validTypes.includes(question.type)) {
      return errorResponse(error.INVALID_TYPE(`El tipo de ${questionLabel.toLowerCase()}`, validTypes), 400);
    }

    // Validar configuración
    if (!question.config) {
      return errorResponse(error.MISSING_CONFIG(questionLabel), 400);
    }

    // Validar configuración específica según el tipo
    const validationResult = validateQuestionConfigByType(question, i);
    if (validationResult) {
      return validationResult;
    }
  }

  return null;
}

/**
 * Función auxiliar para validar la configuración de una pregunta según su tipo
 * @param question Pregunta a validar
 * @param index Índice de la pregunta (para mensajes de error)
 * @returns Respuesta de error o null si la configuración es válida
 */
function validateQuestionConfigByType(question: SmartVOCQuestion, index: number): APIGatewayProxyResult | null {
  const { type, config } = question;
  const questionLabel = `La pregunta ${index + 1}`;
  const error = ERROR_MESSAGES.VALIDATION;

  switch (type) {
    case QuestionType.SMARTVOC_CSAT:
      if (!config.companyName) {
        return errorResponse(error.REQUIRED_FIELD(`nombre de empresa en ${questionLabel.toLowerCase()}`), 400);
      }
      if (config.type !== 'stars' && config.type !== 'numbers' && config.type !== 'emojis') {
        return errorResponse(
          `${questionLabel} de tipo CSAT debe tener un tipo de entrada válido: stars, numbers o emojis`,
          400
        );
      }
      break;

    case QuestionType.SMARTVOC_NPS:
    case QuestionType.SMARTVOC_CES:
    case QuestionType.SMARTVOC_CV:
      if (config.type !== 'scale') {
        return errorResponse(
          `${questionLabel} de tipo ${type} debe tener un tipo de entrada 'scale'`,
          400
        );
      }
      if (!config.scaleRange ||
          config.scaleRange.start >= config.scaleRange.end) {
        return errorResponse(error.INVALID_RANGE(`${questionLabel} de tipo ${type}`), 400);
      }
      break;

    case QuestionType.SMARTVOC_VOC:
      if (config.type !== 'text') {
        return errorResponse(
          `${questionLabel} de tipo VOC debe tener un tipo de entrada 'text'`,
          400
        );
      }
      break;

    case QuestionType.SMARTVOC_NEV:
      if (!config) return errorResponse(`NEV: ${ERROR_MESSAGES.VALIDATION.MISSING_CONFIG('config')}`);

      // Permitir múltiples tipos de configuración para NEV
      const validNevTypes = ['emojis', 'emojis_detailed', 'quadrants'];
      if (!config.type || !validNevTypes.includes(config.type)) {
        return errorResponse(`NEV: tipo de config debe ser uno de: ${validNevTypes.join(', ')}`);
      }

      if (!config.companyName || typeof config.companyName !== 'string') {
        return errorResponse(`NEV: requiere companyName`);
      }
      break;
  }

  return null;
}

/**
 * Ejecuta múltiples validaciones y devuelve el primer error encontrado
 * @param validations Lista de resultados de validación
 * @returns El primer error encontrado o null si todas las validaciones pasan
 *
 * @example
 * const error = validateMultiple(
 *   validateUserId(userId),
 *   validateResearchId(researchId),
 *   validateWelcomeScreenData(screenData)
 * );
 * if (error) return error;
 */
export function validateMultiple(...validations: (APIGatewayProxyResult | null)[]): APIGatewayProxyResult | null {
  for (const validation of validations) {
    if (validation) return validation;
  }
  return null;
}

/**
 * Extrae y valida el ID de investigación de un evento API Gateway
 * @param event Evento API Gateway
 * @param bodyData Datos opcionales del cuerpo que podrían contener un researchId
 * @returns Un objeto con el ID validado o una respuesta de error
 *
 * @example
 * const result = extractResearchId(event, screenData);
 * if ('statusCode' in result) return result;
 * const { researchId } = result;
 */
export function extractResearchId(
  event: APIGatewayProxyEvent,
  bodyData?: any
): { researchId: string } | APIGatewayProxyResult {
  // Intentar obtener el researchId de diferentes fuentes en orden de prioridad
  let researchId =
    bodyData?.researchId ||
    event.pathParameters?.researchId ||
    event.queryStringParameters?.researchId;

  // <<< NUEVO: Fallback si no se encuentra en las fuentes anteriores >>>
  if (!researchId && event.path) {
    try {
      const pathSegments = event.path.split('/');
      // Asumir estructura como /.../research/{researchId}/...
      const researchIndex = pathSegments.indexOf('research');
      if (researchIndex !== -1 && pathSegments.length > researchIndex + 1 && pathSegments[researchIndex + 1]) {
        researchId = pathSegments[researchIndex + 1];
        console.log(`[extractResearchId] ID extraído del path: ${researchId}`);
      }
    } catch (e) {
      // Ignorar errores al parsear el path, simplemente no se encontró el ID
      console.warn('[extractResearchId] Error al intentar extraer ID del path:', e);
    }
  }

  const error = validateResearchId(researchId);

  if (error) {
    return error;
  }

  // Si llegamos aquí, sabemos que researchId está definido
  return { researchId: researchId! };
}

/**
 * Valida y parsea el cuerpo de la petición con tipo específico
 * @param event Evento API Gateway
 * @param validator Función opcional para validar el cuerpo una vez parseado
 * @returns Objeto con los datos validados o una respuesta de error
 *
 * @example
 * const result = parseAndValidateBody<WelcomeScreenFormData>(
 *   event,
 *   validateWelcomeScreenData
 * );
 * if ('statusCode' in result) return result;
 * const { data } = result;
 */
export function parseAndValidateBody<T>(
  event: APIGatewayProxyEvent,
  validator?: (data: T) => APIGatewayProxyResult | null
): { data: T } | APIGatewayProxyResult {
  // Parsear el cuerpo
  const bodyResult = parseRequestBody<T>(event.body);

  if (!bodyResult.success) {
    return bodyResult.error;
  }

  const data = bodyResult.data;

  // Si hay un validador, usarlo
  if (validator) {
    const validationError = validator(data);
    if (validationError) {
      // Loguear el error específico antes de devolverlo
      console.error('[Validation] Error de validación detectado:', JSON.stringify(validationError));
      return validationError;
    }
  }

  return { data };
}

/**
 * Valida los datos del formulario CognitiveTask.
 * Devuelve null si es válido, o APIGatewayProxyResult con error 400 si no.
 * TODO: Implementar reglas de validación detalladas.
 */
export const validateCognitiveTaskData = (data: any, partial: boolean = false): APIGatewayProxyResult | null => {
  if (typeof data !== 'object' || data === null) {
    // Devolver respuesta de error directamente
    return errorResponse('Formato de datos inválido: se esperaba un objeto.', 400);
  }

  const errors: Record<string, string> = {};

  // --- Validación de Campos Obligatorios (solo si NO es parcial) ---
  if (!partial) {
    if (!data.questions || !Array.isArray(data.questions) || data.questions.length === 0) {
      errors.questions = 'Debe definir al menos una pregunta.';
    }
    // ...
  }

  // --- Validación de Tipos y Formatos ---
  if (data.questions && Array.isArray(data.questions)) {
    data.questions.forEach((q: any, index: number) => {
      if (!q.id) errors[`questions[${index}].id`] = 'ID de pregunta es requerido.';
      if (!q.type) errors[`questions[${index}].type`] = 'Tipo de pregunta es requerido.';
      // ...
    });
  }
  if (data.hasOwnProperty('randomizeQuestions') && typeof data.randomizeQuestions !== 'boolean') {
     errors.randomizeQuestions = 'randomizeQuestions debe ser un valor booleano.';
  }
  // ...

  // Si hay errores, construir y devolver la respuesta de error
  if (Object.keys(errors).length > 0) {
    // Incrustar los errores como JSON string dentro del mensaje
    const errorMessage = `Error de validación en los datos del formulario CognitiveTask. Detalles: ${JSON.stringify(errors)}`;
    return errorResponse(errorMessage, 400);
  }

  // Si no hay errores, devolver null
  return null;
};

/**
 * Valida los datos de una pantalla de agradecimiento
 */
export function validateThankYouScreenData(data: Partial<ThankYouScreenFormData>): APIGatewayProxyResult | null {
  const errors: Record<string, string> = {};
  const validationRules = DEFAULT_THANK_YOU_SCREEN_VALIDATION;

  if (data.title !== undefined) {
    if (data.title.trim() === '') errors.title = 'El título no puede estar vacío';
    else if (data.title.length < validationRules.title.minLength) errors.title = `El título debe tener al menos ${validationRules.title.minLength} caracteres`;
    else if (data.title.length > validationRules.title.maxLength) errors.title = `El título no puede exceder los ${validationRules.title.maxLength} caracteres`;
  }

  if (data.message !== undefined) {
    if (data.message.trim() === '') errors.message = 'El mensaje no puede estar vacío';
    else if (data.message.length < validationRules.message.minLength) errors.message = `El mensaje debe tener al menos ${validationRules.message.minLength} caracteres`;
    else if (data.message.length > validationRules.message.maxLength) errors.message = `El mensaje no puede exceder los ${validationRules.message.maxLength} caracteres`;
  }

  if (data.redirectUrl && data.redirectUrl.trim() !== '') {
    if (validationRules.redirectUrl.pattern && !validationRules.redirectUrl.pattern.test(data.redirectUrl)) errors.redirectUrl = 'La URL de redirección no tiene un formato válido';
    else if (data.redirectUrl.length < validationRules.redirectUrl.minLength) errors.redirectUrl = `La URL debe tener al menos ${validationRules.redirectUrl.minLength} caracteres`;
    else if (data.redirectUrl.length > validationRules.redirectUrl.maxLength) errors.redirectUrl = `La URL no puede exceder los ${validationRules.redirectUrl.maxLength} caracteres`;
  }

  if (Object.keys(errors).length > 0) {
    const errorMessage = `Datos de pantalla de agradecimiento inválidos: ${JSON.stringify(errors)}`;
    return errorResponse(errorMessage, 400);
  }

  return null; // Sin errores
}

/**
 * Valida que un screenId (generalmente de path parameters) esté presente.
 */
export function validateScreenId(screenId: string | undefined): APIGatewayProxyResult | null {
  if (!screenId || screenId.trim() === '') {
    return errorResponse('Se requiere el ID de la pantalla (screenId) en la ruta', 400);
  }
  // Podríamos añadir validación de formato si los IDs tienen un patrón específico
  return null;
}

/**
 * Valida los datos de entrada para la configuración de eye tracking.
 * @param data Los datos a validar.
 * @returns null si los datos son válidos, o un objeto APIGatewayProxyResult si hay errores.
 */
export const validateEyeTrackingData = (data: any): APIGatewayProxyResult | null => {
  if (!data) {
    return errorResponse('Cuerpo de la solicitud vacío o inválido', 400);
  }

  const errors: Record<string, string> = {};

  // Validar demographics questions si están presentes
  if (data.demographicQuestions) {
    const dq = data.demographicQuestions;

    // Verificar estructura básica para cada pregunta demográfica
    const questionKeys = ['age', 'country', 'gender', 'educationLevel', 'householdIncome',
                          'employmentStatus', 'dailyHoursOnline', 'technicalProficiency'];

    questionKeys.forEach(key => {
      if (dq[key]) {
        if (typeof dq[key].enabled !== 'boolean') {
          errors[`demographicQuestions.${key}.enabled`] = 'El campo enabled debe ser un valor booleano';
        }
        if (typeof dq[key].required !== 'boolean') {
          errors[`demographicQuestions.${key}.required`] = 'El campo required debe ser un valor booleano';
        }
        if (dq[key].options && !Array.isArray(dq[key].options)) {
          errors[`demographicQuestions.${key}.options`] = 'El campo options debe ser un array';
        }
      }
    });
  }

  // Validar linkConfig si está presente
  if (data.linkConfig) {
    const lc = data.linkConfig;

    if (lc.allowMobile !== undefined && typeof lc.allowMobile !== 'boolean') {
      errors['linkConfig.allowMobile'] = 'El campo allowMobile debe ser un valor booleano';
    }

    if (lc.trackLocation !== undefined && typeof lc.trackLocation !== 'boolean') {
      errors['linkConfig.trackLocation'] = 'El campo trackLocation debe ser un valor booleano';
    }

    if (lc.allowMultipleAttempts !== undefined && typeof lc.allowMultipleAttempts !== 'boolean') {
      errors['linkConfig.allowMultipleAttempts'] = 'El campo allowMultipleAttempts debe ser un valor booleano';
    }
  }

  // Validar participantLimit si está presente
  if (data.participantLimit) {
    const pl = data.participantLimit;

    if (pl.enabled !== undefined && typeof pl.enabled !== 'boolean') {
      errors['participantLimit.enabled'] = 'El campo enabled debe ser un valor booleano';
    }

    if (pl.value !== undefined) {
      if (typeof pl.value !== 'number') {
        errors['participantLimit.value'] = 'El campo value debe ser un número';
      } else if (pl.value <= 0) {
        errors['participantLimit.value'] = 'El campo value debe ser mayor que cero';
      }
    }
  }

  // Validar backlinks si está presente
  if (data.backlinks) {
    const bl = data.backlinks;

    // Validar que las URLs sean strings
    if (bl.complete !== undefined && typeof bl.complete !== 'string') {
      errors['backlinks.complete'] = 'El campo complete debe ser una cadena de texto';
    }

    if (bl.disqualified !== undefined && typeof bl.disqualified !== 'string') {
      errors['backlinks.disqualified'] = 'El campo disqualified debe ser una cadena de texto';
    }

    if (bl.overquota !== undefined && typeof bl.overquota !== 'string') {
      errors['backlinks.overquota'] = 'El campo overquota debe ser una cadena de texto';
    }

    // Validar URL formato si no están vacías
    const urlFields = ['complete', 'disqualified', 'overquota'];
    urlFields.forEach(field => {
      if (bl[field] && bl[field].trim() !== '') {
        try {
          new URL(bl[field]);
        } catch (e) {
          errors[`backlinks.${field}`] = `El campo ${field} debe ser una URL válida`;
        }
      }
    });
  }

  // Validar researchUrl si está presente
  if (data.researchUrl !== undefined) {
    if (typeof data.researchUrl !== 'string') {
      errors['researchUrl'] = 'El campo researchUrl debe ser una cadena de texto';
    } else if (data.researchUrl.trim() !== '') {
      try {
        new URL(data.researchUrl);
      } catch (e) {
        errors['researchUrl'] = 'El campo researchUrl debe ser una URL válida';
      }
    }
  }

  // Validar parameterOptions si está presente
  if (data.parameterOptions) {
    const po = data.parameterOptions;

    const optionKeys = ['saveDeviceInfo', 'saveLocationInfo', 'saveResponseTimes', 'saveUserJourney'];
    optionKeys.forEach(key => {
      if (po[key] !== undefined && typeof po[key] !== 'boolean') {
        errors[`parameterOptions.${key}`] = `El campo ${key} debe ser un valor booleano`;
      }
    });
  }

  if (Object.keys(errors).length > 0) {
    return errorResponse(`Datos de eye tracking inválidos: ${JSON.stringify(errors)}`, 400);
  }

  return null; // Indica que la validación fue exitosa
};

/**
 * Valida los datos de entrada para la configuración de reclutamiento de eye tracking.
 * TODO: Implementar reglas de validación específicas si son necesarias.
 * @param data Los datos a validar (debería ser de tipo CreateEyeTrackingRecruitRequest o similar).
 * @returns null si los datos son válidos, o un objeto APIGatewayProxyResult si hay errores.
 */
export const validateEyeTrackingRecruitData = (data: any): APIGatewayProxyResult | null => {
  // Por ahora, asumimos que los datos son válidos si están presentes.
  // Se pueden añadir validaciones más específicas aquí, por ejemplo, para quotas, criteria, etc.
  if (!data) {
    return errorResponse('Cuerpo de la solicitud vacío o inválido para la configuración de reclutamiento', 400);
  }
  // Ejemplo:
  // if (data.quota !== undefined && (typeof data.quota !== 'number' || data.quota <= 0)) {
  //    return errorResponse('La cuota debe ser un número positivo', 400);
  // }
  return null; // Indica que la validación fue exitosa
};

/**
 * Validar datos de ubicación
 */
export function validateLocationData(data: any): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];

  // Validar researchId
  if (!data.researchId || typeof data.researchId !== 'string') {
    errors.push('researchId es requerido y debe ser una cadena');
  }

  // Validar location
  if (!data.location || typeof data.location !== 'object') {
    errors.push('location es requerido y debe ser un objeto');
  } else {
    const location = data.location;

    // Validar latitude
    if (typeof location.latitude !== 'number' || location.latitude < -90 || location.latitude > 90) {
      errors.push('latitude debe ser un número entre -90 y 90');
    }

    // Validar longitude
    if (typeof location.longitude !== 'number' || location.longitude < -180 || location.longitude > 180) {
      errors.push('longitude debe ser un número entre -180 y 180');
    }

    // Validar accuracy (opcional)
    if (location.accuracy !== undefined && (typeof location.accuracy !== 'number' || location.accuracy < 0)) {
      errors.push('accuracy debe ser un número positivo');
    }

    // Validar source
    if (!location.source || !['gps', 'ip'].includes(location.source)) {
      errors.push('source debe ser "gps" o "ip"');
    }
  }

  // Validar timestamp (opcional)
  if (data.timestamp && typeof data.timestamp !== 'string') {
    errors.push('timestamp debe ser una cadena ISO');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}
