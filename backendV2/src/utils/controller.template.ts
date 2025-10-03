import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { createResponse, errorResponse } from './controller.utils';
import { createController, RouteMap } from './controller.decorator';

/**
 * PLANTILLA PARA NUEVOS CONTROLADORES
 * 
 * Este archivo sirve como referencia para crear nuevos controladores
 * usando el patrón estandarizado con createController
 * 
 * Para crear un nuevo controlador:
 * 1. Copia este archivo y renómbralo según el recurso que manejará
 * 2. Reemplaza los nombres de las clases, métodos y rutas
 * 3. Implementa la lógica específica de cada método
 * 4. Define el mapa de rutas y las opciones del controlador
 * 5. Exporta el handler generado por createController
 */

/**
 * Controlador de ejemplo para un recurso
 */
export class ExampleController {
  /**
   * Crea un nuevo recurso
   */
  async createExample(event: APIGatewayProxyEvent, _userId: string): Promise<APIGatewayProxyResult> {
    try {
      // Verificar que hay un cuerpo en la petición
      if (!event.body) {
        return errorResponse('Se requieren datos para crear el recurso', 400);
      }
      
      // Parsear el cuerpo de la petición
      const data = JSON.parse(event.body);
      
      // TODO: Validar datos y llamar al servicio correspondiente
      
      // Devolver respuesta exitosa
      return createResponse(201, {
        message: 'Recurso creado exitosamente',
        data: { id: 'example-id', ...data }
      });
    } catch (error: unknown) {
      console.error('Error en createExample:', error);
      return this.handleError(error instanceof Error ? error : new Error(String(error)));
    }
  }
  
  /**
   * Obtiene un recurso por su ID
   */
  async getExampleById(event: APIGatewayProxyEvent, _userId: string): Promise<APIGatewayProxyResult> {
    try {
      // Obtener el ID desde los parámetros de ruta
      const id = event.pathParameters?.id;
      if (!id) {
        return errorResponse('Se requiere un ID de recurso', 400);
      }
      
      // TODO: Llamar al servicio para obtener el recurso
      
      // Devolver respuesta exitosa
      return createResponse(200, {
        data: { id, name: 'Example Resource' }
      });
    } catch (error: unknown) {
      console.error('Error en getExampleById:', error);
      return this.handleError(error instanceof Error ? error : new Error(String(error)));
    }
  }
  
  /**
   * Maneja errores y genera respuestas HTTP adecuadas
   */
  private handleError(error: Error): APIGatewayProxyResult {
    console.error('Error en ExampleController:', error);
    
    // TODO: Personalizar el manejo de errores según los tipos específicos
    
    // Ejemplo de mapeo de errores a códigos HTTP
    if (error.message?.includes('no encontrado')) {
      return errorResponse(error.message, 404);
    }
    
    if (error.message?.includes('datos inválidos')) {
      return errorResponse(error.message, 400);
    }
    
    // Error genérico para otros casos
    return errorResponse('Error interno del servidor', 500);
  }
}

// Instanciar el controlador
const controller = new ExampleController();

// Definir el mapa de rutas
const exampleRouteMap: RouteMap = {
  '/examples': {
    'GET': controller.getExampleById.bind(controller),
    'POST': controller.createExample.bind(controller)
  },
  
  '/examples/:id': {
    'GET': controller.getExampleById.bind(controller)
  }
};

/**
 * Manejador principal para las rutas del recurso
 */
export const exampleHandler = createController(exampleRouteMap, {
  basePath: '/examples',
  // Define aquí las rutas públicas si es necesario
  publicRoutes: [
    { path: '/', method: 'GET' }
  ]
}); 