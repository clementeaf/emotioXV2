import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { BadRequestError, InternalServerError, NotFoundError } from '../errors';
import { getCorsHeaders } from '../middlewares/cors';
import { CompanyError, companyService } from '../services/company.service';
import { createController } from '../utils/controller.utils';
import { extractAuthDataFromEvent } from '../utils/controller.utils';

/**
 * Controlador para manejar operaciones CRUD de empresas
 */
class CompanyController {
  /**
   * Obtiene todas las empresas (GET /companies)
   */
  async getAllCompanies(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
    try {
      console.log('[CompanyController] Procesando solicitud GET /companies');

      const companies = await companyService.getAllCompanies();

      return {
        statusCode: 200,
        headers: getCorsHeaders(event),
        body: JSON.stringify({
          success: true,
          data: companies,
          count: companies.length
        })
      };
    } catch (error) {
      console.error('[CompanyController] Error al obtener empresas:', error);

      if (error instanceof CompanyError) {
        return {
          statusCode: error.statusCode,
          headers: getCorsHeaders(event),
          body: JSON.stringify({
            success: false,
            message: error.message,
            validationErrors: error.validationErrors
          })
        };
      }

      return {
        statusCode: 500,
        headers: getCorsHeaders(event),
        body: JSON.stringify({
          success: false,
          message: 'Error interno del servidor'
        })
      };
    }
  }

  /**
   * Obtiene una empresa por ID (GET /companies/{id})
   */
  async getCompanyById(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
    try {
      const companyId = event.pathParameters?.id;
      
      if (!companyId) {
        throw new BadRequestError('ID de empresa requerido');
      }

      console.log(`[CompanyController] Procesando solicitud GET /companies/${companyId}`);

      const company = await companyService.getCompanyById(companyId);

      return {
        statusCode: 200,
        headers: getCorsHeaders(event),
        body: JSON.stringify({
          success: true,
          data: company
        })
      };
    } catch (error) {
      console.error('[CompanyController] Error al obtener empresa por ID:', error);

      if (error instanceof CompanyError) {
        return {
          statusCode: error.statusCode,
          headers: getCorsHeaders(event),
          body: JSON.stringify({
            success: false,
            message: error.message,
            validationErrors: error.validationErrors
          })
        };
      }

      if (error instanceof BadRequestError) {
        return {
          statusCode: 400,
          headers: getCorsHeaders(event),
          body: JSON.stringify({
            success: false,
            message: error.message
          })
        };
      }

      return {
        statusCode: 500,
        headers: getCorsHeaders(event),
        body: JSON.stringify({
          success: false,
          message: 'Error interno del servidor'
        })
      };
    }
  }

  /**
   * Crea una nueva empresa (POST /companies)
   */
  async createCompany(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
    try {
      console.log('[CompanyController] Procesando solicitud POST /companies');

      // Extraer datos de autenticación
      const authData = extractAuthDataFromEvent(event);
      const userId = authData.userId;

      // Parsear el body
      if (!event.body) {
        throw new BadRequestError('Datos de empresa requeridos');
      }

      const companyData = JSON.parse(event.body);
      console.log('[CompanyController] Datos recibidos:', JSON.stringify(companyData));

      // Validar que el nombre esté presente
      if (!companyData.name || companyData.name.trim().length === 0) {
        throw new BadRequestError('El nombre de la empresa es requerido');
      }

      const company = await companyService.createCompany(companyData, userId);

      return {
        statusCode: 201,
        headers: getCorsHeaders(event),
        body: JSON.stringify({
          success: true,
          message: 'Empresa creada exitosamente',
          data: company
        })
      };
    } catch (error) {
      console.error('[CompanyController] Error al crear empresa:', error);

      if (error instanceof CompanyError) {
        return {
          statusCode: error.statusCode,
          headers: getCorsHeaders(event),
          body: JSON.stringify({
            success: false,
            message: error.message,
            validationErrors: error.validationErrors
          })
        };
      }

      if (error instanceof BadRequestError) {
        return {
          statusCode: 400,
          headers: getCorsHeaders(event),
          body: JSON.stringify({
            success: false,
            message: error.message
          })
        };
      }

      if (error instanceof SyntaxError) {
        return {
          statusCode: 400,
          headers: getCorsHeaders(event),
          body: JSON.stringify({
            success: false,
            message: 'JSON inválido en el cuerpo de la solicitud'
          })
        };
      }

      return {
        statusCode: 500,
        headers: getCorsHeaders(event),
        body: JSON.stringify({
          success: false,
          message: 'Error interno del servidor'
        })
      };
    }
  }

  /**
   * Actualiza una empresa existente (PUT /companies/{id})
   */
  async updateCompany(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
    try {
      const companyId = event.pathParameters?.id;
      
      if (!companyId) {
        throw new BadRequestError('ID de empresa requerido');
      }

      console.log(`[CompanyController] Procesando solicitud PUT /companies/${companyId}`);

      // Parsear el body
      if (!event.body) {
        throw new BadRequestError('Datos de empresa requeridos');
      }

      const updateData = JSON.parse(event.body);
      console.log('[CompanyController] Datos de actualización:', JSON.stringify(updateData));

      const updatedCompany = await companyService.updateCompany(companyId, updateData);

      return {
        statusCode: 200,
        headers: getCorsHeaders(event),
        body: JSON.stringify({
          success: true,
          message: 'Empresa actualizada exitosamente',
          data: updatedCompany
        })
      };
    } catch (error) {
      console.error('[CompanyController] Error al actualizar empresa:', error);

      if (error instanceof CompanyError) {
        return {
          statusCode: error.statusCode,
          headers: getCorsHeaders(event),
          body: JSON.stringify({
            success: false,
            message: error.message,
            validationErrors: error.validationErrors
          })
        };
      }

      if (error instanceof BadRequestError) {
        return {
          statusCode: 400,
          headers: getCorsHeaders(event),
          body: JSON.stringify({
            success: false,
            message: error.message
          })
        };
      }

      if (error instanceof SyntaxError) {
        return {
          statusCode: 400,
          headers: getCorsHeaders(event),
          body: JSON.stringify({
            success: false,
            message: 'JSON inválido en el cuerpo de la solicitud'
          })
        };
      }

      return {
        statusCode: 500,
        headers: getCorsHeaders(event),
        body: JSON.stringify({
          success: false,
          message: 'Error interno del servidor'
        })
      };
    }
  }

  /**
   * Elimina una empresa (DELETE /companies/{id})
   */
  async deleteCompany(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
    try {
      const companyId = event.pathParameters?.id;
      
      if (!companyId) {
        throw new BadRequestError('ID de empresa requerido');
      }

      console.log(`[CompanyController] Procesando solicitud DELETE /companies/${companyId}`);

      const result = await companyService.deleteCompany(companyId);

      return {
        statusCode: 200,
        headers: getCorsHeaders(event),
        body: JSON.stringify({
          success: true,
          message: result.message
        })
      };
    } catch (error) {
      console.error('[CompanyController] Error al eliminar empresa:', error);

      if (error instanceof CompanyError) {
        return {
          statusCode: error.statusCode,
          headers: getCorsHeaders(event),
          body: JSON.stringify({
            success: false,
            message: error.message,
            validationErrors: error.validationErrors
          })
        };
      }

      if (error instanceof BadRequestError) {
        return {
          statusCode: 400,
          headers: getCorsHeaders(event),
          body: JSON.stringify({
            success: false,
            message: error.message
          })
        };
      }

      return {
        statusCode: 500,
        headers: getCorsHeaders(event),
        body: JSON.stringify({
          success: false,
          message: 'Error interno del servidor'
        })
      };
    }
  }
}

// Crear el controlador con el patrón establecido
const companyController = new CompanyController();

/**
 * Handler principal que maneja todas las rutas de empresas
 */
export const handler = createController(async (event: APIGatewayProxyEvent) => {
  const httpMethod = event.httpMethod;
  const resource = event.resource;

  console.log(`[CompanyController] ${httpMethod} ${resource}`);

  // Routing basado en método HTTP y resource
  switch (httpMethod) {
    case 'GET':
      if (resource === '/companies') {
        return companyController.getAllCompanies(event);
      } else if (resource === '/companies/{id}') {
        return companyController.getCompanyById(event);
      }
      break;

    case 'POST':
      if (resource === '/companies') {
        return companyController.createCompany(event);
      }
      break;

    case 'PUT':
      if (resource === '/companies/{id}') {
        return companyController.updateCompany(event);
      }
      break;

    case 'DELETE':
      if (resource === '/companies/{id}') {
        return companyController.deleteCompany(event);
      }
      break;
  }

  // Si no se encuentra la ruta
  throw new NotFoundError(`Ruta no encontrada: ${httpMethod} ${resource}`);
});