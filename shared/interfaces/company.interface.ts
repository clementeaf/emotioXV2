/**
 * Interfaz para los datos de una empresa
 */
export interface Company {
  /** ID único de la empresa */
  id: string;
  
  /** Nombre de la empresa */
  name: string;
  
  /** Estado de la empresa */
  status: 'active' | 'inactive';
  
  /** Fecha de creación */
  createdAt: string;
  
  /** Fecha de última actualización */
  updatedAt: string;
}

/**
 * Interfaz para crear una empresa
 */
export interface CreateCompanyRequest {
  /** Nombre de la empresa */
  name: string;
  
  /** Estado inicial de la empresa (opcional, por defecto 'active') */
  status?: 'active' | 'inactive';
}

/**
 * Interfaz para actualizar una empresa
 */
export interface UpdateCompanyRequest {
  /** Nombre de la empresa (opcional) */
  name?: string;
  
  /** Estado de la empresa (opcional) */
  status?: 'active' | 'inactive';
}

/**
 * Interfaz para la respuesta al obtener empresas
 */
export interface GetCompaniesResponse {
  /** Indica si la operación fue exitosa */
  success: boolean;
  
  /** Lista de empresas */
  data: Company[];
  
  /** Número total de empresas */
  count: number;
}

/**
 * Interfaz para la respuesta al crear/actualizar una empresa
 */
export interface CompanyResponse {
  /** Indica si la operación fue exitosa */
  success: boolean;
  
  /** Mensaje de la operación */
  message: string;
  
  /** Datos de la empresa */
  data: Company;
}