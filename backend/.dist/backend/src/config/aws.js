"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getDynamoDBClient = exports.dynamoDbDocClient = void 0;
/**
 * Configuración centralizada para servicios AWS usando SDK v3 modular
 */
const client_dynamodb_1 = require("@aws-sdk/client-dynamodb");
const lib_dynamodb_1 = require("@aws-sdk/lib-dynamodb");
// Crear una sola instancia del cliente base
const dynamoClient = new client_dynamodb_1.DynamoDBClient({
    region: process.env.AWS_REGION || 'us-east-1'
});
// Crear el cliente para trabajar con documentos
exports.dynamoDbDocClient = lib_dynamodb_1.DynamoDBDocumentClient.from(dynamoClient, {
    marshallOptions: {
        // Configuración para eliminar tipos vacíos
        removeUndefinedValues: true,
    },
});
// Exportar los clientes y utilidades como funciones singleton
const getDynamoDBClient = () => exports.dynamoDbDocClient;
exports.getDynamoDBClient = getDynamoDBClient;
//# sourceMappingURL=aws.js.map