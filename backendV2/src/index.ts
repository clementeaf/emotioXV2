import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { authService } from './services/auth.service';
import { v4 as uuidv4 } from 'uuid';
import { WelcomeScreenController } from './controllers/welcomeScreen.controller';
import { validateTokenAndSetupAuth } from './utils/controller.utils';
import cognitiveTaskController from './controllers/cognitiveTask.controller';

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
  // Extraer información de la petición
  const path = event.path;
  const method = event.httpMethod;
  
  console.log('Processing request:', { path, method });
  
  // Manejar CORS para peticiones OPTIONS
  if (method === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token',
      },
      body: ''
    };
  }

  try {
    // Rutas específicas
    if (path.match(/^\/research\/([^\/]+)\/cognitive-task(?:\/.*)?$/)) {
      // Ruta específica para cognitive-task con research ID
      console.log('[index] Solicitud específica a cognitive-task con research ID:', { path, method });
      
      // Extraer el researchId de la ruta
      const researchIdMatch = path.match(/^\/research\/([^\/]+)\/cognitive-task/);
      const researchId = researchIdMatch ? researchIdMatch[1] : null;
      
      if (researchId) {
        if (!event.pathParameters) {
          event.pathParameters = {};
        }
        event.pathParameters.researchId = researchId;
        console.log('[index] Extrayendo researchId para cognitive-task:', { path, researchId });
      }
      
      // Usar el controlador de cognitive-task
      return await cognitiveTaskController(event);
    } else if (path === '/research' || path.startsWith('/research/')) {
      // Manejo de rutas de research
      if (path === '/research') {
        if (method === 'POST') {
          try {
            // Verificar que hay un cuerpo en la petición
            if (!event.body) {
              return createResponse(400, {
                success: false,
                message: 'Se requieren datos para crear la investigación'
              });
            }

            // Parsear el cuerpo de la petición
            const researchData = JSON.parse(event.body);

            // Crear la investigación
            const newResearch = {
              id: uuidv4(),
              ...researchData,
              status: 'draft',
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString()
            };

            return createResponse(201, {
              success: true,
              message: 'Investigación creada exitosamente',
              data: newResearch
            });
          } catch (error) {
            console.error('Error al crear investigación:', error);
            return createResponse(500, {
              success: false,
              message: 'Error al crear la investigación'
            });
          }
        }
      } else if (path.startsWith('/research/')) {
        // Manejo de rutas específicas de research
        const pathParts = path.split('/');
        const researchId = pathParts[2];

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
      }

      // Método no soportado para esta ruta
      return createResponse(405, {
        success: false,
        message: 'Método no permitido para esta ruta'
      });
    } else if (path === '/auth/login') {
      if (method === 'POST') {
        try {
          if (!event.body) {
            return createResponse(400, {
              success: false,
              message: 'Se requieren credenciales para iniciar sesión'
            });
          }

          const credentials = JSON.parse(event.body);
          
          // Validar que se proporcionaron las credenciales necesarias
          if (!credentials.email || !credentials.password) {
            return createResponse(400, {
              success: false,
              message: 'Se requiere email y contraseña'
            });
          }

          // Intentar hacer login
          const authResult = await authService.login(credentials);
          
          return createResponse(200, {
            success: true,
            message: 'Login exitoso',
            auth: authResult
          });
        } catch (error) {
          console.error('Error en login:', error);
          return createResponse(401, {
            success: false,
            message: error instanceof Error ? error.message : 'Credenciales inválidas'
          });
        }
      }
      
      return createResponse(405, {
        success: false,
        message: 'Método no permitido para esta ruta'
      });
    } else if (path === '/auth/register') {
      if (method === 'POST') {
        try {
          if (!event.body) {
            return createResponse(400, {
              success: false,
              message: 'Se requieren datos para el registro'
            });
          }

          const userData = JSON.parse(event.body);
          
          // Validar que se proporcionaron los datos necesarios
          if (!userData.email || !userData.password || !userData.name) {
            return createResponse(400, {
              success: false,
              message: 'Se requiere email, contraseña y nombre'
            });
          }

          // Intentar registrar el usuario
          const user = await authService.registerUser(userData);
          
          return createResponse(201, {
            success: true,
            message: 'Usuario registrado exitosamente',
            user
          });
        } catch (error) {
          console.error('Error en registro:', error);
          return createResponse(400, {
            success: false,
            message: error instanceof Error ? error.message : 'Error al registrar usuario'
          });
        }
      }
      
      return createResponse(405, {
        success: false,
        message: 'Método no permitido para esta ruta'
      });
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
    } else if (path.startsWith('/welcome-screen')) {
      // Extraer researchId de la ruta si existe
      // Formato esperado: /welcome-screen/research/{researchId}
      const match = path.match(/^\/welcome-screen\/research\/([^\/]+)$/);
      if (match) {
        if (!event.pathParameters) {
          event.pathParameters = {};
        }
        event.pathParameters.researchId = match[1];
        console.log('[index] Extrayendo researchId de la ruta:', { path, researchId: match[1] });
      }

      // Validar el token y obtener el userId
      const authResult = await validateTokenAndSetupAuth(event, path);
      if ('statusCode' in authResult) {
        return authResult;
      }

      // Instanciar el controlador
      const welcomeScreenController = new WelcomeScreenController();

      // Manejar los diferentes métodos HTTP
      if (method === 'GET') {
        return await welcomeScreenController.getWelcomeScreenByResearchId(event);
      } else if (method === 'POST') {
        return await welcomeScreenController.createWelcomeScreen(event, authResult.userId);
      } else if (method === 'PUT') {
        return await welcomeScreenController.updateWelcomeScreenByResearchId(event, authResult.userId);
      } else if (method === 'DELETE') {
        return await welcomeScreenController.deleteWelcomeScreen(event, authResult.userId);
      }

      return createResponse(405, {
        success: false,
        message: 'Método no permitido para esta ruta'
      });
    } else if (path.startsWith('/cognitive-task')) {
      // Usar el controlador dedicado para cognitive-task
      console.log('[index] Solicitud a cognitive-task:', { path, method });
      return await cognitiveTaskController(event);
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
    } else {
      // Ruta no encontrada - documentación de la API
      return createResponse(404, {
        success: false,
        message: 'Ruta no encontrada: ' + path,
        status: 'error',
        endpoints: [
          '/auth - Autenticación y gestión de usuarios',
          '/welcome-screens - Configuración de pantallas de bienvenida (GET, POST, PUT, DELETE)',
          '/thank-you-screens - Configuración de pantallas de agradecimiento (GET, POST, PUT, DELETE)',
          '/smart-voc - Configuración de formularios SmartVOC (GET, POST, PUT, DELETE)',
          '/eye-tracking - Configuración y datos de eye tracking (GET, POST, PUT, DELETE)',
          '/cognitive-task - Formularios de tareas cognitivas (GET, POST, PUT, DELETE)',
          '/research - Gestión de investigaciones (GET, POST, PUT, DELETE)'
        ]
      });
    }
  } catch (error) {
    console.error('Error no manejado:', error);
    return createResponse(500, {
      success: false,
      message: 'Error interno del servidor',
      error: error instanceof Error ? error.message : 'Error desconocido'
    });
  }

  // Return por defecto en caso de que ninguna ruta coincida
  return createResponse(404, {
    success: false,
    message: 'Ruta no encontrada',
    status: 'error'
  });
};
