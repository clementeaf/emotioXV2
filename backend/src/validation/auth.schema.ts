import { z } from 'zod';

/**
 * Esquema de validación para el login
 */
export const loginSchema = z.object({
  email: z
    .string()
    .email('El formato de correo electrónico no es válido')
    .min(1, 'El correo electrónico es obligatorio'),
  password: z
    .string()
    .min(6, 'La contraseña debe tener al menos 6 caracteres')
    .max(100, 'La contraseña no puede tener más de 100 caracteres')
});

/**
 * Esquema de validación para el registro
 */
export const registerSchema = z.object({
  name: z
    .string()
    .min(2, 'El nombre debe tener al menos 2 caracteres')
    .max(100, 'El nombre no puede tener más de 100 caracteres'),
  email: z
    .string()
    .email('El formato de correo electrónico no es válido')
    .min(1, 'El correo electrónico es obligatorio'),
  password: z
    .string()
    .min(6, 'La contraseña debe tener al menos 6 caracteres')
    .max(100, 'La contraseña no puede tener más de 100 caracteres')
}); 