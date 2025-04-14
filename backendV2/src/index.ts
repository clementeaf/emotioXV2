import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { authService } from './services/auth.service';

// Helper para crear respuestas HTTP con formato consistente
const createResponse = (statusCode: number, body: any): APIGatewayProxyResult => {
  return {
    statusCode,
    headers: { 
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Credentials': 'true',
      'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type,Authorization'
    },
    body: JSON.stringify(body)
  };
};

// Handler principal para AWS Lambda
export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  const path = event.path;
  const method = event.httpMethod;
  
  console.log('Processing request:', { path, method });
  
  // Manejo de solicitudes OPTIONS para CORS
  if (method === 'OPTIONS') {
    return createResponse(200, {});
  }
  
  // Determinar el controlador correcto basado en el path
  if (path.startsWith('/auth')) {
    // Código para manejar autenticación
    if (path === '/auth/login' && method === 'POST') {
      try {
        const requestBody = JSON.parse(event.body || '{}');
        const { email, password } = requestBody;

        if (!email || !password) {
          return createResponse(400, {
            success: false,
            message: 'Email y contraseña son requeridos'
          });
        }

        const result = await authService.login({ email, password });
        
        return createResponse(200, {
          success: true,
          message: 'Usuario autenticado correctamente',
          ...result
        });
      } catch (error) {
        console.error('Error en login:', error);
        return createResponse(401, {
          success: false,
          message: 'Credenciales inválidas',
          error: error instanceof Error ? error.message : 'Error desconocido'
        });
      }
    } else if (path === '/auth/refreshToken' && method === 'POST') {
      try {
        // Intentar obtener el token del body
        const requestBody = JSON.parse(event.body || '{}');
        
        // Intentar obtener el token del header de autorización si no está en el body
        const authHeader = event.headers.Authorization || event.headers.authorization;
        let token = requestBody.token || requestBody.refreshToken;
        
        // Si no hay token en el body, intentar obtenerlo del header
        if (!token && authHeader) {
          token = authHeader.replace('Bearer ', '');
        }

        if (!token) {
          console.error('No se encontró token en el body ni en los headers:', {
            body: event.body,
            headers: event.headers
          });
          return createResponse(400, {
            success: false,
            message: 'No se proporcionó el token'
          });
        }

        console.log('Token recibido:', token.substring(0, 20) + '...');

        // Renovar el token usando el servicio existente
        const result = await authService.renovateTokenIfNeeded(token);
        
        if (!result.renewed) {
          return createResponse(200, {
            success: true,
            message: 'Token aún válido',
            token: result.token,
            expiresAt: result.expiresAt,
            user: result.user
          });
        }

        return createResponse(200, {
          success: true,
          message: 'Token renovado correctamente',
          token: result.token,
          expiresAt: result.expiresAt,
          user: result.user
        });
      } catch (error) {
        console.error('Error al renovar token:', error);
        return createResponse(401, {
          success: false,
          message: 'Error al renovar token',
          error: error instanceof Error ? error.message : 'Error desconocido'
        });
      }
    } else if (path === '/auth/register' && method === 'POST') {
      try {
        const requestBody = JSON.parse(event.body || '{}');
        const { email, password, name, role } = requestBody;

        if (!email || !password || !name) {
          return createResponse(400, {
            success: false,
            message: 'Email, contraseña y nombre son requeridos'
          });
        }

        const user = await authService.registerUser({ email, password, name, role });
        
        return createResponse(201, {
          success: true,
          message: 'Usuario registrado correctamente',
          user: {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role
          }
        });
      } catch (error) {
        console.error('Error en registro:', error);
        return createResponse(400, {
          success: false,
          message: 'Error al registrar usuario',
          error: error instanceof Error ? error.message : 'Error desconocido'
        });
      }
    } else if (path === '/auth/profile' && method === 'GET') {
      try {
        // Obtener el token del header de autorización
        const authHeader = event.headers.Authorization || event.headers.authorization;
        if (!authHeader) {
          return createResponse(401, {
            success: false,
            message: 'Token no proporcionado'
          });
        }

        const token = authHeader.replace('Bearer ', '');
        const payload = await authService.validateToken(token);
        const user = await authService.getUserById(payload.id);

        return createResponse(200, {
          success: true,
          user: {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role
          }
        });
      } catch (error) {
        console.error('Error al obtener perfil:', error);
        return createResponse(401, {
          success: false,
          message: 'Error al obtener perfil de usuario',
          error: error instanceof Error ? error.message : 'Error desconocido'
        });
      }
    }
    
    return createResponse(404, {
      success: false,
      message: 'Ruta de autenticación no encontrada'
    });
  } else if (path.startsWith('/welcome-screens')) {
    // Respuestas para las rutas de welcome-screens
    if (method === 'GET') {
      // Manejar GET /welcome-screens o GET /welcome-screens/:id
      const parts = path.split('/');
      const id = parts.length > 2 ? parts[2] : null;
      
      if (id) {
        // GET para un ID específico
        return createResponse(200, {
          data: {
            id,
            title: 'Pantalla de Bienvenida de ejemplo',
            message: 'Bienvenido a la investigación',
            isEnabled: true,
            metadata: {
              createdAt: new Date().toISOString()
            }
          }
        });
      } else {
        // GET para listar todos
        return createResponse(200, {
          data: [
            {
              id: 'welcome-1',
              title: 'Pantalla de Bienvenida 1',
              isEnabled: true
            },
            {
              id: 'welcome-2',
              title: 'Pantalla de Bienvenida 2',
              isEnabled: false
            }
          ]
        });
      }
    } else if (method === 'POST') {
      // Crear nueva pantalla de bienvenida
      return createResponse(201, {
        message: 'Pantalla de bienvenida creada',
        data: {
          id: `welcome-${Date.now()}`,
          ...JSON.parse(event.body || '{}')
        }
      });
    } else if (method === 'PUT') {
      // Actualizar pantalla existente
      return createResponse(200, {
        message: 'Pantalla de bienvenida actualizada',
        data: {
          ...JSON.parse(event.body || '{}')
        }
      });
    } else if (method === 'DELETE') {
      // Eliminar pantalla
      return createResponse(200, {
        message: 'Pantalla de bienvenida eliminada'
      });
    }
    
    // Método no soportado para esta ruta
    return createResponse(405, {
      message: 'Método no permitido para esta ruta'
    });
  } else if (path.startsWith('/thank-you-screens')) {
    // Similar a welcome-screens
    if (method === 'GET') {
      const parts = path.split('/');
      const id = parts.length > 2 ? parts[2] : null;
      
      if (id) {
        return createResponse(200, {
          data: {
            id,
            title: 'Pantalla de Agradecimiento de ejemplo',
            message: 'Gracias por participar',
            isEnabled: true,
            metadata: {
              createdAt: new Date().toISOString()
            }
          }
        });
      } else {
        return createResponse(200, {
          data: [
            {
              id: 'thanks-1',
              title: 'Pantalla de Agradecimiento 1',
              isEnabled: true
            }
          ]
        });
      }
    } else if (method === 'POST') {
      return createResponse(201, {
        message: 'Pantalla de agradecimiento creada',
        data: {
          id: `thanks-${Date.now()}`,
          ...JSON.parse(event.body || '{}')
        }
      });
    } else if (method === 'PUT') {
      return createResponse(200, {
        message: 'Pantalla de agradecimiento actualizada',
        data: {
          ...JSON.parse(event.body || '{}')
        }
      });
    } else if (method === 'DELETE') {
      return createResponse(200, {
        message: 'Pantalla de agradecimiento eliminada'
      });
    }
    
    // Método no soportado para esta ruta
    return createResponse(405, {
      message: 'Método no permitido para esta ruta'
    });
  } else if (path.startsWith('/smart-voc')) {
    // Rutas para SmartVOC
    console.log('SmartVOC request:', { path, method, body: event.body });
    
    if (method === 'GET') {
      // GET para obtener un formulario específico
      if (path.includes('/smart-voc/')) {
        const pathParts = path.split('/');
        const formId = pathParts[pathParts.length - 1];
        
        // Si es un ID numérico, tratarlo como ID de formulario
        if (/^\d+$/.test(formId)) {
          return createResponse(200, {
            data: {
              id: formId,
              researchId: "research-123",
              questions: [
                {
                  id: "q1",
                  type: "CSAT",
                  title: "Customer Satisfaction",
                  description: "¿Cómo califica su experiencia?",
                  required: true,
                  showConditionally: false,
                  config: {
                    type: "stars",
                    companyName: "Empresa"
                  }
                },
                {
                  id: "q2",
                  type: "CES",
                  title: "Customer Effort Score",
                  description: "¿Fue fácil resolver su problema?",
                  required: true,
                  showConditionally: false,
                  config: {
                    type: "scale",
                    scaleRange: { start: 1, end: 7 }
                  }
                }
              ],
              randomizeQuestions: false,
              smartVocRequired: true,
              metadata: {
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
              }
            }
          });
        }
      }
      
      // Manejar GET por researchId (usado en /research/:researchId/smart-voc)
      if (path.includes('/research/') && path.includes('/smart-voc')) {
        const pathParts = path.split('/');
        const researchIdIndex = pathParts.findIndex(part => part === 'research') + 1;
        const researchId = pathParts[researchIdIndex];
        
        // Simular respuesta para getByResearchId
        return createResponse(200, {
          data: {
            id: `form-${Date.now()}`,
            researchId: researchId,
            questions: [
              {
                id: "q1",
                type: "CSAT",
                title: "Customer Satisfaction",
                description: "¿Cómo califica su experiencia?",
                required: true,
                showConditionally: false,
                config: {
                  type: "stars",
                  companyName: "Empresa"
                }
              }
            ],
            randomizeQuestions: false,
            smartVocRequired: true,
            metadata: {
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString()
            }
          }
        });
      }
      
      // GET para listar todos
      return createResponse(200, {
        data: [
          {
            id: "form-1",
            researchId: "research-123",
            questions: [
              {
                id: "q1",
                type: "CSAT",
                title: "Customer Satisfaction",
                description: "¿Cómo califica su experiencia?",
                required: true,
                showConditionally: false,
                config: {
                  type: "stars",
                  companyName: "Empresa"
                }
              }
            ],
            randomizeQuestions: false,
            smartVocRequired: true
          }
        ]
      });
    } else if (method === 'POST') {
      // Crear nuevo formulario SmartVOC
      const requestBody = JSON.parse(event.body || '{}');
      
      // Ruta para clonar
      if (path.endsWith('/clone')) {
        return createResponse(201, {
          message: 'Formulario SmartVOC clonado exitosamente',
          data: {
            id: `form-clone-${Date.now()}`,
            ...requestBody,
            metadata: {
              ...(requestBody.metadata || {}),
              clonedAt: new Date().toISOString(),
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString()
            }
          }
        });
      }
      
      // Crear nuevo
      return createResponse(201, {
        message: 'Formulario SmartVOC creado exitosamente',
        data: {
          id: `form-${Date.now()}`,
          ...requestBody,
          metadata: {
            ...(requestBody.metadata || {}),
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          }
        }
      });
    } else if (method === 'PUT') {
      // Actualizar formulario existente
      const requestBody = JSON.parse(event.body || '{}');
      const pathParts = path.split('/');
      const formId = path.includes('/smart-voc/') ? pathParts[pathParts.length - 1] : null;
      
      return createResponse(200, {
        message: 'Formulario SmartVOC actualizado exitosamente',
        data: {
          id: formId || `form-${Date.now()}`,
          ...requestBody,
          metadata: {
            ...(requestBody.metadata || {}),
            updatedAt: new Date().toISOString()
          }
        }
      });
    } else if (method === 'DELETE') {
      // Eliminar formulario
      return createResponse(200, {
        message: 'Formulario SmartVOC eliminado exitosamente'
      });
    }
    
    // Método no soportado para esta ruta
    return createResponse(405, {
      message: 'Método no permitido para esta ruta'
    });
  } else if (path.startsWith('/research/')) {
    // Manejo de rutas de research
    const pathParts = path.split('/');
    const researchId = pathParts[2]; // /research/{researchId}
    
    if (!researchId) {
      return createResponse(400, {
        success: false,
        message: 'ID de investigación no proporcionado'
      });
    }

    if (method === 'GET') {
      // Obtener detalles de la investigación
      return createResponse(200, {
        success: true,
        data: {
          id: researchId,
          title: 'Investigación de ejemplo',
          description: 'Esta es una investigación de prueba',
          status: 'active',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          metadata: {
            type: 'eye-tracking',
            participantCount: 0,
            settings: {
              allowAnonymous: true,
              requireConsent: true
            }
          }
        }
      });
    } else if (method === 'PUT') {
      // Actualizar investigación
      const requestBody = JSON.parse(event.body || '{}');
      return createResponse(200, {
        success: true,
        message: 'Investigación actualizada correctamente',
        data: {
          id: researchId,
          ...requestBody,
          updatedAt: new Date().toISOString()
        }
      });
    } else if (method === 'DELETE') {
      // Eliminar investigación
      return createResponse(200, {
        success: true,
        message: 'Investigación eliminada correctamente'
      });
    }
    
    return createResponse(405, {
      success: false,
      message: 'Método no permitido para esta ruta'
    });
  } else {
    // Ruta raíz - documentación de la API
    if (path === '/' || path === '') {
      return createResponse(200, {
        message: 'EmotioXV2 Backend API',
        status: 'Activo',
        version: '2.0.0',
        endpoints: [
          '/auth/login - Iniciar sesión (POST)',
          '/auth/register - Registrar nuevo usuario (POST)',
          '/auth/profile - Obtener perfil de usuario (GET)',
          '/welcome-screens - Configuración de pantallas de bienvenida (GET, POST, PUT, DELETE)',
          '/thank-you-screens - Configuración de pantallas de agradecimiento (GET, POST, PUT, DELETE)',
          '/smart-voc - Configuración de formularios SmartVOC (GET, POST, PUT, DELETE)',
          '/smart-voc/:id - Obtener, actualizar o eliminar un formulario específico (GET, PUT, DELETE)',
          '/research/:researchId/smart-voc - Obtener o crear formulario para una investigación (GET, POST)',
          '/smart-voc/clone - Clonar un formulario existente (POST)',
          '/eye-tracking - Configuración y datos de eye tracking (GET, POST, PUT, DELETE)',
          '/cognitive-task - Formularios de tareas cognitivas (GET, POST, PUT, DELETE)'
        ]
      });
    }
    
    // Ruta no encontrada
    return createResponse(404, {
      message: `Ruta no encontrada: ${path}`,
      status: 'error',
      endpoints: [
        '/auth - Autenticación y gestión de usuarios',
        '/welcome-screens - Configuración de pantallas de bienvenida (GET, POST, PUT, DELETE)',
        '/thank-you-screens - Configuración de pantallas de agradecimiento (GET, POST, PUT, DELETE)',
        '/smart-voc - Configuración de formularios SmartVOC (GET, POST, PUT, DELETE)',
        '/eye-tracking - Configuración y datos de eye tracking (GET, POST, PUT, DELETE)',
        '/cognitive-task - Formularios de tareas cognitivas (GET, POST, PUT, DELETE)'
      ]
    });
  }
};
