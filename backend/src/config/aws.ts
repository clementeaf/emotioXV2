/**
 * Configuración centralizada para servicios AWS usando SDK v3 modular
 */
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient } from "@aws-sdk/lib-dynamodb";

// Crear una sola instancia del cliente base
const dynamoClient = new DynamoDBClient({
  region: process.env.AWS_REGION || 'us-east-1'
});

// Crear el cliente para trabajar con documentos
export const dynamoDbDocClient = DynamoDBDocumentClient.from(dynamoClient, {
  marshallOptions: {
    // Configuración para eliminar tipos vacíos
    removeUndefinedValues: true,
  },
});

// Exportar los clientes y utilidades como funciones singleton
export const getDynamoDBClient = () => dynamoDbDocClient; 