import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { BadRequestError, NotFoundError } from '../errors';
// import { InternalServerError } from '../errors';
import { getCorsHeaders } from '../middlewares/cors';
import { CompanyError, companyService } from '../services/company.service';
import { validateTokenAndSetupAuth } from '../utils/controller.utils';

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

      // Validar token y configurar contexto de autenticación
      const authResult = await validateTokenAndSetupAuth(event, '/companies');
      
      // Si authResult contiene una respuesta de error, devolverla
      if ('statusCode' in authResult) {
        return authResult;
      }
      
      const userId = authResult.userId;

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
export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  const httpMethod = event.httpMethod;
  const path = event.path;

  console.log(`[CompanyController] ${httpMethod} ${path}`);

  try {
    // Routing basado en método HTTP y path
    switch (httpMethod) {
      case 'GET':
        if (path === '/companies') {
          return await companyController.getAllCompanies(event);
        } else if (path.startsWith('/companies/')) {
          return await companyController.getCompanyById(event);
        }
        break;

      case 'POST':
        if (path === '/companies') {
          return await companyController.createCompany(event);
        }
        break;

      case 'PUT':
        if (path.startsWith('/companies/')) {
          return await companyController.updateCompany(event);
        }
        break;

      case 'DELETE':
        if (path.startsWith('/companies/')) {
          return await companyController.deleteCompany(event);
        }
        break;
    }

    // Si no se encuentra la ruta
    throw new NotFoundError(`Ruta no encontrada: ${httpMethod} ${path}`);
  } catch (error) {
    console.error('[CompanyController] Error:', error);
    if (error instanceof NotFoundError) {
      return {
        statusCode: 404,
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
};