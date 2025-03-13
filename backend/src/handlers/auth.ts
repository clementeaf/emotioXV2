import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { UserService } from '../services/user.service';
import * as z from 'zod';

// Instancia del servicio
const userService = new UserService();

// Esquemas de validación
const requestOTPSchema = z.object({
  email: z.string().email('Invalid email format')
});

const validateOTPSchema = z.object({
  email: z.string().email('Invalid email format'),
  code: z.string().length(6, 'Code must be exactly 6 digits').regex(/^\d+$/, 'Code must contain only numbers')
});

const loginSchema = z.object({
  email: z.string().email('Formato de email inválido'),
  password: z.string().min(6, 'La contraseña debe tener al menos 6 caracteres')
});

const registerSchema = z.object({
  name: z.string().min(2, 'El nombre debe tener al menos 2 caracteres'),
  email: z.string().email('Formato de email inválido'),
  password: z.string().min(6, 'La contraseña debe tener al menos 6 caracteres')
});

// Función auxiliar para crear respuestas
const createResponse = (statusCode: number, body: any): APIGatewayProxyResult => {
  return {
    statusCode,
    headers: {
      'Access-Control-Allow-Origin': process.env.STAGE === 'prod' 
        ? 'https://app.emotio-x.com' 
        : 'http://localhost:4700',
      'Access-Control-Allow-Credentials': 'true'
    },
    body: JSON.stringify(body)
  };
};

/**
 * Handler para registro de usuarios
 */
export const register = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    console.log('Recibida solicitud de registro:', event.body);
    
    if (!event.body) {
      return createResponse(400, { error: 'Cuerpo de la solicitud vacío' });
    }

    const body = JSON.parse(event.body);
    const result = registerSchema.safeParse(body);
    
    if (!result.success) {
      console.log('Datos de entrada inválidos:', result.error.errors);
      return createResponse(400, { 
        error: 'Datos de entrada inválidos',
        details: result.error.errors 
      });
    }

    console.log(`Registrando usuario ${body.email}`);
    const { token, user } = await userService.createUser(body.name, body.email, body.password);
    console.log('Usuario registrado exitosamente');
    
    return createResponse(201, { token, user });
  } catch (error: any) {
    console.error('Error en registro:', error);
    
    if (error.message === 'User already exists') {
      return createResponse(409, { error: 'El usuario ya existe' });
    }
    
    return createResponse(500, { 
      error: 'Error interno del servidor',
      details: process.env.STAGE === 'dev' ? error.message : undefined
    });
  }
};

/**
 * Handler para login con email y contraseña
 */
export const login = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    console.log('Recibida solicitud de login:', event.body);
    
    if (!event.body) {
      return createResponse(400, { error: 'Cuerpo de la solicitud vacío' });
    }

    const body = JSON.parse(event.body);
    const result = loginSchema.safeParse(body);
    
    if (!result.success) {
      console.log('Datos de entrada inválidos:', result.error.errors);
      return createResponse(400, { 
        error: 'Datos de entrada inválidos',
        details: result.error.errors 
      });
    }

    console.log(`Autenticando a ${body.email}`);
    const { token, user } = await userService.login(body.email, body.password);
    console.log('Autenticación exitosa');
    
    return createResponse(200, { token, user });
  } catch (error: any) {
    console.error('Error en login:', error);
    
    if (error.message === 'User not found') {
      return createResponse(404, { error: 'Usuario no encontrado' });
    }
    
    if (error.message === 'Invalid credentials') {
      return createResponse(401, { error: 'Credenciales inválidas' });
    }
    
    return createResponse(500, { 
      error: 'Error interno del servidor',
      details: process.env.STAGE === 'dev' ? error.message : undefined
    });
  }
};

/**
 * Handler para solicitar un código OTP
 */
export const requestOTP = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    console.log('Recibida solicitud de OTP:', event.body);
    
    if (!event.body) {
      return createResponse(400, { error: 'Cuerpo de la solicitud vacío' });
    }

    const body = JSON.parse(event.body);
    const result = requestOTPSchema.safeParse(body);
    
    if (!result.success) {
      console.log('Datos de entrada inválidos:', result.error.errors);
      return createResponse(400, { 
        error: 'Datos de entrada inválidos',
        details: result.error.errors 
      });
    }

    await userService.requestOTP(body.email);
    
    return createResponse(200, { 
      message: 'Código OTP enviado correctamente',
      email: body.email 
    });
  } catch (error: any) {
    console.error('Error en requestOTP:', error);
    
    if (error.message === 'User not found') {
      return createResponse(404, { error: 'Usuario no encontrado' });
    }
    
    if (error.message && error.message.includes('email')) {
      return createResponse(500, { 
        error: 'Error al enviar el email',
        details: error.message
      });
    }
    
    return createResponse(500, { 
      error: 'Error interno del servidor',
      details: process.env.STAGE === 'dev' ? error.message : undefined
    });
  }
};

/**
 * Handler para validar un código OTP
 */
export const validateOTP = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    console.log('Recibida solicitud de validación OTP:', event.body);
    
    if (!event.body) {
      return createResponse(400, { error: 'Cuerpo de la solicitud vacío' });
    }

    const body = JSON.parse(event.body);
    const result = validateOTPSchema.safeParse(body);
    
    if (!result.success) {
      console.log('Datos de entrada inválidos:', result.error.errors);
      return createResponse(400, { 
        error: 'Datos de entrada inválidos',
        details: result.error.errors 
      });
    }

    console.log(`Validando OTP para ${body.email}`);
    const { token, user } = await userService.validateOTP(body.email, body.code);
    console.log('OTP validado correctamente');
    
    return createResponse(200, { token, user });
  } catch (error: any) {
    console.error('Error en validateOTP:', error);
    
    if (error.message === 'User not found') {
      return createResponse(404, { error: 'Usuario no encontrado' });
    }
    
    if (error.message === 'Invalid or expired OTP') {
      return createResponse(400, { error: 'Código OTP inválido o expirado' });
    }
    
    return createResponse(500, { 
      error: 'Error interno del servidor',
      details: process.env.STAGE === 'dev' ? error.message : undefined
    });
  }
};

/**
 * Handler para cerrar sesión
 */
export const logout = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  return createResponse(200, { message: 'Sesión cerrada correctamente' });
}; 