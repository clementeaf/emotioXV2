import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { userService } from '../services/user.service';
import { validateOTPSchema, requestOTPSchema } from '@emotiox/shared';

// Utilidad para respuestas HTTP
const createResponse = (statusCode: number, body: any): APIGatewayProxyResult => ({
  statusCode,
  headers: {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': process.env.STAGE === 'prod' 
      ? 'https://app.emotiox.com' 
      : 'http://localhost:4700',
    'Access-Control-Allow-Credentials': 'true',
    'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type,Authorization,X-Api-Key',
    'Access-Control-Expose-Headers': 'Content-Type,Authorization,X-Api-Key'
  },
  body: JSON.stringify(body)
});

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

export const requestOTP = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    const body = JSON.parse(event.body || '{}');
    
    // Validar el cuerpo de la solicitud
    const result = requestOTPSchema.safeParse(body);
    if (!result.success) {
      return createResponse(400, {
        message: 'Datos de entrada inválidos',
        errors: result.error.errors
      });
    }

    await userService.requestOTP(body.email);
    
    return createResponse(200, {
      message: 'Código OTP enviado correctamente'
    });
  } catch (error) {
    console.error('Error en requestOTP:', error);
    
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

export const validateOTP = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    const body = JSON.parse(event.body || '{}');
    
    // Validar el cuerpo de la solicitud
    const result = validateOTPSchema.safeParse(body);
    if (!result.success) {
      return createResponse(400, {
        message: 'Datos de entrada inválidos',
        errors: result.error.errors
      });
    }

    const { token, user } = await userService.validateOTP(body.email, body.code);
    
    return createResponse(200, { token, user });
  } catch (error) {
    console.error('Error en validateOTP:', error);
    
    if (error instanceof Error) {
      switch (error.message) {
        case 'User not found':
          return createResponse(404, {
            message: 'Usuario no encontrado'
          });
        case 'Invalid or expired OTP':
          return createResponse(401, {
            message: 'Código OTP inválido o expirado'
          });
      }
    }

    return createResponse(500, {
      message: 'Error interno del servidor'
    });
  }
};

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
  } catch (error) {
    console.error('Error en createUser:', error);
    
    if (error instanceof Error && error.message === 'User already exists') {
      return createResponse(409, {
        message: 'El usuario ya existe'
      });
    }

    return createResponse(500, {
      message: 'Error interno del servidor'
    });
  }
};

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
  } catch (error) {
    console.error('Error en getUser:', error);
    
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