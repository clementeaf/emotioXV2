"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.connectionModel = exports.ConnectionModel = void 0;
const client_dynamodb_1 = require("@aws-sdk/client-dynamodb");
const lib_dynamodb_1 = require("@aws-sdk/lib-dynamodb");
const client_apigatewaymanagementapi_1 = require("@aws-sdk/client-apigatewaymanagementapi");
class ConnectionModel {
    constructor() {
        this.apiGateway = null;
        this.tableName = process.env.CONNECTIONS_TABLE || '';
        const client = new client_dynamodb_1.DynamoDB({
            region: process.env.AWS_REGION || 'us-east-1',
        });
        this.docClient = lib_dynamodb_1.DynamoDBDocument.from(client);
    }
    // Inicializar el cliente de API Gateway con el endpoint correcto
    initApiGateway(endpoint) {
        this.apiGateway = new client_apigatewaymanagementapi_1.ApiGatewayManagementApi({
            endpoint,
            region: process.env.AWS_REGION || 'us-east-1',
        });
    }
    async create(connectionId, userId) {
        const connection = {
            connectionId,
            userId,
            createdAt: Date.now(),
        };
        await this.docClient.put({
            TableName: this.tableName,
            Item: connection,
        });
        return connection;
    }
    async findByConnectionId(connectionId) {
        const result = await this.docClient.get({
            TableName: this.tableName,
            Key: { connectionId }
        });
        if (!result.Item) {
            return null;
        }
        return result.Item;
    }
    async findByUserId(userId) {
        const result = await this.docClient.query({
            TableName: this.tableName,
            IndexName: 'UserIdIndex',
            KeyConditionExpression: 'userId = :userId',
            ExpressionAttributeValues: {
                ':userId': userId,
            },
        });
        if (!result.Items || result.Items.length === 0) {
            return [];
        }
        return result.Items;
    }
    async delete(connectionId) {
        await this.docClient.delete({
            TableName: this.tableName,
            Key: { connectionId },
        });
    }
    async sendMessage(connectionId, message) {
        if (!this.apiGateway) {
            throw new Error('API Gateway client not initialized. Call initApiGateway first.');
        }
        try {
            await this.apiGateway.postToConnection({
                ConnectionId: connectionId,
                Data: Buffer.from(JSON.stringify(message)),
            });
        }
        catch (error) {
            if (error.statusCode === 410) {
                // Si la conexión ya no existe, la eliminamos
                await this.delete(connectionId);
            }
            else {
                throw error;
            }
        }
    }
    async broadcastToUser(userId, message) {
        if (!this.apiGateway) {
            throw new Error('API Gateway client not initialized. Call initApiGateway first.');
        }
        const connections = await this.findByUserId(userId);
        // Si no hay conexiones, no hacer nada
        if (connections.length === 0) {
            return;
        }
        // Enviar mensaje a todas las conexiones del usuario
        const sendPromises = connections.map(connection => this.sendMessage(connection.connectionId, message).catch(error => {
            console.error(`Error al enviar mensaje a ${connection.connectionId}:`, error);
        }));
        await Promise.all(sendPromises);
    }
}
exports.ConnectionModel = ConnectionModel;
// Singleton para reutilizar en toda la aplicación
exports.connectionModel = new ConnectionModel();
//# sourceMappingURL=connection.model.js.map