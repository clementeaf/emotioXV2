"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.WelcomeScreenService = void 0;
const uuid_1 = require("uuid");
const aws_1 = require("../config/aws");
const lib_dynamodb_1 = require("@aws-sdk/lib-dynamodb");
// Valores por defecto
const DEFAULT_WELCOME_SCREEN_CONFIG = {
    isEnabled: true,
    title: '',
    message: '',
    startButtonText: 'Start Research',
    metadata: {
        version: '1.0.0'
    }
};
/**
 * Servicio para la gestión del Welcome Screen
 */
class WelcomeScreenService {
    constructor() {
        // Obtener el nombre de la tabla desde las variables de entorno
        this.tableName = process.env.WELCOME_SCREEN_TABLE || 'emotio-x-backend-v2-dev-welcome-screen';
    }
    /**
     * Guardar la configuración del Welcome Screen
     */
    async saveWelcomeScreen(researchId, userId, data) {
        try {
            const dynamoDb = (0, aws_1.getDynamoDBClient)();
            // Verificar si ya existe una configuración para esta investigación
            const existingConfig = await this.getWelcomeScreen(researchId, userId);
            // Preparar los datos para guardar
            const timestamp = new Date().toISOString();
            let welcomeScreenData;
            if (existingConfig) {
                // Actualizar configuración existente
                welcomeScreenData = {
                    ...existingConfig,
                    ...data,
                    updatedAt: new Date(timestamp),
                };
            }
            else {
                // Crear nueva configuración
                const id = `welcome-screen-${(0, uuid_1.v4)()}`;
                welcomeScreenData = {
                    ...DEFAULT_WELCOME_SCREEN_CONFIG,
                    ...data,
                    id,
                    researchId,
                    isEnabled: data.isEnabled ?? DEFAULT_WELCOME_SCREEN_CONFIG.isEnabled,
                    createdAt: new Date(timestamp),
                    updatedAt: new Date(timestamp),
                };
            }
            // Guardar en DynamoDB
            await dynamoDb.send(new lib_dynamodb_1.PutCommand({
                TableName: this.tableName,
                Item: welcomeScreenData,
            }));
            return welcomeScreenData;
        }
        catch (error) {
            console.error('Error saving welcome screen:', error);
            throw error;
        }
    }
    /**
     * Obtener la configuración del Welcome Screen para una investigación
     */
    async getWelcomeScreen(researchId, userId) {
        try {
            const dynamoDb = (0, aws_1.getDynamoDBClient)();
            // Buscar por el ID de la investigación
            const result = await dynamoDb.send(new lib_dynamodb_1.QueryCommand({
                TableName: this.tableName,
                KeyConditionExpression: 'researchId = :researchId',
                ExpressionAttributeValues: {
                    ':researchId': researchId,
                },
                Limit: 1,
            }));
            // Si no hay resultados, devolver null
            if (!result.Items || result.Items.length === 0) {
                return null;
            }
            // Devolver el primer resultado
            return result.Items[0];
        }
        catch (error) {
            console.error('Error getting welcome screen:', error);
            throw error;
        }
    }
}
exports.WelcomeScreenService = WelcomeScreenService;
//# sourceMappingURL=welcome-screen.service.js.map