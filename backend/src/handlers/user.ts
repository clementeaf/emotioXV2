import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { UserService } from '../services/user.service';
import * as z from 'zod';

// Instancia del servicio
const userService = new UserService();

// Esquemas de validación (importados directamente para evitar dependencia externa)
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

// Manejador de OPTIONS para CORS
export const optionsHandler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  return {
    statusCode: 200,
    headers: {
      'Access-Control-Allow-Origin': process.env.STAGE === 'prod' 
        ? 'https://app.emotiox.com' 
        : 'http://localhost:4700',
      'Access-Control-Allow-Credentials': 'true',
      'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type,Authorization,X-Api-Key',
      'Access-Control-Expose-Headers': 'Content-Type,Authorization,X-Api-Key',
      'Access-Control-Max-Age': '600'
    },
    body: ''
  };
};

/**
 * Controlador para solicitar un código OTP
 */
export const requestOTP = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    console.log('Recibida solicitud de OTP:', event.body);
    
    if (!event.body) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Cuerpo de la solicitud vacío' })
      };
    }

    const body = JSON.parse(event.body);
    const result = requestOTPSchema.safeParse(body);
    
    if (!result.success) {
      console.log('Datos de entrada inválidos:', result.error.errors);
      return {
        statusCode: 400,
        body: JSON.stringify({ 
          error: 'Datos de entrada inválidos',
          details: result.error.errors 
        })
      };
    }

    await userService.requestOTP(body.email);
    
    return {
      statusCode: 200,
      body: JSON.stringify({ 
        message: 'Código OTP enviado correctamente',
        email: body.email 
      })
    };
  } catch (error: any) {
    console.error('Error en requestOTP:', error);
    
    // Manejar error específicamente para usuario no encontrado
    if (error.message === 'User not found') {
      return {
        statusCode: 404,
        body: JSON.stringify({ error: 'Usuario no encontrado' })
      };
    }
    
    // Manejar errores de AWS SES
    if (error.message && error.message.includes('email')) {
      return {
        statusCode: 500,
        body: JSON.stringify({ 
          error: 'Error al enviar el email',
          details: error.message
        })
      };
    }
    
    return {
      statusCode: 500,
      body: JSON.stringify({ 
        error: 'Error interno del servidor',
        details: process.env.STAGE === 'dev' ? error.message : undefined
      })
    };
  }
};

/**
 * Controlador para validar un código OTP
 */
export const validateOTP = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    console.log('Recibida solicitud de validación OTP:', event.body);
    
    if (!event.body) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Cuerpo de la solicitud vacío' })
      };
    }

    const body = JSON.parse(event.body);
    const result = validateOTPSchema.safeParse(body);
    
    if (!result.success) {
      console.log('Datos de entrada inválidos:', result.error.errors);
      return {
        statusCode: 400,
        body: JSON.stringify({ 
          error: 'Datos de entrada inválidos',
          details: result.error.errors 
        })
      };
    }

    console.log(`Validando OTP para ${body.email}`);
    const { token, user } = await userService.validateOTP(body.email, body.code);
    console.log('OTP validado correctamente');
    
    return {
      statusCode: 200,
      body: JSON.stringify({ token, user })
    };
  } catch (error: any) {
    console.error('Error en validateOTP:', error);
    
    if (error.message === 'User not found') {
      return {
        statusCode: 404,
        body: JSON.stringify({ error: 'Usuario no encontrado' })
      };
    }
    
    if (error.message === 'Invalid or expired OTP') {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Código OTP inválido o expirado' })
      };
    }
    
    return {
      statusCode: 500,
      body: JSON.stringify({ 
        error: 'Error interno del servidor',
        details: process.env.STAGE === 'dev' ? error.message : undefined
      })
    };
  }
};

/**
 * Controlador para crear un usuario
 */
export const createUser = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    const body = JSON.parse(event.body || '{}');
    const { name, email } = body;

    if (!name || !email) {
      return createResponse(400, {
        message: 'Nombre y email son requeridos'
      });
    }

    const user = await userService.createUser(name, email);
    
    return createResponse(201, user);
  } catch (error: any) {
    console.error('Error en createUser:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Error al crear usuario' })
    };
  }
};

/**
 * Controlador para obtener información del usuario
 */
export const getUser = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    const email = event.pathParameters?.email;
    
    if (!email) {
      return createResponse(400, {
        message: 'Email es requerido'
      });
    }

    const user = await userService.getUserByEmail(email);
    
    return createResponse(200, user);
  } catch (error: any) {
    console.error('Error en getUser:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Error al obtener usuario' })
    };
  }
};

export const updateUser = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    const email = event.pathParameters?.email;
    const body = JSON.parse(event.body || '{}');
    const { name } = body;

    if (!email || !name) {
      return createResponse(400, {
        message: 'Email y nombre son requeridos'
      });
    }

    const user = await userService.updateUserName(email, name);
    
    return createResponse(200, user);
  } catch (error) {
    console.error('Error en updateUser:', error);
    
    if (error instanceof Error && error.message === 'User not found') {
      return createResponse(404, {
        message: 'Usuario no encontrado'
      });
    }

    return createResponse(500, {
      message: 'Error interno del servidor'
    });
  }
};

export const deleteUser = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    const email = event.pathParameters?.email;
    
    if (!email) {
      return createResponse(400, {
        message: 'Email es requerido'
      });
    }

    await userService.deleteUser(email);
    
    return createResponse(204, null);
  } catch (error) {
    console.error('Error en deleteUser:', error);
    
    if (error instanceof Error && error.message === 'User not found') {
      return createResponse(404, {
        message: 'Usuario no encontrado'
      });
    }

    return createResponse(500, {
      message: 'Error interno del servidor'
    });
  }
}; 