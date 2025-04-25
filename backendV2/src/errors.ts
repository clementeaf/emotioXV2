/**
 * Clases de Error Personalizadas para la API HTTP
 */

// Clase base para errores HTTP
export class HttpError extends Error {
  public readonly statusCode: number;
  public readonly code?: string; // Código de error interno opcional

  constructor(statusCode: number, message: string, code?: string) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    // Mantener el stack trace adecuado (para V8)
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor);
    }
    // Nombre de la clase
    this.name = this.constructor.name;
  }
}

// Errores comunes que extienden HttpError

export class BadRequestError extends HttpError {
  constructor(message: string = 'Bad Request', code?: string) {
    super(400, message, code);
  }
}

export class UnauthorizedError extends HttpError {
  constructor(message: string = 'Unauthorized', code?: string) {
    super(401, message, code);
  }
}

export class ForbiddenError extends HttpError {
  constructor(message: string = 'Forbidden', code?: string) {
    super(403, message, code);
  }
}

export class NotFoundError extends HttpError {
  constructor(message: string = 'Not Found', code?: string) {
    super(404, message, code);
  }
}

export class ConflictError extends HttpError {
  constructor(message: string = 'Conflict', code?: string) {
    super(409, message, code);
  }
}

export class InternalServerError extends HttpError {
  constructor(message: string = 'Internal Server Error', code?: string) {
    super(500, message, code);
  }
}

// Puedes añadir más según necesites (ej. ValidationError, etc.) 