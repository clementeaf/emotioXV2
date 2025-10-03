/**
 * Tipos específicos para DynamoDB
 */

import { AttributeValue } from '@aws-sdk/client-dynamodb';

/**
 * Tipo para valores de expresiones de DynamoDB
 * Los valores pueden ser strings, números, booleanos, o AttributeValues de AWS
 */
export type DynamoDBExpressionValue =
  | string
  | number
  | boolean
  | null
  | string[]
  | number[]
  | AttributeValue;

/**
 * Tipo para ExpressionAttributeValues de DynamoDB
 * Usa Record con tipos específicos en lugar de any
 */
export type ExpressionAttributeValues = Record<string, DynamoDBExpressionValue>;

/**
 * Tipo para ExpressionAttributeNames de DynamoDB
 */
export type ExpressionAttributeNames = Record<string, string>;

/**
 * Tipo para un item de DynamoDB (genérico)
 */
export type DynamoDBItem = Record<string, DynamoDBExpressionValue>;

/**
 * Tipo para QueryInput params
 */
export interface DynamoDBQueryParams {
  TableName: string;
  KeyConditionExpression?: string;
  FilterExpression?: string;
  ExpressionAttributeValues?: ExpressionAttributeValues;
  ExpressionAttributeNames?: ExpressionAttributeNames;
  IndexName?: string;
  Limit?: number;
  ScanIndexForward?: boolean;
  ExclusiveStartKey?: DynamoDBItem;
}

/**
 * Tipo para UpdateInput params
 */
export interface DynamoDBUpdateParams {
  TableName: string;
  Key: DynamoDBItem;
  UpdateExpression: string;
  ExpressionAttributeValues: ExpressionAttributeValues;
  ExpressionAttributeNames?: ExpressionAttributeNames;
  ConditionExpression?: string;
  ReturnValues?: 'NONE' | 'ALL_OLD' | 'UPDATED_OLD' | 'ALL_NEW' | 'UPDATED_NEW';
}

/**
 * Tipo para PutInput params
 */
export interface DynamoDBPutParams {
  TableName: string;
  Item: DynamoDBItem;
  ConditionExpression?: string;
  ExpressionAttributeValues?: ExpressionAttributeValues;
  ExpressionAttributeNames?: ExpressionAttributeNames;
}
