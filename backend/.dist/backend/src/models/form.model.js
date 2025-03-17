"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.formModel = exports.FormModel = void 0;
const client_dynamodb_1 = require("@aws-sdk/client-dynamodb");
const lib_dynamodb_1 = require("@aws-sdk/lib-dynamodb");
const uuid_1 = require("uuid");
class FormModel {
    constructor() {
        this.tableName = process.env.FORMS_TABLE || '';
        const client = new client_dynamodb_1.DynamoDB({
            region: process.env.AWS_REGION || 'us-east-1',
        });
        this.docClient = lib_dynamodb_1.DynamoDBDocument.from(client);
    }
    async create(data) {
        const now = Date.now();
        const id = (0, uuid_1.v4)();
        const form = {
            id,
            ...data,
            createdAt: now,
            updatedAt: now
        };
        await this.docClient.put({
            TableName: this.tableName,
            Item: form
        });
        return form;
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
    async findByResearchId(researchId) {
        const result = await this.docClient.query({
            TableName: this.tableName,
            IndexName: 'ResearchIdIndex',
            KeyConditionExpression: 'researchId = :researchId',
            ExpressionAttributeValues: {
                ':researchId': researchId
            }
        });
        if (!result.Items || result.Items.length === 0) {
            return [];
        }
        return result.Items;
    }
    async update(id, data) {
        const form = await this.findById(id);
        if (!form) {
            throw new Error('Form not found');
        }
        // Construir expresiones de actualización dinámicamente
        const updateExpressions = [];
        const expressionAttributeNames = {};
        const expressionAttributeValues = {};
        // Actualizar solo los campos proporcionados
        Object.entries(data).forEach(([key, value]) => {
            if (key !== 'id' && key !== 'researchId' && key !== 'userId' && key !== 'createdAt') {
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
            throw new Error('Failed to update form');
        }
        return result.Attributes;
    }
    async delete(id) {
        await this.docClient.delete({
            TableName: this.tableName,
            Key: { id }
        });
    }
    async deleteByResearchId(researchId) {
        const forms = await this.findByResearchId(researchId);
        // Si no hay formularios, no hacer nada
        if (forms.length === 0) {
            return;
        }
        // Eliminar todos los formularios asociados a la investigación
        const deletePromises = forms.map(form => this.delete(form.id));
        await Promise.all(deletePromises);
    }
}
exports.FormModel = FormModel;
// Singleton para reutilizar en toda la aplicación
exports.formModel = new FormModel();
//# sourceMappingURL=form.model.js.map