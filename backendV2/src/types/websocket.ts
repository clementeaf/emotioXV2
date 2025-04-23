/**
 * Definición de tipos para eventos WebSocket en AWS Lambda
 */

// Tipo para el contexto de solicitud WebSocket
export interface APIGatewayEventWebsocketRequestContext {
  routeKey: string;
  messageId?: string;
  eventType: string;
  extendedRequestId?: string;
  requestTime: string;
  messageDirection: string;
  stage: string;
  connectedAt?: number;
  requestTimeEpoch: number;
  identity: {
    cognitoIdentityPoolId?: string;
    cognitoIdentityId?: string;
    principalOrgId?: string;
    cognitoAuthenticationType?: string;
    userArn?: string;
    userAgent?: string;
    accountId?: string;
    caller?: string;
    sourceIp: string;
    accessKey?: string;
    cognitoAuthenticationProvider?: string;
    user?: string;
  };
  requestId: string;
  domainName: string;
  connectionId: string;
  apiId: string;
}

// Tipo para el cuerpo de la solicitud WebSocket
export interface WebSocketRequestBody {
  action?: string;
  data?: any;
  [key: string]: any;
}

// Tipo para respuesta a evento WebSocket
export interface WebSocketResponse {
  statusCode: number;
  body: string;
}

// Comando WebSocket para envío de mensajes a clientes
export interface WebSocketCommand {
  action: string;
  connectionId?: string;
  data?: any;
} 