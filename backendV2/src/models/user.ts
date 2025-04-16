/**
 * Modelo de usuario para DynamoDB
 * Define la estructura de la tabla de usuarios y los tipos relacionados
 */

import { z } from 'zod';

/**
 * Esquema de validación para usuario
 */
export const UserSchema = z.object({
  // Clave primaria (partition key)
  id: z.string().uuid(),
  
  // Información básica del usuario
  email: z.string().email(),
  name: z.string().min(2),
  
  // Información de autenticación
  password: z.string().min(8).optional(), // No se almacena en respuestas
  passwordHash: z.string(),
  
  // Tokens de autenticación activos
  tokens: z.array(z.object({
    token: z.string(),
    expiresAt: z.number(), // Timestamp Unix en milisegundos
    device: z.string().optional(),
    ip: z.string().optional()
  })).optional(),
  
  // Roles y permisos
  role: z.enum(['admin', 'researcher', 'user', 'participant']).default('user'),
  permissions: z.array(z.string()).optional(),
  
  // Estado de la cuenta
  isActive: z.boolean().default(true),
  isVerified: z.boolean().default(false),
  verificationCode: z.string().optional(),
  
  // Preferencias y configuración
  preferences: z.object({
    language: z.string().default('es'),
    notifications: z.boolean().default(true),
    theme: z.string().default('light')
  }).optional(),
  
  // Metadatos
  lastLogin: z.number().optional(), // Timestamp Unix en milisegundos
  loginCount: z.number().default(0),
  
  // Timestamps
  createdAt: z.number(), // Timestamp Unix en milisegundos
  updatedAt: z.number()  // Timestamp Unix en milisegundos
});

/**
 * Tipo para el modelo de usuario interno del backend
 */
export interface InternalUser {
  id: string;
  email: string;
  name: string;
  passwordHash: string;
  role: 'admin' | 'researcher' | 'user' | 'participant';
  isActive: boolean;
  isVerified: boolean;
  tokens?: Array<{
    token: string;
    expiresAt: number;
    device?: string;
    ip?: string;
  }>;
  permissions?: string[];
  preferences?: {
    language: string;
    notifications: boolean;
    theme: string;
  };
  lastLogin?: number;
  loginCount: number;
  createdAt: number;
  updatedAt: number;
}

export type User = InternalUser;

/**
 * Esquema para crear un nuevo usuario
 */
export const CreateUserSchema = UserSchema.omit({
  id: true,
  passwordHash: true,
  tokens: true,
  isActive: true,
  isVerified: true,
  verificationCode: true,
  lastLogin: true,
  loginCount: true,
  createdAt: true,
  updatedAt: true
}).extend({
  password: z.string().min(8) // Contraseña obligatoria para creación
});

/**
 * Tipo para crear un nuevo usuario
 */
export type CreateUserDto = z.infer<typeof CreateUserSchema>;

/**
 * Esquema para actualizar un usuario existente
 */
export const UpdateUserSchema = UserSchema.partial().omit({
  id: true,
  email: true, // No permitimos cambiar el email directamente
  passwordHash: true,
  createdAt: true
});

/**
 * Tipo para actualizar un usuario existente
 */
export type UpdateUserDto = z.infer<typeof UpdateUserSchema>;

/**
 * Esquema para credenciales de inicio de sesión
 */
export const LoginCredentialsSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1)
});

/**
 * Tipo para credenciales de inicio de sesión
 */
export type LoginCredentialsDto = z.infer<typeof LoginCredentialsSchema>;

/**
 * Esquema para carga útil del token JWT
 */
export const JwtPayloadSchema = z.object({
  id: z.string(),
  email: z.string().email(),
  name: z.string(),
  role: z.enum(['admin', 'researcher', 'user', 'participant']),
  researchId: z.string().optional(), // ID de la investigación para participantes
  iat: z.number().optional(),
  exp: z.number().optional(),
  sub: z.string().optional()
});

/**
 * Tipo para carga útil del token JWT
 */
export type JwtPayload = z.infer<typeof JwtPayloadSchema>;

/**
 * Define la estructura de la tabla DynamoDB para usuarios
 */
export const UserTableDefinition = {
  TableName: process.env.USER_TABLE || 'Users',
  KeySchema: [
    { AttributeName: 'id', KeyType: 'HASH' } // Partition key
  ],
  AttributeDefinitions: [
    { AttributeName: 'id', AttributeType: 'S' },
    { AttributeName: 'email', AttributeType: 'S' }
  ],
  GlobalSecondaryIndexes: [
    {
      IndexName: 'EmailIndex',
      KeySchema: [
        { AttributeName: 'email', KeyType: 'HASH' }
      ],
      Projection: {
        ProjectionType: 'ALL'
      },
      ProvisionedThroughput: {
        ReadCapacityUnits: 5,
        WriteCapacityUnits: 5
      }
    }
  ],
  ProvisionedThroughput: {
    ReadCapacityUnits: 5,
    WriteCapacityUnits: 5
  }
}; 