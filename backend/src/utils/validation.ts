import { z } from 'zod';
import { ValidationError } from '../middlewares/error.middleware';

/**
 * Valida un objeto contra un esquema Zod y lanza un error si no es válido
 * @param schema Esquema Zod
 * @param data Datos a validar
 */
export function validateSchema<T>(schema: z.ZodSchema<T>, data: unknown): T {
  try {
    return schema.parse(data);
  } catch (error) {
    if (error instanceof z.ZodError) {
      // Convertir errores de Zod en un formato más legible
      const issues = error.issues.map(issue => `${issue.path.join('.')}: ${issue.message}`).join(', ');
      throw new ValidationError(`Validation error: ${issues}`);
    }
    throw new ValidationError('Invalid data format');
  }
} 