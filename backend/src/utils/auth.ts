import { APIGatewayProxyEvent } from 'aws-lambda';
import { verify } from 'jsonwebtoken';

interface DecodedToken {
  sub?: string;
  id?: string;
  email: string;
  iat: number;
  exp: number;
}

/**
 * Extract and verify JWT token from Authorization header
 */
export function verifyToken(token: string): DecodedToken {
  try {
    const decoded = verify(token, process.env.JWT_SECRET!) as DecodedToken;
    return decoded;
  } catch (error) {
    throw new Error('Invalid token');
  }
}

/**
 * Extract user ID from event's Authorization header
 */
export function getUserIdFromEvent(event: APIGatewayProxyEvent): string {
  const authHeader = event.headers.Authorization || event.headers.authorization;
  
  if (!authHeader) {
    throw new Error('No authorization header');
  }

  const token = authHeader.replace('Bearer ', '');
  const decoded = verifyToken(token);
  
  // Soporte para tokens con campo 'sub' o 'id'
  const userId = decoded.sub || decoded.id;
  
  if (!userId) {
    throw new Error('Invalid token: missing user identifier');
  }
  
  return userId;
}

/**
 * Middleware to verify authentication
 */
export function requireAuth(event: APIGatewayProxyEvent): string | never {
  try {
    return getUserIdFromEvent(event);
  } catch (error) {
    throw new Error('Unauthorized');
  }
} 