"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.formResponseModel = exports.FormResponseModel = void 0;
const client_dynamodb_1 = require("@aws-sdk/client-dynamodb");
const lib_dynamodb_1 = require("@aws-sdk/lib-dynamodb");
const uuid_1 = require("uuid");
class FormResponseModel {
    constructor() {
        this.tableName = process.env.FORM_RESPONSES_TABLE || 'FormResponses';
        const client = new client_dynamodb_1.DynamoDB({
            region: process.env.AWS_REGION || 'us-east-1',
            ...(process.env.IS_OFFLINE && {
                endpoint: 'http://localhost:8000',
                credentials: {
                    accessKeyId: 'DEFAULT_ACCESS_KEY',
                    secretAccessKey: 'DEFAULT_SECRET'
                }
            })
        });
        this.docClient = lib_dynamodb_1.DynamoDBDocument.from(client);
    }
    async create(data) {
        const now = Date.now();
        const id = (0, uuid_1.v4)();
        const formResponse = {
            id,
            ...data,
            createdAt: now,
            updatedAt: now
        };
        await this.docClient.put({
            TableName: this.tableName,
            Item: formResponse
        });
        return formResponse;
    }
    async findById(id) {
        const result = await this.docClient.get({
            TableName: this.tableName,
            Key: { id }
        });
        return result.Item || null;
    }
    async findByFormId(formId) {
        const result = await this.docClient.query({
            TableName: this.tableName,
            IndexName: 'FormIdIndex',
            KeyConditionExpression: 'formId = :formId',
            ExpressionAttributeValues: {
                ':formId': formId
            }
        });
        return result.Items || [];
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
        return result.Items || [];
    }
    async delete(id) {
        await this.docClient.delete({
            TableName: this.tableName,
            Key: { id }
        });
    }
}
exports.FormResponseModel = FormResponseModel;
// Singleton para reutilizar en toda la aplicación
exports.formResponseModel = new FormResponseModel();
//# sourceMappingURL=form-response.model.js.map