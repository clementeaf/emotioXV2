"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.researchModel = exports.ResearchModel = void 0;
const client_dynamodb_1 = require("@aws-sdk/client-dynamodb");
const lib_dynamodb_1 = require("@aws-sdk/lib-dynamodb");
const uuid_1 = require("uuid");
class ResearchModel {
    constructor() {
        this.tableName = process.env.RESEARCH_TABLE || '';
        const client = new client_dynamodb_1.DynamoDB({
            region: process.env.AWS_REGION || 'us-east-1',
        });
        this.docClient = lib_dynamodb_1.DynamoDBDocument.from(client);
    }
    async create(data) {
        const now = Date.now();
        const id = (0, uuid_1.v4)();
        const research = {
            id,
            ...data,
            status: 'draft',
            progress: 0,
            createdAt: now,
            updatedAt: now
        };
        await this.docClient.put({
            TableName: this.tableName,
            Item: research
        });
        return research;
    }
    async findById(id) {
        const result = await this.docClient.get({
            TableName: this.tableName,
            Key: { id }
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
                ':userId': userId
            }
        });
        if (!result.Items || result.Items.length === 0) {
            return [];
        }
        return result.Items;
    }
    async update(id, data) {
        const research = await this.findById(id);
        if (!research) {
            throw new Error('Research not found');
        }
        // Construir expresiones de actualización dinámicamente
        const updateExpressions = [];
        const expressionAttributeNames = {};
        const expressionAttributeValues = {};
        // Actualizar solo los campos proporcionados
        Object.entries(data).forEach(([key, value]) => {
            if (key !== 'id' && key !== 'userId' && key !== 'createdAt') {
                updateExpressions.push(`#${key} = :${key}`);
                expressionAttributeNames[`#${key}`] = key;
                expressionAttributeValues[`:${key}`] = value;
            }
        });
        // Siempre actualizar updatedAt
        updateExpressions.push('#updatedAt = :updatedAt');
        expressionAttributeNames['#updatedAt'] = 'updatedAt';
        expressionAttributeValues[':updatedAt'] = Date.now();
        const updateExpression = `SET ${updateExpressions.join(', ')}`;
        const result = await this.docClient.update({
            TableName: this.tableName,
            Key: { id },
            UpdateExpression: updateExpression,
            ExpressionAttributeNames: expressionAttributeNames,
            ExpressionAttributeValues: expressionAttributeValues,
            ReturnValues: 'ALL_NEW'
        });
        if (!result.Attributes) {
            throw new Error('Failed to update research');
        }
        return result.Attributes;
    }
    async updateStatus(id, status) {
        return this.update(id, { status });
    }
    async updateProgress(id, progress) {
        return this.update(id, { progress });
    }
    async delete(id) {
        await this.docClient.delete({
            TableName: this.tableName,
            Key: { id }
        });
    }
}
exports.ResearchModel = ResearchModel;
// Singleton para reutilizar en toda la aplicación
exports.researchModel = new ResearchModel();
//# sourceMappingURL=research.model.js.map