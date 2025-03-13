import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';

export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  return {
    statusCode: 200,
    headers: {
      'Access-Control-Allow-Origin': process.env.STAGE === 'prod' 
        ? 'https://app.emotio-x.com' 
        : 'http://localhost:4700',
      'Access-Control-Allow-Credentials': 'true',
      'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type,Authorization,X-Api-Key',
      'Access-Control-Expose-Headers': 'Content-Type,Authorization,X-Api-Key',
      'Access-Control-Max-Age': '600'
    },
    body: ''
  };
}; 