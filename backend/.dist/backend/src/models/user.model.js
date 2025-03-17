"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.userModel = exports.UserModel = void 0;
const client_dynamodb_1 = require("@aws-sdk/client-dynamodb");
const lib_dynamodb_1 = require("@aws-sdk/lib-dynamodb");
const bcrypt = __importStar(require("bcryptjs"));
const uuid_1 = require("uuid");
class UserModel {
    constructor() {
        this.tableName = process.env.USERS_TABLE || '';
        const client = new client_dynamodb_1.DynamoDB({
            region: process.env.AWS_REGION || 'us-east-1',
        });
        this.docClient = lib_dynamodb_1.DynamoDBDocument.from(client);
    }
    // Hash password con bcrypt
    async hashPassword(password) {
        const salt = await bcrypt.genSalt(12);
        return bcrypt.hash(password, salt);
    }
    // Verificar contraseña con bcrypt
    async comparePassword(password, hash) {
        return bcrypt.compare(password, hash);
    }
    async create(name, email, password) {
        // Primero verificar si existe un usuario con ese email
        const existingUser = await this.findByEmail(email);
        if (existingUser) {
            throw new Error('User already exists');
        }
        const now = Date.now();
        const id = (0, uuid_1.v4)();
        const hashedPassword = await this.hashPassword(password);
        const user = {
            id,
            name,
            email,
            password: hashedPassword,
            createdAt: now,
            updatedAt: now
        };
        await this.docClient.put({
            TableName: this.tableName,
            Item: user
        });
        // No devolver la contraseña
        const { password: _, ...userWithoutPassword } = user;
        return userWithoutPassword;
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
    async findByEmail(email) {
        const result = await this.docClient.query({
            TableName: this.tableName,
            IndexName: 'EmailIndex',
            KeyConditionExpression: 'email = :email',
            ExpressionAttributeValues: {
                ':email': email
            }
        });
        if (!result.Items || result.Items.length === 0) {
            return null;
        }
        return result.Items[0];
    }
    async update(id, data) {
        const user = await this.findById(id);
        if (!user) {
            throw new Error('User not found');
        }
        // Construir expresiones de actualización dinámicamente
        const updateExpressions = [];
        const expressionAttributeNames = {};
        const expressionAttributeValues = {};
        // Actualizar solo los campos proporcionados
        Object.entries(data).forEach(([key, value]) => {
            if (key !== 'id' && key !== 'email' && key !== 'password' && key !== 'createdAt') {
                updateExpressions.push(`#${key} = :${key}`);
                expressionAttributeNames[`#${key}`] = key;
                expressionAttributeValues[`:${key}`] = value;
            }
        });
        // Siempre actualizar updatedAt
        updateExpressions.push('#updatedAt = :updatedAt');
        expressionAttributeNames['#updatedAt'] = 'updatedAt';
        expressionAttributeValues[':updatedAt'] = Date.now();
        // Si hay una nueva contraseña, hashearla
        if (data.password) {
            updateExpressions.push('#password = :password');
            expressionAttributeNames['#password'] = 'password';
            expressionAttributeValues[':password'] = await this.hashPassword(data.password);
        }
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
            throw new Error('Failed to update user');
        }
        // No devolver la contraseña
        const { password: _, ...userWithoutPassword } = result.Attributes;
        return userWithoutPassword;
    }
    async delete(id) {
        await this.docClient.delete({
            TableName: this.tableName,
            Key: { id }
        });
    }
}
exports.UserModel = UserModel;
// Singleton para reutilizar en toda la aplicación
exports.userModel = new UserModel();
//# sourceMappingURL=user.model.js.map