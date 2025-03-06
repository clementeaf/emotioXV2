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

// Función auxiliar para crear respuestas
const createResponse = (statusCode: number, body: any): APIGatewayProxyResult => {
  return {
    statusCode,
    body: JSON.stringify(body)
  };
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