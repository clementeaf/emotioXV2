import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, GetCommand, QueryCommand, UpdateCommand } from '@aws-sdk/lib-dynamodb';
import {
  AgeQuota,
  CountryQuota,
  DailyHoursOnlineQuota,
  DemographicQuestions,
  EducationLevelQuota,
  EmploymentStatusQuota,
  GenderQuota,
  HouseholdIncomeQuota,
  TechnicalProficiencyQuota
} from '../../../shared/interfaces/eyeTrackingRecruit.interface';
import { ApiError } from '../utils/errors';
import { structuredLog } from '../utils/logging.util';

/**
 * Interfaz para los datos demográficos de un participante
 */
export interface ParticipantDemographics {
  age?: string;
  country?: string;
  gender?: string;
  educationLevel?: string;
  householdIncome?: string;
  employmentStatus?: string;
  dailyHoursOnline?: string;
  technicalProficiency?: string;
}

/**
 * Resultado de validación de cuotas (SOLO PARA ANÁLISIS)
 */
export interface QuotaValidationResult {
  isValid: boolean;
  reason?: string;
  quotaInfo?: {
    demographicType: string;
    value: string;
    currentCount: number;
    maxQuota: number;
  };
}

/**
 * Contador de cuotas para análisis
 */
export interface QuotaCounter {
  id: string;
  researchId: string;
  demographicType: string;
  demographicValue: string;
  currentCount: number;
  maxQuota: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

/**
 * Servicio para análisis de cuotas (NO LIMITA ENVÍO DE DATOS)
 */
export class QuotaValidationService {
  private readonly tableName: string;
  private readonly docClient: DynamoDBDocumentClient;
  private readonly modelName = 'QuotaValidationService';

  constructor() {
    this.tableName = process.env.DYNAMODB_TABLE || 'emotioXV2-table';
    const client = new DynamoDBClient({});
    this.docClient = DynamoDBDocumentClient.from(client);
  }

  /**
   * Convierte una cuota de porcentaje a número absoluto
   * @param quota - Valor de la cuota
   * @param quotaType - Tipo de cuota ('absolute' | 'percentage')
   * @param totalParticipants - Total de participantes esperados
   * @returns Número absoluto de participantes
   */
  private calculateAbsoluteQuota(
    quota: number,
    quotaType: 'absolute' | 'percentage',
    totalParticipants: number
  ): number {
    if (quotaType === 'percentage') {
      // Convertir porcentaje a número absoluto
      return Math.ceil((quota / 100) * totalParticipants);
    }
    return quota;
  }

  /**
   * Analiza cuotas para investigación (SOLO ANÁLISIS, NO LIMITA)
   */
  async analyzeParticipantQuotas(
    researchId: string,
    demographics: ParticipantDemographics
  ): Promise<QuotaValidationResult> {
    const context = 'analyzeParticipantQuotas';

    try {
      // Obtener configuración de eye tracking
      const config = await this.getEyeTrackingConfig(researchId);
      if (!config) {
        structuredLog('warn', `${this.modelName}.${context}`, 'No eye tracking config found for researchId', { researchId });
        return { isValid: true }; // Sin configuración, permitir acceso
      }

      const demographicQuestions = config.demographicQuestions as DemographicQuestions;

      // Obtener el total de participantes esperados para calcular porcentajes
      const linkConfig = config.linkConfig as Record<string, unknown> | undefined;
      const participantLimit = linkConfig?.participantLimit as { enabled?: boolean; value?: number } | undefined;
      const totalParticipants = participantLimit?.enabled ? (participantLimit.value || 100) : 100;

      structuredLog('debug', `${this.modelName}.${context}`, 'Analyzing quotas with participant limit', {
        researchId,
        totalParticipants,
        participantLimitEnabled: participantLimit?.enabled
      });

      // Analizar cada criterio demográfico (SOLO PARA ANÁLISIS)
      const validations = await Promise.all([
        this.analyzeAgeQuota(researchId, demographics.age, demographicQuestions.age, totalParticipants),
        this.analyzeCountryQuota(researchId, demographics.country, demographicQuestions.country, totalParticipants),
        this.analyzeGenderQuota(researchId, demographics.gender, demographicQuestions.gender, totalParticipants),
        this.analyzeEducationLevelQuota(researchId, demographics.educationLevel, demographicQuestions.educationLevel, totalParticipants),
        this.analyzeHouseholdIncomeQuota(researchId, demographics.householdIncome, demographicQuestions.householdIncome, totalParticipants),
        this.analyzeEmploymentStatusQuota(researchId, demographics.employmentStatus, demographicQuestions.employmentStatus, totalParticipants),
        this.analyzeDailyHoursOnlineQuota(researchId, demographics.dailyHoursOnline, demographicQuestions.dailyHoursOnline, totalParticipants),
        this.analyzeTechnicalProficiencyQuota(researchId, demographics.technicalProficiency, demographicQuestions.technicalProficiency, totalParticipants)
      ]);

      // Si alguna validación falla, retornar el primer error (SOLO PARA ANÁLISIS)
      for (const validation of validations) {
        if (!validation.isValid) {
          return validation;
        }
      }

      // Si todas las validaciones pasan, incrementar contadores (SOLO PARA ANÁLISIS)
      await this.incrementQuotaCounters(researchId, demographics, demographicQuestions);

      return { isValid: true };

    } catch (error) {
      structuredLog('error', `${this.modelName}.${context}`, 'Error analyzing participant quotas', { error, researchId });
      throw new ApiError('Error analyzing participant quotas', 500);
    }
  }

  /**
   * Analiza cuota de edad (SOLO PARA ANÁLISIS)
   */
  private async analyzeAgeQuota(
    researchId: string,
    age?: string,
    ageConfig?: Record<string, unknown>,
    totalParticipants: number = 100
  ): Promise<QuotaValidationResult> {
    if (!age || !ageConfig?.quotasEnabled || !ageConfig?.quotas) {
      return { isValid: true };
    }

    const quota = (ageConfig as { quotas?: AgeQuota[] })?.quotas?.find((q: AgeQuota) =>
      q.ageRange === age && q.isActive
    );

    if (!quota) {
      return { isValid: true }; // Sin cuota configurada para esta edad
    }

    // Calcular cuota absoluta (convierte porcentajes a números)
    const absoluteQuota = this.calculateAbsoluteQuota(
      quota.quota,
      quota.quotaType || 'absolute',
      totalParticipants
    );

    const counter = await this.getQuotaCounter(researchId, 'age', age);

    if (counter && counter.currentCount >= absoluteQuota) {
      return {
        isValid: false,
        reason: `Cuota de edad alcanzada para el rango ${age} (${quota.quotaType === 'percentage' ? `${quota.quota}%` : quota.quota} = ${absoluteQuota} participantes)`,
        quotaInfo: {
          demographicType: 'age',
          value: age,
          currentCount: counter.currentCount,
          maxQuota: absoluteQuota
        }
      };
    }

    return { isValid: true };
  }

  /**
   * Analiza cuota de país (SOLO PARA ANÁLISIS)
   * Las cuotas solo se aplican a países prioritarios
   */
  private async analyzeCountryQuota(
    researchId: string,
    country?: string,
    countryConfig?: Record<string, unknown>,
    totalParticipants: number = 100
  ): Promise<QuotaValidationResult> {
    if (!country || !countryConfig?.quotasEnabled || !countryConfig?.quotas) {
      return { isValid: true };
    }

    // 🎯 NUEVO: Verificar si el país está en la lista de prioritarios
    const priorityCountries = (countryConfig as { quotas?: CountryQuota[]; priorityCountries?: string[] })?.priorityCountries || [];
    const isPriorityCountry = priorityCountries.includes(country);

    // Si NO es un país prioritario, permitir entrada por "caída natural"
    if (!isPriorityCountry) {
      return { isValid: true };
    }

    // Solo para países prioritarios: validar cuota
    const quota = (countryConfig as { quotas?: CountryQuota[]; priorityCountries?: string[] })?.quotas?.find((q: CountryQuota) =>
      q.country === country && q.isActive
    );

    if (!quota) {
      return { isValid: true };
    }

    // Calcular cuota absoluta (convierte porcentajes a números)
    const absoluteQuota = this.calculateAbsoluteQuota(
      quota.quota,
      quota.quotaType || 'absolute',
      totalParticipants
    );

    const counter = await this.getQuotaCounter(researchId, 'country', country);

    if (counter && counter.currentCount >= absoluteQuota) {
      return {
        isValid: false,
        reason: `Cuota de país prioritario alcanzada para ${country} (${quota.quotaType === 'percentage' ? `${quota.quota}%` : quota.quota} = ${absoluteQuota} participantes)`,
        quotaInfo: {
          demographicType: 'country',
          value: country,
          currentCount: counter.currentCount,
          maxQuota: absoluteQuota
        }
      };
    }

    return { isValid: true };
  }

  /**
   * Analiza cuota de género (SOLO PARA ANÁLISIS)
   */
  private async analyzeGenderQuota(
    researchId: string,
    gender?: string,
    genderConfig?: Record<string, unknown>,
    totalParticipants: number = 100
  ): Promise<QuotaValidationResult> {
    if (!gender || !genderConfig?.quotasEnabled || !genderConfig?.quotas) {
      return { isValid: true };
    }

    const quota = (genderConfig as { quotas?: GenderQuota[] })?.quotas?.find((q: GenderQuota) =>
      q.gender === gender && q.isActive
    );

    if (!quota) {
      return { isValid: true };
    }

    // Calcular cuota absoluta (convierte porcentajes a números)
    const absoluteQuota = this.calculateAbsoluteQuota(
      quota.quota,
      quota.quotaType || 'absolute',
      totalParticipants
    );

    const counter = await this.getQuotaCounter(researchId, 'gender', gender);

    if (counter && counter.currentCount >= absoluteQuota) {
      return {
        isValid: false,
        reason: `Cuota de género alcanzada para ${gender} (${quota.quotaType === 'percentage' ? `${quota.quota}%` : quota.quota} = ${absoluteQuota} participantes)`,
        quotaInfo: {
          demographicType: 'gender',
          value: gender,
          currentCount: counter.currentCount,
          maxQuota: absoluteQuota
        }
      };
    }

    return { isValid: true };
  }

  /**
   * Analiza cuota de nivel de educación (SOLO PARA ANÁLISIS)
   */
  private async analyzeEducationLevelQuota(
    researchId: string,
    educationLevel?: string,
    educationConfig?: Record<string, unknown>,
    totalParticipants: number = 100
  ): Promise<QuotaValidationResult> {
    if (!educationLevel || !educationConfig?.quotasEnabled || !educationConfig?.quotas) {
      return { isValid: true };
    }

    const quota = (educationConfig as { quotas?: EducationLevelQuota[] })?.quotas?.find((q: EducationLevelQuota) =>
      q.educationLevel === educationLevel && q.isActive
    );

    if (!quota) {
      return { isValid: true };
    }

    // Calcular cuota absoluta (convierte porcentajes a números)
    const absoluteQuota = this.calculateAbsoluteQuota(
      quota.quota,
      quota.quotaType || 'absolute',
      totalParticipants
    );

    const counter = await this.getQuotaCounter(researchId, 'educationLevel', educationLevel);

    if (counter && counter.currentCount >= absoluteQuota) {
      return {
        isValid: false,
        reason: `Cuota de nivel educativo alcanzada para ${educationLevel} (${quota.quotaType === 'percentage' ? `${quota.quota}%` : quota.quota} = ${absoluteQuota} participantes)`,
        quotaInfo: {
          demographicType: 'educationLevel',
          value: educationLevel,
          currentCount: counter.currentCount,
          maxQuota: absoluteQuota
        }
      };
    }

    return { isValid: true };
  }

  /**
   * Analiza cuota de ingresos familiares (SOLO PARA ANÁLISIS)
   */
  private async analyzeHouseholdIncomeQuota(
    researchId: string,
    householdIncome?: string,
    incomeConfig?: Record<string, unknown>,
    totalParticipants: number = 100
  ): Promise<QuotaValidationResult> {
    if (!householdIncome || !incomeConfig?.quotasEnabled || !incomeConfig?.quotas) {
      return { isValid: true };
    }

    const quota = (incomeConfig as { quotas?: HouseholdIncomeQuota[] })?.quotas?.find((q: HouseholdIncomeQuota) =>
      q.incomeLevel === householdIncome && q.isActive
    );

    if (!quota) {
      return { isValid: true };
    }

    // Calcular cuota absoluta (convierte porcentajes a números)
    const absoluteQuota = this.calculateAbsoluteQuota(
      quota.quota,
      quota.quotaType || 'absolute',
      totalParticipants
    );

    const counter = await this.getQuotaCounter(researchId, 'householdIncome', householdIncome);

    if (counter && counter.currentCount >= absoluteQuota) {
      return {
        isValid: false,
        reason: `Cuota de ingresos familiares alcanzada para ${householdIncome} (${quota.quotaType === 'percentage' ? `${quota.quota}%` : quota.quota} = ${absoluteQuota} participantes)`,
        quotaInfo: {
          demographicType: 'householdIncome',
          value: householdIncome,
          currentCount: counter.currentCount,
          maxQuota: absoluteQuota
        }
      };
    }

    return { isValid: true };
  }

  /**
   * Analiza cuota de situación laboral (SOLO PARA ANÁLISIS)
   */
  private async analyzeEmploymentStatusQuota(
    researchId: string,
    employmentStatus?: string,
    employmentConfig?: Record<string, unknown>,
    totalParticipants: number = 100
  ): Promise<QuotaValidationResult> {
    if (!employmentStatus || !employmentConfig?.quotasEnabled || !employmentConfig?.quotas) {
      return { isValid: true };
    }

    const quota = (employmentConfig as { quotas?: EmploymentStatusQuota[] })?.quotas?.find((q: EmploymentStatusQuota) =>
      q.employmentStatus === employmentStatus && q.isActive
    );

    if (!quota) {
      return { isValid: true };
    }

    // Calcular cuota absoluta (convierte porcentajes a números)
    const absoluteQuota = this.calculateAbsoluteQuota(
      quota.quota,
      quota.quotaType || 'absolute',
      totalParticipants
    );

    const counter = await this.getQuotaCounter(researchId, 'employmentStatus', employmentStatus);

    if (counter && counter.currentCount >= absoluteQuota) {
      return {
        isValid: false,
        reason: `Cuota de situación laboral alcanzada para ${employmentStatus} (${quota.quotaType === 'percentage' ? `${quota.quota}%` : quota.quota} = ${absoluteQuota} participantes)`,
        quotaInfo: {
          demographicType: 'employmentStatus',
          value: employmentStatus,
          currentCount: counter.currentCount,
          maxQuota: absoluteQuota
        }
      };
    }

    return { isValid: true };
  }

  /**
   * Analiza cuota de horas diarias en línea (SOLO PARA ANÁLISIS)
   */
  private async analyzeDailyHoursOnlineQuota(
    researchId: string,
    dailyHoursOnline?: string,
    hoursConfig?: Record<string, unknown>,
    totalParticipants: number = 100
  ): Promise<QuotaValidationResult> {
    if (!dailyHoursOnline || !hoursConfig?.quotasEnabled || !hoursConfig?.quotas) {
      return { isValid: true };
    }

    const quota = (hoursConfig as { quotas?: DailyHoursOnlineQuota[] })?.quotas?.find((q: DailyHoursOnlineQuota) =>
      q.hoursRange === dailyHoursOnline && q.isActive
    );

    if (!quota) {
      return { isValid: true };
    }

    // Calcular cuota absoluta (convierte porcentajes a números)
    const absoluteQuota = this.calculateAbsoluteQuota(
      quota.quota,
      quota.quotaType || 'absolute',
      totalParticipants
    );

    const counter = await this.getQuotaCounter(researchId, 'dailyHoursOnline', dailyHoursOnline);

    if (counter && counter.currentCount >= absoluteQuota) {
      return {
        isValid: false,
        reason: `Cuota de horas diarias en línea alcanzada para ${dailyHoursOnline} (${quota.quotaType === 'percentage' ? `${quota.quota}%` : quota.quota} = ${absoluteQuota} participantes)`,
        quotaInfo: {
          demographicType: 'dailyHoursOnline',
          value: dailyHoursOnline,
          currentCount: counter.currentCount,
          maxQuota: absoluteQuota
        }
      };
    }

    return { isValid: true };
  }

  /**
   * Analiza cuota de competencia técnica (SOLO PARA ANÁLISIS)
   */
  private async analyzeTechnicalProficiencyQuota(
    researchId: string,
    technicalProficiency?: string,
    proficiencyConfig?: Record<string, unknown>,
    totalParticipants: number = 100
  ): Promise<QuotaValidationResult> {
    if (!technicalProficiency || !proficiencyConfig?.quotasEnabled || !proficiencyConfig?.quotas) {
      return { isValid: true };
    }

    const quota = (proficiencyConfig as { quotas?: TechnicalProficiencyQuota[] })?.quotas?.find((q: TechnicalProficiencyQuota) =>
      q.proficiencyLevel === technicalProficiency && q.isActive
    );

    if (!quota) {
      return { isValid: true };
    }

    // Calcular cuota absoluta (convierte porcentajes a números)
    const absoluteQuota = this.calculateAbsoluteQuota(
      quota.quota,
      quota.quotaType || 'absolute',
      totalParticipants
    );

    const counter = await this.getQuotaCounter(researchId, 'technicalProficiency', technicalProficiency);

    if (counter && counter.currentCount >= absoluteQuota) {
      return {
        isValid: false,
        reason: `Cuota de competencia técnica alcanzada para ${technicalProficiency} (${quota.quotaType === 'percentage' ? `${quota.quota}%` : quota.quota} = ${absoluteQuota} participantes)`,
        quotaInfo: {
          demographicType: 'technicalProficiency',
          value: technicalProficiency,
          currentCount: counter.currentCount,
          maxQuota: absoluteQuota
        }
      };
    }

    return { isValid: true };
  }

  /**
   * Incrementa contadores de cuotas (SOLO PARA ANÁLISIS)
   */
  private async incrementQuotaCounters(
    researchId: string,
    demographics: ParticipantDemographics,
    demographicQuestions: DemographicQuestions
  ): Promise<void> {
    const incrementPromises: Promise<void>[] = [];

    // Incrementar contador de edad
    if (demographics.age && demographicQuestions.age?.quotasEnabled) {
      incrementPromises.push(this.incrementQuotaCounter(researchId, 'age', demographics.age));
    }

    // Incrementar contador de país
    if (demographics.country && demographicQuestions.country?.quotasEnabled) {
      incrementPromises.push(this.incrementQuotaCounter(researchId, 'country', demographics.country));
    }

    // Incrementar contador de género
    if (demographics.gender && demographicQuestions.gender?.quotasEnabled) {
      incrementPromises.push(this.incrementQuotaCounter(researchId, 'gender', demographics.gender));
    }

    // Incrementar contador de nivel educativo
    if (demographics.educationLevel && demographicQuestions.educationLevel?.quotasEnabled) {
      incrementPromises.push(this.incrementQuotaCounter(researchId, 'educationLevel', demographics.educationLevel));
    }

    // Incrementar contador de ingresos familiares
    if (demographics.householdIncome && demographicQuestions.householdIncome?.quotasEnabled) {
      incrementPromises.push(this.incrementQuotaCounter(researchId, 'householdIncome', demographics.householdIncome));
    }

    // Incrementar contador de situación laboral
    if (demographics.employmentStatus && demographicQuestions.employmentStatus?.quotasEnabled) {
      incrementPromises.push(this.incrementQuotaCounter(researchId, 'employmentStatus', demographics.employmentStatus));
    }

    // Incrementar contador de horas diarias en línea
    if (demographics.dailyHoursOnline && demographicQuestions.dailyHoursOnline?.quotasEnabled) {
      incrementPromises.push(this.incrementQuotaCounter(researchId, 'dailyHoursOnline', demographics.dailyHoursOnline));
    }

    // Incrementar contador de competencia técnica
    if (demographics.technicalProficiency && demographicQuestions.technicalProficiency?.quotasEnabled) {
      incrementPromises.push(this.incrementQuotaCounter(researchId, 'technicalProficiency', demographics.technicalProficiency));
    }

    await Promise.all(incrementPromises);
  }

  /**
   * Obtiene contador de cuota
   */
  private async getQuotaCounter(
    researchId: string,
    demographicType: string,
    demographicValue: string
  ): Promise<QuotaCounter | null> {
    try {
      const counterId = `${researchId}-${demographicType}-${demographicValue}`;

      const command = new GetCommand({
        TableName: this.tableName,
        Key: {
          id: counterId,
          sk: 'QUOTA_COUNTER'
        }
      });

      const response = await this.docClient.send(command);

      if (!response.Item) {
        return null;
      }

      return {
        id: response.Item.id,
        researchId: response.Item.researchId,
        demographicType: response.Item.demographicType,
        demographicValue: response.Item.demographicValue,
        currentCount: response.Item.currentCount,
        maxQuota: response.Item.maxQuota,
        isActive: response.Item.isActive,
        createdAt: response.Item.createdAt,
        updatedAt: response.Item.updatedAt
      };
    } catch (error) {
      structuredLog('error', `${this.modelName}.getQuotaCounter`, 'Error getting quota counter', { error });
      return null;
    }
  }

  /**
   * Incrementa contador de cuota
   */
  private async incrementQuotaCounter(
    researchId: string,
    demographicType: string,
    demographicValue: string
  ): Promise<void> {
    try {
      const counterId = `${researchId}-${demographicType}-${demographicValue}`;
      const now = new Date().toISOString();

      const command = new UpdateCommand({
        TableName: this.tableName,
        Key: {
          id: counterId,
          sk: 'QUOTA_COUNTER'
        },
        UpdateExpression: 'SET currentCount = if_not_exists(currentCount, :zero) + :inc, updatedAt = :now',
        ExpressionAttributeValues: {
          ':inc': 1,
          ':zero': 0,
          ':now': now
        },
        ConditionExpression: 'attribute_exists(id) OR (attribute_not_exists(id) AND currentCount = :zero)'
      });

      await this.docClient.send(command);
    } catch (error) {
      structuredLog('error', `${this.modelName}.incrementQuotaCounter`, 'Error incrementing quota counter', { error });
    }
  }

  /**
   * Obtiene configuración de eye tracking
   */
  private async getEyeTrackingConfig(researchId: string): Promise<Record<string, unknown> | null> {
    try {
      const command = new QueryCommand({
        TableName: this.tableName,
        IndexName: 'ResearchIdIndex',
        KeyConditionExpression: 'researchId = :researchId',
        FilterExpression: 'sk = :sk',
        ExpressionAttributeValues: {
          ':researchId': researchId,
          ':sk': 'EYE_TRACKING_CONFIG'
        }
      });

      const response = await this.docClient.send(command);

      if (!response.Items || response.Items.length === 0) {
        return null;
      }

      const config = response.Items[0];
      return {
        ...config,
        demographicQuestions: JSON.parse(config.demographicQuestions || '{}')
      };
    } catch (error) {
      structuredLog('error', `${this.modelName}.getEyeTrackingConfig`, 'Error getting eye tracking config', { error });
      return null;
    }
  }

  /**
   * Obtiene estadísticas de cuotas para análisis
   */
  async getQuotaStats(researchId: string): Promise<QuotaCounter[]> {
    try {
      const command = new QueryCommand({
        TableName: this.tableName,
        IndexName: 'ResearchIdIndex',
        KeyConditionExpression: 'researchId = :researchId',
        FilterExpression: 'sk = :sk',
        ExpressionAttributeValues: {
          ':researchId': researchId,
          ':sk': 'QUOTA_COUNTER'
        }
      });

      const response = await this.docClient.send(command);

      if (!response.Items) {
        return [];
      }

      return response.Items.map(item => ({
        id: item.id,
        researchId: item.researchId,
        demographicType: item.demographicType,
        demographicValue: item.demographicValue,
        currentCount: item.currentCount,
        maxQuota: item.maxQuota,
        isActive: item.isActive,
        createdAt: item.createdAt,
        updatedAt: item.updatedAt
      }));
    } catch (error) {
      structuredLog('error', `${this.modelName}.getQuotaStats`, 'Error getting quota stats', { error });
      return [];
    }
  }
}
