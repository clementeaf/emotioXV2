// Importamos sólo lo esencial y nuestra configuración centralizada
import { v4 as uuidv4 } from 'uuid';
import { dynamoDbDocClient } from '../config/aws';
import { 
  PutCommand, 
  GetCommand,
  QueryCommand, 
  UpdateCommand, 
  DeleteCommand
} from "@aws-sdk/lib-dynamodb";
import {
  ResearchConfig,
  ResearchRecord,
  ResearchStatus,
  ResearchStage,
  ResearchFormData,
  ResearchUpdate,
  DEFAULT_RESEARCH_CONFIG
} from '../../../shared/interfaces/research.interface';
import { ResearchType } from '../../../shared/interfaces/research.interface';
import { researchModel, Research } from '../models/research.model';
import { formModel } from '../models/form.model';

export interface ResearchCreateData {
  userId: string;
  name: string;
  type: string;
  technique: string;
  description: string;
  enterprise: string;
  targetParticipants?: number;
}

export interface ResearchUpdateData {
  name?: string;
  description?: string;
  enterprise?: string;
  targetParticipants?: number;
}

export class ResearchService {
  private readonly tableName: string;

  constructor() {
    this.tableName = process.env.RESEARCH_TABLE_NAME || 'Research';
    console.log('ResearchService inicializado con tabla:', this.tableName);
  }

  /**
   * Crea una nueva investigación
   */
  async createResearch(data: ResearchCreateData): Promise<Research> {
    return researchModel.create(data as any);
  }

  /**
   * Obtiene una investigación por su ID
   */
  async getResearchById(id: string): Promise<Research | null> {
    return researchModel.findById(id);
  }

  /**
   * Obtiene todas las investigaciones de un usuario
   */
  async getResearchByUserId(userId: string): Promise<Research[]> {
    return researchModel.findByUserId(userId);
  }

  /**
   * Actualiza una investigación
   */
  async updateResearch(id: string, data: ResearchUpdateData): Promise<Research> {
    return researchModel.update(id, data);
  }

  /**
   * Actualiza el estado de una investigación
   */
  async updateResearchStatus(id: string, status: ResearchStatus): Promise<Research> {
    // Convertir el tipo de status si es necesario
    const modelStatus = status as unknown as import('../models/research.model').ResearchStatus;
    return researchModel.updateStatus(id, modelStatus);
  }

  /**
   * Actualiza el progreso de una investigación
   */
  async updateResearchProgress(id: string, progress: number): Promise<Research> {
    return researchModel.updateProgress(id, progress);
  }

  /**
   * Elimina una investigación y todos sus formularios asociados
   */
  async deleteResearch(id: string): Promise<void> {
    // Primero eliminar todos los formularios asociados
    await formModel.deleteByResearchId(id);
    
    // Luego eliminar la investigación
    await researchModel.delete(id);
  }

  /**
   * Verifica si un usuario es propietario de una investigación
   */
  async isResearchOwner(userId: string, researchId: string): Promise<boolean> {
    const research = await researchModel.findById(researchId);
    return research !== null && research.userId === userId;
  }
}

// Singleton para reutilizar en toda la aplicación
export const researchService = new ResearchService(); 