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
 * Interfaz para el resultado de validación de cuotas
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
 * Interfaz para el contador de cuotas
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
 * Servicio para validación y manejo de cuotas demográficas
 */
export class QuotaValidationService {
  private readonly tableName: string;
  private readonly docClient: DynamoDBDocumentClient;
  private readonly modelName = 'QuotaValidationService';

  constructor() {
    const context = 'constructor';
    this.tableName = process.env.DYNAMODB_TABLE!;
    if (!this.tableName) {
      structuredLog('error', `${this.modelName}.${context}`, 'FATAL ERROR: DYNAMODB_TABLE environment variable is not set.');
      throw new Error('Table name environment variable is missing.');
    }
    const region: string = process.env.APP_REGION || 'us-east-1';
    const client = new DynamoDBClient({ region });
    this.docClient = DynamoDBDocumentClient.from(client);
    structuredLog('info', `${this.modelName}.${context}`, `Initialized for table: ${this.tableName} in region: ${region}`);
  }

  /**
   * Valida si un participante puede ser aceptado basado en las cuotas configuradas
   */
  async validateParticipantQuotas(
    researchId: string,
    demographics: ParticipantDemographics
  ): Promise<QuotaValidationResult> {
    const context = 'validateParticipantQuotas';

    try {
      // Obtener configuración de eye tracking
      const config = await this.getEyeTrackingConfig(researchId);
      if (!config) {
        structuredLog('warn', `${this.modelName}.${context}`, 'No eye tracking config found for researchId', { researchId });
        return { isValid: true }; // Sin configuración, permitir acceso
      }

      const demographicQuestions = config.demographicQuestions;

      // Validar cada criterio demográfico
      const validations = await Promise.all([
        this.validateAgeQuota(researchId, demographics.age, demographicQuestions.age),
        this.validateCountryQuota(researchId, demographics.country, demographicQuestions.country),
        this.validateGenderQuota(researchId, demographics.gender, demographicQuestions.gender),
        this.validateEducationLevelQuota(researchId, demographics.educationLevel, demographicQuestions.educationLevel),
        this.validateHouseholdIncomeQuota(researchId, demographics.householdIncome, demographicQuestions.householdIncome),
        this.validateEmploymentStatusQuota(researchId, demographics.employmentStatus, demographicQuestions.employmentStatus),
        this.validateDailyHoursOnlineQuota(researchId, demographics.dailyHoursOnline, demographicQuestions.dailyHoursOnline),
        this.validateTechnicalProficiencyQuota(researchId, demographics.technicalProficiency, demographicQuestions.technicalProficiency)
      ]);

      // Si alguna validación falla, retornar el primer error
      for (const validation of validations) {
        if (!validation.isValid) {
          return validation;
        }
      }

      // Si todas las validaciones pasan, incrementar contadores
      await this.incrementQuotaCounters(researchId, demographics, demographicQuestions);

      return { isValid: true };

    } catch (error) {
      structuredLog('error', `${this.modelName}.${context}`, 'Error validating participant quotas', { error, researchId });
      throw new ApiError('Error validating participant quotas', 500);
    }
  }

  /**
   * Valida cuota de edad
   */
  private async validateAgeQuota(
    researchId: string,
    age?: string,
    ageConfig?: any
  ): Promise<QuotaValidationResult> {
    if (!age || !ageConfig?.quotasEnabled || !ageConfig?.quotas) {
      return { isValid: true };
    }

    const quota = ageConfig.quotas.find((q: AgeQuota) =>
      q.ageRange === age && q.isActive
    );

    if (!quota) {
      return { isValid: true }; // Sin cuota configurada para esta edad
    }

    const counter = await this.getQuotaCounter(researchId, 'age', age);

    if (counter && counter.currentCount >= quota.quota) {
      return {
        isValid: false,
        reason: `Cuota de edad alcanzada para el rango ${age}`,
        quotaInfo: {
          demographicType: 'age',
          value: age,
          currentCount: counter.currentCount,
          maxQuota: quota.quota
        }
      };
    }

    return { isValid: true };
  }

  /**
   * Valida cuota de país
   */
  private async validateCountryQuota(
    researchId: string,
    country?: string,
    countryConfig?: any
  ): Promise<QuotaValidationResult> {
    if (!country || !countryConfig?.quotasEnabled || !countryConfig?.quotas) {
      return { isValid: true };
    }

    const quota = countryConfig.quotas.find((q: CountryQuota) =>
      q.country === country && q.isActive
    );

    if (!quota) {
      return { isValid: true };
    }

    const counter = await this.getQuotaCounter(researchId, 'country', country);

    if (counter && counter.currentCount >= quota.quota) {
      return {
        isValid: false,
        reason: `Cuota de país alcanzada para ${country}`,
        quotaInfo: {
          demographicType: 'country',
          value: country,
          currentCount: counter.currentCount,
          maxQuota: quota.quota
        }
      };
    }

    return { isValid: true };
  }

  /**
   * Valida cuota de género
   */
  private async validateGenderQuota(
    researchId: string,
    gender?: string,
    genderConfig?: any
  ): Promise<QuotaValidationResult> {
    if (!gender || !genderConfig?.quotasEnabled || !genderConfig?.quotas) {
      return { isValid: true };
    }

    const quota = genderConfig.quotas.find((q: GenderQuota) =>
      q.gender === gender && q.isActive
    );

    if (!quota) {
      return { isValid: true };
    }

    const counter = await this.getQuotaCounter(researchId, 'gender', gender);

    if (counter && counter.currentCount >= quota.quota) {
      return {
        isValid: false,
        reason: `Cuota de género alcanzada para ${gender}`,
        quotaInfo: {
          demographicType: 'gender',
          value: gender,
          currentCount: counter.currentCount,
          maxQuota: quota.quota
        }
      };
    }

    return { isValid: true };
  }

  /**
   * Valida cuota de nivel de educación
   */
  private async validateEducationLevelQuota(
    researchId: string,
    educationLevel?: string,
    educationConfig?: any
  ): Promise<QuotaValidationResult> {
    if (!educationLevel || !educationConfig?.quotasEnabled || !educationConfig?.quotas) {
      return { isValid: true };
    }

    const quota = educationConfig.quotas.find((q: EducationLevelQuota) =>
      q.educationLevel === educationLevel && q.isActive
    );

    if (!quota) {
      return { isValid: true };
    }

    const counter = await this.getQuotaCounter(researchId, 'educationLevel', educationLevel);

    if (counter && counter.currentCount >= quota.quota) {
      return {
        isValid: false,
        reason: `Cuota de nivel educativo alcanzada para ${educationLevel}`,
        quotaInfo: {
          demographicType: 'educationLevel',
          value: educationLevel,
          currentCount: counter.currentCount,
          maxQuota: quota.quota
        }
      };
    }

    return { isValid: true };
  }

  /**
   * Valida cuota de ingresos familiares
   */
  private async validateHouseholdIncomeQuota(
    researchId: string,
    householdIncome?: string,
    incomeConfig?: any
  ): Promise<QuotaValidationResult> {
    if (!householdIncome || !incomeConfig?.quotasEnabled || !incomeConfig?.quotas) {
      return { isValid: true };
    }

    const quota = incomeConfig.quotas.find((q: HouseholdIncomeQuota) =>
      q.incomeLevel === householdIncome && q.isActive
    );

    if (!quota) {
      return { isValid: true };
    }

    const counter = await this.getQuotaCounter(researchId, 'householdIncome', householdIncome);

    if (counter && counter.currentCount >= quota.quota) {
      return {
        isValid: false,
        reason: `Cuota de ingresos familiares alcanzada para ${householdIncome}`,
        quotaInfo: {
          demographicType: 'householdIncome',
          value: householdIncome,
          currentCount: counter.currentCount,
          maxQuota: quota.quota
        }
      };
    }

    return { isValid: true };
  }

  /**
   * Valida cuota de situación laboral
   */
  private async validateEmploymentStatusQuota(
    researchId: string,
    employmentStatus?: string,
    employmentConfig?: any
  ): Promise<QuotaValidationResult> {
    if (!employmentStatus || !employmentConfig?.quotasEnabled || !employmentConfig?.quotas) {
      return { isValid: true };
    }

    const quota = employmentConfig.quotas.find((q: EmploymentStatusQuota) =>
      q.employmentStatus === employmentStatus && q.isActive
    );

    if (!quota) {
      return { isValid: true };
    }

    const counter = await this.getQuotaCounter(researchId, 'employmentStatus', employmentStatus);

    if (counter && counter.currentCount >= quota.quota) {
      return {
        isValid: false,
        reason: `Cuota de situación laboral alcanzada para ${employmentStatus}`,
        quotaInfo: {
          demographicType: 'employmentStatus',
          value: employmentStatus,
          currentCount: counter.currentCount,
          maxQuota: quota.quota
        }
      };
    }

    return { isValid: true };
  }

  /**
   * Valida cuota de horas diarias en línea
   */
  private async validateDailyHoursOnlineQuota(
    researchId: string,
    dailyHoursOnline?: string,
    hoursConfig?: any
  ): Promise<QuotaValidationResult> {
    if (!dailyHoursOnline || !hoursConfig?.quotasEnabled || !hoursConfig?.quotas) {
      return { isValid: true };
    }

    const quota = hoursConfig.quotas.find((q: DailyHoursOnlineQuota) =>
      q.hoursRange === dailyHoursOnline && q.isActive
    );

    if (!quota) {
      return { isValid: true };
    }

    const counter = await this.getQuotaCounter(researchId, 'dailyHoursOnline', dailyHoursOnline);

    if (counter && counter.currentCount >= quota.quota) {
      return {
        isValid: false,
        reason: `Cuota de horas diarias en línea alcanzada para ${dailyHoursOnline}`,
        quotaInfo: {
          demographicType: 'dailyHoursOnline',
          value: dailyHoursOnline,
          currentCount: counter.currentCount,
          maxQuota: quota.quota
        }
      };
    }

    return { isValid: true };
  }

  /**
   * Valida cuota de competencia técnica
   */
  private async validateTechnicalProficiencyQuota(
    researchId: string,
    technicalProficiency?: string,
    proficiencyConfig?: any
  ): Promise<QuotaValidationResult> {
    if (!technicalProficiency || !proficiencyConfig?.quotasEnabled || !proficiencyConfig?.quotas) {
      return { isValid: true };
    }

    const quota = proficiencyConfig.quotas.find((q: TechnicalProficiencyQuota) =>
      q.proficiencyLevel === technicalProficiency && q.isActive
    );

    if (!quota) {
      return { isValid: true };
    }

    const counter = await this.getQuotaCounter(researchId, 'technicalProficiency', technicalProficiency);

    if (counter && counter.currentCount >= quota.quota) {
      return {
        isValid: false,
        reason: `Cuota de competencia técnica alcanzada para ${technicalProficiency}`,
        quotaInfo: {
          demographicType: 'technicalProficiency',
          value: technicalProficiency,
          currentCount: counter.currentCount,
          maxQuota: quota.quota
        }
      };
    }

    return { isValid: true };
  }

  /**
   * Incrementa los contadores de cuotas para un participante
   */
  private async incrementQuotaCounters(
    researchId: string,
    demographics: ParticipantDemographics,
    demographicQuestions: DemographicQuestions
  ): Promise<void> {
    const context = 'incrementQuotaCounters';

    try {
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

      // Incrementar contador de nivel de educación
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

      structuredLog('info', `${this.modelName}.${context}`, 'Quota counters incremented successfully', { researchId });

    } catch (error) {
      structuredLog('error', `${this.modelName}.${context}`, 'Error incrementing quota counters', { error, researchId });
      throw new ApiError('Error incrementing quota counters', 500);
    }
  }

  /**
   * Obtiene un contador de cuota específico
   */
  private async getQuotaCounter(
    researchId: string,
    demographicType: string,
    demographicValue: string
  ): Promise<QuotaCounter | null> {
    const context = 'getQuotaCounter';

    try {
      const counterId = `${researchId}-${demographicType}-${demographicValue}`;

      const command = new GetCommand({
        TableName: this.tableName,
        Key: {
          id: counterId,
          sk: 'QUOTA_COUNTER'
        }
      });

      const result = await this.docClient.send(command);

      if (!result.Item) {
        return null;
      }

      return {
        id: result.Item.id,
        researchId: result.Item.researchId,
        demographicType: result.Item.demographicType,
        demographicValue: result.Item.demographicValue,
        currentCount: result.Item.currentCount,
        maxQuota: result.Item.maxQuota,
        isActive: result.Item.isActive,
        createdAt: result.Item.createdAt,
        updatedAt: result.Item.updatedAt
      };

    } catch (error) {
      structuredLog('error', `${this.modelName}.${context}`, 'Error getting quota counter', { error, researchId, demographicType, demographicValue });
      return null;
    }
  }

  /**
   * Incrementa un contador de cuota específico
   */
  private async incrementQuotaCounter(
    researchId: string,
    demographicType: string,
    demographicValue: string
  ): Promise<void> {
    const context = 'incrementQuotaCounter';

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
        }
      });

      await this.docClient.send(command);

      structuredLog('info', `${this.modelName}.${context}`, 'Quota counter incremented', {
        researchId,
        demographicType,
        demographicValue,
        counterId
      });

    } catch (error) {
      structuredLog('error', `${this.modelName}.${context}`, 'Error incrementing quota counter', {
        error,
        researchId,
        demographicType,
        demographicValue
      });
      throw new ApiError('Error incrementing quota counter', 500);
    }
  }

  /**
   * Obtiene la configuración de eye tracking para una investigación
   */
  private async getEyeTrackingConfig(researchId: string): Promise<any> {
    const context = 'getEyeTrackingConfig';

    try {
      const command = new QueryCommand({
        TableName: this.tableName,
        IndexName: 'researchId-index',
        KeyConditionExpression: 'researchId = :researchId',
        FilterExpression: 'sk = :sk',
        ExpressionAttributeValues: {
          ':researchId': researchId,
          ':sk': 'EYE_TRACKING_CONFIG'
        }
      });

      const result = await this.docClient.send(command);

      if (!result.Items || result.Items.length === 0) {
        return null;
      }

      const item = result.Items[0];
      return {
        demographicQuestions: JSON.parse(item.demographicQuestions || '{}')
      };

    } catch (error) {
      structuredLog('error', `${this.modelName}.${context}`, 'Error getting eye tracking config', { error, researchId });
      return null;
    }
  }

  /**
   * Obtiene estadísticas de cuotas para una investigación
   */
  async getQuotaStats(researchId: string): Promise<QuotaCounter[]> {
    const context = 'getQuotaStats';

    try {
      const command = new QueryCommand({
        TableName: this.tableName,
        IndexName: 'researchId-index',
        KeyConditionExpression: 'researchId = :researchId',
        FilterExpression: 'sk = :sk',
        ExpressionAttributeValues: {
          ':researchId': researchId,
          ':sk': 'QUOTA_COUNTER'
        }
      });

      const result = await this.docClient.send(command);

      if (!result.Items) {
        return [];
      }

      return result.Items.map(item => ({
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
      structuredLog('error', `${this.modelName}.${context}`, 'Error getting quota stats', { error, researchId });
      throw new ApiError('Error getting quota stats', 500);
    }
  }
}
