import { EducationalContentModel, CreateEducationalContentRequest, UpdateEducationalContentRequest, EducationalContent } from '../models/EducationalContentModel';

export class EducationalContentService {
  static async createEducationalContent(data: CreateEducationalContentRequest): Promise<EducationalContent> {
    // Verificar si ya existe contenido para este usuario y tipo
    const existingContent = await EducationalContentModel.getByUserIdAndType(data.userId, data.contentType);
    if (existingContent) {
      throw new Error(`Educational content for ${data.contentType} already exists for this user`);
    }

    return await EducationalContentModel.create(data);
  }

  static async getEducationalContent(userId: string, contentType: 'smart_voc' | 'cognitive_task'): Promise<EducationalContent> {
    let content = await EducationalContentModel.getByUserIdAndType(userId, contentType);
    
    // Si no existe contenido personalizado, crear uno con valores por defecto
    if (!content) {
      const defaultContent = await EducationalContentModel.getDefaultContent(contentType);
      
      const createData: CreateEducationalContentRequest = {
        contentType,
        userId,
        title: defaultContent.title || '',
        generalDescription: defaultContent.generalDescription || '',
        typeExplanation: defaultContent.typeExplanation || '',
      };

      content = await EducationalContentModel.create(createData);
    }

    return content;
  }

  static async updateEducationalContent(userId: string, contentType: 'smart_voc' | 'cognitive_task', updates: UpdateEducationalContentRequest): Promise<EducationalContent> {
    let existingContent = await EducationalContentModel.getByUserIdAndType(userId, contentType);
    
    if (existingContent) {
      // Actualizar contenido existente
      const updatedContent = await EducationalContentModel.update(existingContent.id, updates);
      if (!updatedContent) {
        throw new Error('Failed to update educational content');
      }
      return updatedContent;
    } else {
      // Crear nuevo contenido con valores por defecto + actualizaciones
      const defaultContent = await EducationalContentModel.getDefaultContent(contentType);
      
      const createData: CreateEducationalContentRequest = {
        contentType,
        userId,
        title: updates.title || defaultContent.title || '',
        generalDescription: updates.generalDescription || defaultContent.generalDescription || '',
        typeExplanation: updates.typeExplanation || defaultContent.typeExplanation || '',
      };
      
      return await EducationalContentModel.create(createData);
    }
  }

  static async getAllEducationalContent(userId: string): Promise<EducationalContent[]> {
    const userContent = await EducationalContentModel.getAllByUserId(userId);
    const contentTypes: ('smart_voc' | 'cognitive_task')[] = ['smart_voc', 'cognitive_task'];
    const result: EducationalContent[] = [];

    for (const contentType of contentTypes) {
      let content = userContent.find(c => c.contentType === contentType);
      
      if (!content) {
        // Crear contenido con valores por defecto si no existe
        const defaultContent = await EducationalContentModel.getDefaultContent(contentType);
        
        const createData: CreateEducationalContentRequest = {
          contentType,
          userId,
          title: defaultContent.title || '',
          generalDescription: defaultContent.generalDescription || '',
          typeExplanation: defaultContent.typeExplanation || '',
        };

        content = await EducationalContentModel.create(createData);
      }
      
      result.push(content);
    }

    return result;
  }

  static async deleteEducationalContent(userId: string, contentType: 'smart_voc' | 'cognitive_task'): Promise<void> {
    const existingContent = await EducationalContentModel.getByUserIdAndType(userId, contentType);
    
    if (!existingContent) {
      throw new Error(`Educational content for ${contentType} not found for this user`);
    }

    await EducationalContentModel.delete(existingContent.id);
  }

  static async resetToDefault(userId: string, contentType: 'smart_voc' | 'cognitive_task'): Promise<EducationalContent> {
    // Eliminar contenido personalizado si existe
    const existingContent = await EducationalContentModel.getByUserIdAndType(userId, contentType);
    if (existingContent) {
      await EducationalContentModel.delete(existingContent.id);
    }

    // Crear nuevo contenido con valores por defecto
    const defaultContent = await EducationalContentModel.getDefaultContent(contentType);
    
    const createData: CreateEducationalContentRequest = {
      contentType,
      userId,
      title: defaultContent.title || '',
      generalDescription: defaultContent.generalDescription || '',
      typeExplanation: defaultContent.typeExplanation || '',
    };

    return await EducationalContentModel.create(createData);
  }
}