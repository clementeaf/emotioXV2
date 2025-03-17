import { formModel, Form, FormField, FormType } from '../models/form.model';
import { formResponseModel, FormResponse as FormResponseModel, FormResponseItem } from '../models/form-response.model';
import { researchService } from './research.service';

export interface FormCreateData {
  userId: string;
  researchId: string;
  title: string;
  description?: string;
  questions: FormField[];
  isPublished?: boolean;
}

export interface FormUpdateData {
  title?: string;
  description?: string;
  questions?: FormField[];
  isPublished?: boolean;
}

export interface FormResponse {
  id: string;
  formId: string;
  responses: Array<{
    questionId: string;
    answer: any;
  }>;
  respondentInfo?: {
    email?: string;
    name?: string;
    [key: string]: any;
  };
  createdAt: number;
}

export class FormsService {
  /**
   * Crea un nuevo formulario
   */
  async createForm(data: FormCreateData): Promise<Form> {
    // Convertir la estructura de datos recibida al formato esperado por el modelo
    const formData = {
      userId: data.userId,
      researchId: data.researchId,
      type: 'custom' as FormType, // Por defecto es un formulario personalizado
      title: data.title,
      description: data.description || '',
      fields: data.questions,
      isEnabled: true,
      order: 0, // Por defecto es el primer formulario
      isPublished: data.isPublished || false
    };
    
    return formModel.create(formData);
  }

  /**
   * Obtiene un formulario por su ID
   */
  async getFormById(id: string): Promise<Form | null> {
    return formModel.findById(id);
  }

  /**
   * Obtiene todos los formularios de una investigación
   */
  async getFormsByResearchId(researchId: string, userId: string): Promise<Form[]> {
    // Verificar que el usuario tiene acceso a la investigación
    const hasAccess = await researchService.isResearchOwner(userId, researchId);
    if (!hasAccess) {
      return [];
    }
    
    return formModel.findByResearchId(researchId);
  }

  /**
   * Obtiene todos los formularios de un usuario
   */
  async getFormsByUserId(userId: string): Promise<Form[]> {
    // Implementar la búsqueda de formularios por userId
    // Esto podría requerir un nuevo índice en DynamoDB o una consulta filtrada
    // Por ahora, podemos obtener todas las investigaciones del usuario y luego sus formularios
    const researches = await researchService.getResearchByUserId(userId);
    
    if (researches.length === 0) {
      return [];
    }
    
    // Obtener formularios para cada investigación
    const formPromises = researches.map(research => 
      formModel.findByResearchId(research.id)
    );
    
    const formArrays = await Promise.all(formPromises);
    
    // Aplanar el array de arrays
    return formArrays.flat();
  }

  /**
   * Actualiza un formulario
   */
  async updateForm(id: string, data: FormUpdateData): Promise<Form> {
    // Convertir la estructura de datos recibida al formato esperado por el modelo
    const updateData: any = {};
    
    if (data.title !== undefined) updateData.title = data.title;
    if (data.description !== undefined) updateData.description = data.description;
    if (data.questions !== undefined) updateData.fields = data.questions;
    if (data.isPublished !== undefined) updateData.isPublished = data.isPublished;
    
    return formModel.update(id, updateData);
  }

  /**
   * Elimina un formulario
   */
  async deleteForm(id: string): Promise<void> {
    await formModel.delete(id);
  }

  /**
   * Publica un formulario
   */
  async publishForm(id: string): Promise<Form> {
    return formModel.update(id, { isPublished: true });
  }

  /**
   * Despublica un formulario
   */
  async unpublishForm(id: string): Promise<Form> {
    return formModel.update(id, { isPublished: false });
  }

  /**
   * Obtiene un formulario público por su ID
   * Solo devuelve formularios que estén publicados
   */
  async getPublicFormById(id: string): Promise<Form | null> {
    const form = await formModel.findById(id);
    
    // Solo devolver el formulario si está publicado
    if (form && form.isPublished) {
      return form;
    }
    
    return null;
  }

  /**
   * Envía respuestas a un formulario
   */
  async submitResponses(
    formId: string, 
    responses: Array<{ questionId: string; answer: any }>,
    respondentInfo?: { [key: string]: any }
  ): Promise<FormResponse> {
    // Verificar que el formulario existe y está publicado
    const form = await this.getPublicFormById(formId);
    if (!form) {
      throw new Error('Form not found or not published');
    }
    
    // Convertir las respuestas al formato del modelo
    const responseItems: FormResponseItem[] = responses.map(response => ({
      questionId: response.questionId,
      answer: response.answer
    }));
    
    // Crear la respuesta en la base de datos
    const formResponse = await formResponseModel.create({
      formId,
      researchId: form.researchId,
      responses: responseItems,
      respondentInfo
    });
    
    // Convertir al formato de respuesta de la API
    return {
      id: formResponse.id,
      formId: formResponse.formId,
      responses: formResponse.responses,
      respondentInfo: formResponse.respondentInfo,
      createdAt: formResponse.createdAt
    };
  }

  /**
   * Obtiene las respuestas de un formulario
   */
  async getFormResponses(formId: string): Promise<FormResponse[]> {
    // Obtener las respuestas de la base de datos
    const responses = await formResponseModel.findByFormId(formId);
    
    // Convertir al formato de respuesta de la API
    return responses.map(response => ({
      id: response.id,
      formId: response.formId,
      responses: response.responses,
      respondentInfo: response.respondentInfo,
      createdAt: response.createdAt
    }));
  }

  /**
   * Verifica si un usuario es propietario de un formulario
   */
  async isFormOwner(userId: string, formId: string): Promise<boolean> {
    const form = await formModel.findById(formId);
    return form !== null && form.userId === userId;
  }

  /**
   * Verifica si un usuario tiene acceso a un formulario a través de la investigación
   */
  async hasAccessToForm(userId: string, formId: string): Promise<boolean> {
    // Verificar si es propietario directo del formulario
    const isOwner = await this.isFormOwner(userId, formId);
    if (isOwner) {
      return true;
    }

    // Verificar si es propietario de la investigación asociada
    const form = await formModel.findById(formId);
    if (!form) {
      return false;
    }

    return researchService.isResearchOwner(userId, form.researchId);
  }
}

// Singleton para reutilizar en toda la aplicación
export const formsService = new FormsService(); 