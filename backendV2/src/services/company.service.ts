import { Company, companyModel } from '../models/company.model';
import { ValidationError } from '../utils/validation';
// import { validateRequiredFields } from '../utils/validation';

/**
 * Clase de error para operaciones de empresa
 */
export class CompanyError extends Error {
  statusCode: number;
  validationErrors?: Record<string, string>;

  constructor(message: string, statusCode: number = 500, validationErrors?: Record<string, string>) {
    super(message);
    this.name = 'CompanyError';
    this.statusCode = statusCode;
    this.validationErrors = validationErrors;
  }
}

/**
 * Servicio para manejar operaciones CRUD de empresas
 */
export class CompanyService {
  /**
   * Crea una nueva empresa
   * @param data Datos de la empresa
   * @param userId ID del usuario creador
   * @returns Empresa creada con su ID
   */
  async createCompany(data: Company, userId: string): Promise<Company> {
    try {
      console.log('Creando nueva empresa con datos:', JSON.stringify(data));
      console.log('Usuario ID:', userId);

      // Validar campos requeridos
      this.validateCompanyData(data);
      console.log('Validación de datos completada');

      const result = await companyModel.create(data, userId);
      console.log('Empresa creada exitosamente:', JSON.stringify(result));
      return result;
    } catch (error) {
      console.error('Error detallado al crear empresa:', error);

      if (error instanceof CompanyError) {
        throw error;
      }

      if (error instanceof ValidationError) {
        throw new CompanyError('Error de validación en los datos', 400, error.errors);
      }

      console.error('Error al crear empresa:', error);
      throw new CompanyError('Error al crear la empresa', 500);
    }
  }

  /**
   * Obtiene una empresa por su ID
   * @param id ID de la empresa
   * @returns Datos de la empresa
   */
  async getCompanyById(id: string): Promise<Company> {
    try {
      console.log(`[CompanyService] Buscando empresa por ID: ${id}`);
      const company = await companyModel.getById(id);
      
      if (!company) {
        console.log(`[CompanyService] Empresa ${id} no encontrada, devolviendo 404`);
        throw new CompanyError('Empresa no encontrada', 404);
      }
      
      console.log(`[CompanyService] Empresa ${id} encontrada exitosamente`);
      return company;
    } catch (error) {
      if (error instanceof CompanyError) {
        throw error;
      }
      console.error('Error al obtener empresa:', error);
      throw new CompanyError('Error al obtener la empresa', 500);
    }
  }

  /**
   * Obtiene todas las empresas
   * @returns Lista de todas las empresas
   */
  async getAllCompanies(): Promise<Company[]> {
    try {
      console.log('[CompanyService] Obteniendo todas las empresas');
      const companies = await companyModel.getAll();
      console.log(`[CompanyService] ${companies.length} empresas encontradas`);
      return companies;
    } catch (error) {
      console.error('Error al obtener todas las empresas desde el modelo:', error);
      throw new CompanyError('Error al obtener las empresas', 500);
    }
  }

  /**
   * Actualiza una empresa existente
   * @param id ID de la empresa
   * @param data Datos a actualizar
   * @returns Empresa actualizada
   */
  async updateCompany(id: string, data: Partial<Company>): Promise<Company> {
    try {
      // Verificar existencia
      const existingCompany = await companyModel.getById(id);
      if (!existingCompany) {
        throw new CompanyError('Empresa no encontrada', 404);
      }

      // Validar datos antes de actualizar
      if (data.name !== undefined) {
        this.validateCompanyData({ name: data.name } as Company);
      }

      // Actualizar empresa
      return await companyModel.update(id, data);
    } catch (error) {
      if (error instanceof CompanyError) {
        throw error;
      }
      if (error instanceof ValidationError) {
        throw new CompanyError('Error de validación en los datos', 400, error.errors);
      }
      console.error('Error al actualizar empresa:', error);
      throw new CompanyError('Error al actualizar la empresa', 500);
    }
  }

  /**
   * Elimina una empresa
   * @param id ID de la empresa
   * @returns Confirmación de eliminación
   */
  async deleteCompany(id: string): Promise<{ message: string }> {
    try {
      // Verificar existencia
      const existingCompany = await companyModel.getById(id);
      if (!existingCompany) {
        throw new CompanyError('Empresa no encontrada', 404);
      }

      // Eliminar empresa
      await companyModel.delete(id);
      return { message: 'Empresa eliminada exitosamente' };
    } catch (error) {
      if (error instanceof CompanyError) {
        throw error;
      }
      console.error('Error al eliminar empresa:', error);
      throw new CompanyError('Error al eliminar la empresa', 500);
    }
  }

  /**
   * Valida los datos de una empresa
   * @param data Datos a validar
   */
  private validateCompanyData(data: Partial<Company>): void {
    const errors: Record<string, string> = {};

    // Validar nombre (requerido)
    if (data.name !== undefined) {
      if (!data.name || data.name.trim().length === 0) {
        errors.name = 'El nombre de la empresa es requerido';
      } else if (data.name.trim().length < 2) {
        errors.name = 'El nombre debe tener al menos 2 caracteres';
      } else if (data.name.trim().length > 100) {
        errors.name = 'El nombre no puede tener más de 100 caracteres';
      }
    }

    // Validar status si se proporciona
    if (data.status !== undefined) {
      if (!['active', 'inactive'].includes(data.status)) {
        errors.status = 'El estado debe ser "active" o "inactive"';
      }
    }

    if (Object.keys(errors).length > 0) {
      throw new ValidationError('Errores de validación', errors);
    }
  }
}

// Exportar instancia única
export const companyService = new CompanyService();