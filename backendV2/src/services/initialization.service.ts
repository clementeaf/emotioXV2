import { DynamoDBSetup } from '../utils/dynamodb-setup';

/**
 * Servicio que maneja la inicialización automática de recursos AWS
 */
export class InitializationService {
  private static instance: InitializationService;
  private isInitialized = false;
  private initializationPromise: Promise<void> | null = null;

  private constructor() {}

  static getInstance(): InitializationService {
    if (!InitializationService.instance) {
      InitializationService.instance = new InitializationService();
    }
    return InitializationService.instance;
  }

  /**
   * Inicializa todos los recursos necesarios (solo una vez)
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) {
      return;
    }

    if (this.initializationPromise) {
      return this.initializationPromise;
    }

    this.initializationPromise = this.performInitialization();
    await this.initializationPromise;
  }

  private async performInitialization(): Promise<void> {
    console.log('🔧 Iniciando configuración automática de recursos...');
    
    try {
      // Configurar DynamoDB
      const dynamoSetup = new DynamoDBSetup();
      await dynamoSetup.initializeTables();
      
      this.isInitialized = true;
      console.log('✅ Inicialización completada exitosamente');
    } catch (error) {
      console.error('❌ Error durante la inicialización:', error);
      
      // Si falla la inicialización, permitir que la aplicación continúe
      // pero log el error para debugging
      console.warn('⚠️  La aplicación continuará sin configuración automática');
      console.warn('⚠️  Puede que necesites configurar DynamoDB manualmente');
      
      this.isInitialized = true; // Marcar como inicializado para evitar reintentos
    }
  }

  /**
   * Verifica si todos los recursos están disponibles
   */
  async healthCheck(): Promise<{
    dynamodb: boolean;
    overall: boolean;
  }> {
    const dynamoSetup = new DynamoDBSetup();
    const dynamodb = await dynamoSetup.testConnection();
    
    return {
      dynamodb,
      overall: dynamodb
    };
  }
}

// Instancia singleton
export const initializationService = InitializationService.getInstance();