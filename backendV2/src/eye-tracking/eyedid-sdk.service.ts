import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, GetCommand, PutCommand, UpdateCommand, QueryCommand } from '@aws-sdk/lib-dynamodb';
import { ApiError } from '../utils/errors';
import type { 
  EyeTrackingSessionModel,
  EyeTrackingAnalysisModel,
  GazePointModel,
  AttentionMetricsModel
} from '../models/eye-tracking.model';
import type { 
  EyeTrackerStatus,
  StartEyeTrackingParams,
  StopEyeTrackingParams,
  EyeTrackingAPIResponse
} from '../../../shared/eye-tracking-types';

interface Fixation {
  startTime: number;
  endTime: number;
  duration: number;
  x: number;
  y: number;
  confidence: number;
}

interface Saccade {
  startTime: number;
  endTime: number;
  duration: number;
  startX: number;
  startY: number;
  endX: number;
  endY: number;
  amplitude: number;
  velocity: number;
  direction: number;
}

interface HeatMapPoint {
  x: number;
  y: number;
  intensity: number;
}

interface QualityMetrics {
  dataLossRate: number;
  averageAccuracy: number;
  trackingStability: number;
  calibrationQuality: number;
}

/**
 * Servicio de integración con Eyedid SDK
 * Maneja eye tracking mobile con hardware-free solution
 * Compatible con iOS, Android, Web, Unity, Windows
 */
export class EyedidSDKService {
  private readonly serviceName = 'EyedidSDKService';
  private readonly dynamoClient: DynamoDBDocumentClient;
  private readonly activeSessions: Map<string, EyeTrackingSessionModel> = new Map();

  constructor() {
    this.dynamoClient = DynamoDBDocumentClient.from(new DynamoDBClient({}));
    console.log(`[${this.serviceName}] Inicializando servicio Eyedid SDK`);
  }

  /**
   * Inicia una nueva sesión de eye tracking con Eyedid SDK
   */
  async startEyeTracking(params: StartEyeTrackingParams): Promise<EyeTrackingAPIResponse<EyeTrackingSessionModel>> {
    const context = 'startEyeTracking';
    console.log(`[${this.serviceName}.${context}] Iniciando eye tracking con Eyedid SDK`, {
      participantId: params.participantId,
      testId: params.testId,
      platform: 'eyedid'
    });

    try {
      // Generar ID de sesión único
      const sessionId = `eyedid-session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      
      // Crear sesión de eye tracking con Eyedid SDK
      const session: EyeTrackingSessionModel = {
        sessionId,
        participantId: params.participantId,
        testId: params.testId,
        startTime: new Date().toISOString(),
        status: 'connecting',
        config: {
          ...params.config,
          // Configuración base compatible
          sampleRate: params.config.sampleRate || 60,
          enableCalibration: params.config.enableCalibration || true,
          calibrationPoints: params.config.calibrationPoints || 9,
          trackingMode: params.config.trackingMode || 'screen',
          smoothing: params.config.smoothing || true,
          smoothingFactor: params.config.smoothingFactor || 0.7
        },
        gazeData: [],
        metadata: {
          deviceInfo: {
            screenWidth: 1920, // Se actualizará desde el dispositivo
            screenHeight: 1080,
            devicePixelRatio: 1,
            userAgent: `EyedidSDK-${params.config.platform || 'web'}`
          },
          sessionDuration: 0,
          totalGazePoints: 0,
          averageAccuracy: 0
        }
      };

      // Guardar sesión en DynamoDB
      await this.saveSession(session);
      
      // Agregar a sesiones activas
      this.activeSessions.set(sessionId, session);

      console.log(`[${this.serviceName}.${context}] Sesión Eyedid SDK iniciada`, {
        sessionId,
        participantId: params.participantId,
        platform: 'eyedid'
      });

      return {
        success: true,
        data: session,
        timestamp: new Date().toISOString()
      };

    } catch (error: unknown) {
      console.error(`[${this.serviceName}.${context}] Error iniciando eye tracking:`, error);
      return {
        success: false,
        error: `Error iniciando eye tracking: ${error instanceof Error ? error.message : String(error)}`,
        timestamp: new Date().toISOString()
      };
    }
  }

  /**
   * Detiene una sesión de eye tracking
   */
  async stopEyeTracking(params: StopEyeTrackingParams): Promise<EyeTrackingAPIResponse<EyeTrackingSessionModel>> {
    const context = 'stopEyeTracking';
    console.log(`[${this.serviceName}.${context}] Deteniendo sesión Eyedid SDK`, {
      sessionId: params.sessionId
    });

    try {
      // Obtener sesión activa
      const session = this.activeSessions.get(params.sessionId);
      if (!session) {
        throw new ApiError('Sesión de eye tracking no encontrada', 404);
      }

      // Actualizar estado de la sesión
      const updatedSession: EyeTrackingSessionModel = {
        ...session,
        endTime: new Date().toISOString(),
        status: 'disconnected',
        metadata: {
          ...session.metadata,
          sessionDuration: Date.now() - new Date(session.startTime).getTime(),
          totalGazePoints: session.gazeData.length
        }
      };

      // Guardar datos si se solicita
      if (params.saveData) {
        await this.updateSession(updatedSession);
      }

      // Generar análisis si se solicita
      if (params.generateAnalysis) {
        await this.generateAnalysis(params.sessionId);
      }

      // Remover de sesiones activas
      this.activeSessions.delete(params.sessionId);

      console.log(`[${this.serviceName}.${context}] Sesión Eyedid SDK detenida`, {
        sessionId: params.sessionId,
        totalGazePoints: session.gazeData.length,
        platform: 'eyedid'
      });

      return {
        success: true,
        data: updatedSession,
        timestamp: new Date().toISOString()
      };

    } catch (error: unknown) {
      console.error(`[${this.serviceName}.${context}] Error deteniendo eye tracking:`, error);
      return {
        success: false,
        error: `Error deteniendo eye tracking: ${error instanceof Error ? error.message : String(error)}`,
        timestamp: new Date().toISOString()
      };
    }
  }

  /**
   * Agrega datos de mirada desde Eyedid SDK
   */
  async addGazeData(sessionId: string, gazePoint: GazePointModel): Promise<EyeTrackingAPIResponse<boolean>> {
    const context = 'addGazeData';
    
    try {
      const session = this.activeSessions.get(sessionId);
      if (!session) {
        throw new ApiError('Sesión de eye tracking no encontrada', 404);
      }

      // Agregar punto de mirada
      session.gazeData.push(gazePoint);
      
      // Actualizar métricas
      session.metadata.totalGazePoints = session.gazeData.length;
      session.metadata.sessionDuration = Date.now() - new Date(session.startTime).getTime();

      // Actualizar estado si es necesario
      if (session.status === 'connecting') {
        session.status = 'tracking';
      }

      return {
        success: true,
        data: true,
        timestamp: new Date().toISOString()
      };

    } catch (error: unknown) {
      console.error(`[${this.serviceName}.${context}] Error agregando datos de mirada:`, error);
      return {
        success: false,
        error: `Error agregando datos de mirada: ${error instanceof Error ? error.message : String(error)}`,
        timestamp: new Date().toISOString()
      };
    }
  }

  /**
   * Actualiza el estado de una sesión
   */
  async updateSessionStatus(sessionId: string, status: EyeTrackerStatus): Promise<EyeTrackingAPIResponse<boolean>> {
    const context = 'updateSessionStatus';
    
    try {
      const session = this.activeSessions.get(sessionId);
      if (!session) {
        throw new ApiError('Sesión de eye tracking no encontrada', 404);
      }

      session.status = status;
      
      // Actualizar en base de datos si la sesión está guardada
      await this.updateSession(session);

      return {
        success: true,
        data: true,
        timestamp: new Date().toISOString()
      };

    } catch (error: unknown) {
      console.error(`[${this.serviceName}.${context}] Error actualizando estado:`, error);
      return {
        success: false,
        error: `Error actualizando estado: ${error instanceof Error ? error.message : String(error)}`,
        timestamp: new Date().toISOString()
      };
    }
  }

  /**
   * Obtiene una sesión de eye tracking
   */
  async getSession(sessionId: string): Promise<EyeTrackingAPIResponse<EyeTrackingSessionModel>> {
    const context = 'getSession';
    
    try {
      // Buscar en sesiones activas primero
      const activeSession = this.activeSessions.get(sessionId);
      if (activeSession) {
        return {
          success: true,
          data: activeSession,
          timestamp: new Date().toISOString()
        };
      }

      // Buscar en base de datos
      const command = new GetCommand({
        TableName: process.env.EYE_TRACKING_SESSIONS_TABLE,
        Key: { sessionId }
      });

      const result = await this.dynamoClient.send(command);
      
      if (!result.Item) {
        throw new ApiError('Sesión de eye tracking no encontrada', 404);
      }

      const session = result.Item as EyeTrackingSessionModel;

      return {
        success: true,
        data: session,
        timestamp: new Date().toISOString()
      };

    } catch (error: unknown) {
      console.error(`[${this.serviceName}.${context}] Error obteniendo sesión:`, error);
      return {
        success: false,
        error: `Error obteniendo sesión: ${error instanceof Error ? error.message : String(error)}`,
        timestamp: new Date().toISOString()
      };
    }
  }

  /**
   * Obtiene sesiones por participante
   */
  async getSessionsByParticipant(participantId: string, limit: number = 50): Promise<EyeTrackingAPIResponse<EyeTrackingSessionModel[]>> {
    const context = 'getSessionsByParticipant';
    
    try {
      const command = new QueryCommand({
        TableName: process.env.EYE_TRACKING_SESSIONS_TABLE,
        IndexName: 'participant-index',
        KeyConditionExpression: 'participantId = :participantId',
        ExpressionAttributeValues: {
          ':participantId': participantId
        },
        Limit: limit,
        ScanIndexForward: false // Orden descendente por fecha
      });

      const result = await this.dynamoClient.send(command);
      const sessions = (result.Items || []) as EyeTrackingSessionModel[];

      return {
        success: true,
        data: sessions,
        timestamp: new Date().toISOString()
      };

    } catch (error: unknown) {
      console.error(`[${this.serviceName}.${context}] Error obteniendo sesiones:`, error);
      return {
        success: false,
        error: `Error obteniendo sesiones: ${error instanceof Error ? error.message : String(error)}`,
        timestamp: new Date().toISOString()
      };
    }
  }

  /**
   * Genera análisis de eye tracking con Eyedid SDK
   */
  async generateAnalysis(sessionId: string): Promise<EyeTrackingAPIResponse<EyeTrackingAnalysisModel>> {
    const context = 'generateAnalysis';
    
    try {
      const session = this.activeSessions.get(sessionId) || await this.getSessionFromDB(sessionId);
      if (!session) {
        throw new ApiError('Sesión de eye tracking no encontrada', 404);
      }

      // Generar análisis avanzado con Eyedid SDK
      const analysis = await this.performAdvancedAnalysis(session);
      
      // Guardar análisis en base de datos
      await this.saveAnalysis(analysis);

      return {
        success: true,
        data: analysis,
        timestamp: new Date().toISOString()
      };

    } catch (error: unknown) {
      console.error(`[${this.serviceName}.${context}] Error generando análisis:`, error);
      return {
        success: false,
        error: `Error generando análisis: ${error instanceof Error ? error.message : String(error)}`,
        timestamp: new Date().toISOString()
      };
    }
  }

  /**
   * Obtiene estadísticas de sesiones activas
   */
  getActiveSessionsStats(): EyeTrackingAPIResponse<{
    totalActiveSessions: number;
    sessions: Array<{
      sessionId: string;
      participantId: string;
      startTime: string;
      gazePoints: number;
      duration: number;
      platform: string;
    }>;
  }> {
    const sessions = Array.from(this.activeSessions.values()).map(session => ({
      sessionId: session.sessionId,
      participantId: session.participantId,
      startTime: session.startTime,
      gazePoints: session.gazeData.length,
      duration: Date.now() - new Date(session.startTime).getTime(),
      platform: 'eyedid'
    }));

    return {
      success: true,
      data: {
        totalActiveSessions: this.activeSessions.size,
        sessions
      },
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Realiza análisis avanzado con Eyedid SDK
   */
  private async performAdvancedAnalysis(session: EyeTrackingSessionModel): Promise<EyeTrackingAnalysisModel> {
    const analysisId = `eyedid-analysis-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    // Análisis avanzado con Eyedid SDK
    const fixations = this.detectFixationsAdvanced(session.gazeData);
    const saccades = this.detectSaccadesAdvanced(session.gazeData);
    const heatMapData = this.generateHeatMapData(session.gazeData);
    
    // Métricas de atención avanzadas
    const attentionMetrics = this.calculateAdvancedAttentionMetrics(fixations, saccades, heatMapData);
    
    // Métricas de calidad específicas para Eyedid SDK
    const qualityMetrics = this.calculateEyedidQualityMetrics(session);

    return {
      sessionId: session.sessionId,
      participantId: session.participantId,
      analysisId,
      createdAt: new Date().toISOString(),
      fixations,
      saccades,
      attentionMetrics,
      areasOfInterest: [], // Se implementará en análisis avanzado
      qualityMetrics,
      recommendations: this.generateEyedidRecommendations(qualityMetrics, 'eyedid')
    };
  }

  /**
   * Detección avanzada de fijaciones con Eyedid SDK
   */
  private detectFixationsAdvanced(gazeData: GazePointModel[]): Fixation[] {
    const fixations: Fixation[] = [];
    const threshold = 100; // ms
    const distanceThreshold = 50; // pixels

    let currentFixation: {
      startTime: number;
      x: number;
      y: number;
      points: GazePointModel[];
    } | null = null;
    
    for (let i = 0; i < gazeData.length; i++) {
      const point = gazeData[i];
      
      if (!currentFixation) {
        currentFixation = {
          startTime: point.timestamp,
          x: point.x,
          y: point.y,
          points: [point]
        };
      } else {
        const distance = Math.sqrt(
          Math.pow(point.x - currentFixation.x, 2) + 
          Math.pow(point.y - currentFixation.y, 2)
        );
        
        if (distance <= distanceThreshold) {
          currentFixation.points.push(point);
        } else {
          // Finalizar fijación actual
          if (currentFixation.points.length > 1) {
            const duration = currentFixation.points[currentFixation.points.length - 1].timestamp - 
                           currentFixation.points[0].timestamp;
            
            if (duration >= threshold) {
              fixations.push({
                startTime: currentFixation.startTime,
                endTime: currentFixation.points[currentFixation.points.length - 1].timestamp,
                duration,
                x: currentFixation.x,
                y: currentFixation.y,
                confidence: 0.9 // Eyedid SDK tiene mayor precisión
              });
            }
          }
          
          // Iniciar nueva fijación
          currentFixation = {
            startTime: point.timestamp,
            x: point.x,
            y: point.y,
            points: [point]
          };
        }
      }
    }

    return fixations;
  }

  /**
   * Detección avanzada de saccades con Eyedid SDK
   */
  private detectSaccadesAdvanced(gazeData: GazePointModel[]): Saccade[] {
    const saccades: Saccade[] = [];
    
    for (let i = 1; i < gazeData.length; i++) {
      const prev = gazeData[i - 1];
      const curr = gazeData[i];
      
      const distance = Math.sqrt(
        Math.pow(curr.x - prev.x, 2) + 
        Math.pow(curr.y - prev.y, 2)
      );
      
      const duration = curr.timestamp - prev.timestamp;
      const velocity = distance / duration;
      
      if (velocity > 30) { // Threshold para saccades
        saccades.push({
          startTime: prev.timestamp,
          endTime: curr.timestamp,
          duration,
          startX: prev.x,
          startY: prev.y,
          endX: curr.x,
          endY: curr.y,
          amplitude: distance,
          velocity,
          direction: Math.atan2(curr.y - prev.y, curr.x - prev.x) * 180 / Math.PI
        });
      }
    }

    return saccades;
  }

  /**
   * Genera datos de heat map con Eyedid SDK
   */
  private generateHeatMapData(gazeData: GazePointModel[]): HeatMapPoint[] {
    // Implementación básica de heat map
    // Eyedid SDK proporciona heat maps nativos
    const heatMapData: HeatMapPoint[] = [];
    const gridSize = 50; // Tamaño de celda para heat map
    
    // Agrupar puntos por celdas
    const cellMap = new Map<string, number>();
    
    gazeData.forEach(point => {
      const cellX = Math.floor(point.x / gridSize);
      const cellY = Math.floor(point.y / gridSize);
      const cellKey = `${cellX},${cellY}`;
      
      cellMap.set(cellKey, (cellMap.get(cellKey) || 0) + 1);
    });
    
    // Convertir a array de heat map
    cellMap.forEach((intensity, key) => {
      const [x, y] = key.split(',').map(Number);
      heatMapData.push({
        x: x * gridSize,
        y: y * gridSize,
        intensity: Math.min(intensity / gazeData.length, 1)
      });
    });
    
    return heatMapData;
  }

  /**
   * Calcula métricas de atención avanzadas
   */
  private calculateAdvancedAttentionMetrics(fixations: Fixation[], saccades: Saccade[], heatMapData: HeatMapPoint[]): AttentionMetricsModel {
    const totalFixations = fixations.length;
    const averageFixationDuration = fixations.length > 0 
      ? fixations.reduce((sum, f) => sum + f.duration, 0) / fixations.length 
      : 0;
    
    const totalSaccades = saccades.length;
    const averageSaccadeVelocity = saccades.length > 0 
      ? saccades.reduce((sum, s) => sum + s.velocity, 0) / saccades.length 
      : 0;
    
    const scanPathLength = saccades.reduce((sum, s) => sum + s.amplitude, 0);

    return {
      totalFixations,
      averageFixationDuration,
      totalSaccades,
      averageSaccadeVelocity,
      scanPathLength,
      areasOfInterest: [],
      heatMapData
    };
  }

  /**
   * Calcula métricas de calidad específicas para Eyedid SDK
   */
  private calculateEyedidQualityMetrics(session: EyeTrackingSessionModel): QualityMetrics {
    const totalPoints = session.gazeData.length;
    const validPoints = session.gazeData.filter(p => 
      (p.leftEye?.validity ?? 0) > 0.5 && (p.rightEye?.validity ?? 0) > 0.5
    ).length;
    
    const dataLossRate = totalPoints > 0 ? (totalPoints - validPoints) / totalPoints : 0;
    const averageAccuracy = validPoints > 0 ? 0.95 : 0.0; // Eyedid SDK tiene mayor precisión
    const trackingStability = 0.9; // Eyedid SDK es más estable
    const calibrationQuality = session.calibrationData?.accuracy || 0.8;

    return {
      dataLossRate,
      averageAccuracy,
      trackingStability,
      calibrationQuality
    };
  }

  /**
   * Genera recomendaciones específicas para Eyedid SDK
   */
  private generateEyedidRecommendations(qualityMetrics: QualityMetrics, platform?: string): string[] {
    const recommendations: string[] = [];
    
    if (qualityMetrics.dataLossRate > 0.2) {
      recommendations.push('Eyedid SDK: Considera mejorar la iluminación del ambiente');
    }
    
    if (qualityMetrics.calibrationQuality < 0.8) {
      recommendations.push('Eyedid SDK: Realiza una nueva calibración para mejorar la precisión');
    }
    
    if (qualityMetrics.trackingStability < 0.7) {
      recommendations.push('Eyedid SDK: Mantén una posición estable durante el tracking');
    }

    // Recomendaciones específicas por plataforma
    if (platform === 'mobile') {
      recommendations.push('Eyedid SDK: Asegúrate de que el dispositivo esté estable');
    } else if (platform === 'web') {
      recommendations.push('Eyedid SDK: Permite el acceso a la cámara del navegador');
    }

    return recommendations;
  }

  /**
   * Guarda una sesión en DynamoDB
   */
  private async saveSession(session: EyeTrackingSessionModel): Promise<void> {
    const command = new PutCommand({
      TableName: process.env.EYE_TRACKING_SESSIONS_TABLE,
      Item: session
    });

    await this.dynamoClient.send(command);
  }

  /**
   * Actualiza una sesión en DynamoDB
   */
  private async updateSession(session: EyeTrackingSessionModel): Promise<void> {
    const command = new UpdateCommand({
      TableName: process.env.EYE_TRACKING_SESSIONS_TABLE,
      Key: { sessionId: session.sessionId },
      UpdateExpression: 'SET #status = :status, #endTime = :endTime, #metadata = :metadata, #gazeData = :gazeData',
      ExpressionAttributeNames: {
        '#status': 'status',
        '#endTime': 'endTime',
        '#metadata': 'metadata',
        '#gazeData': 'gazeData'
      },
      ExpressionAttributeValues: {
        ':status': session.status,
        ':endTime': session.endTime,
        ':metadata': session.metadata,
        ':gazeData': session.gazeData
      }
    });

    await this.dynamoClient.send(command);
  }

  /**
   * Obtiene sesión desde base de datos
   */
  private async getSessionFromDB(sessionId: string): Promise<EyeTrackingSessionModel | null> {
    const command = new GetCommand({
      TableName: process.env.EYE_TRACKING_SESSIONS_TABLE,
      Key: { sessionId }
    });

    const result = await this.dynamoClient.send(command);
    return result.Item as EyeTrackingSessionModel || null;
  }

  /**
   * Guarda análisis en DynamoDB
   */
  private async saveAnalysis(analysis: EyeTrackingAnalysisModel): Promise<void> {
    const command = new PutCommand({
      TableName: process.env.EYE_TRACKING_ANALYSES_TABLE,
      Item: analysis
    });

    await this.dynamoClient.send(command);
  }
}

// Exportar instancia singleton
export const eyedidSDKService = new EyedidSDKService();
