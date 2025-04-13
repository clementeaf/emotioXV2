import { APIGatewayProxyResult } from 'aws-lambda';

export const handleError = (error: unknown): APIGatewayProxyResult => {
  console.error('Error:', error);

  if (error instanceof Error) {
    if (error.message.includes('not found')) {
      return {
        statusCode: 404,
        body: JSON.stringify({ message: error.message })
      };
    }

    if (error.message.includes('validation')) {
      return {
        statusCode: 400,
        body: JSON.stringify({ message: error.message })
      };
    }
  }

  return {
    statusCode: 500,
    body: JSON.stringify({ message: 'Internal server error' })
  };
}; 