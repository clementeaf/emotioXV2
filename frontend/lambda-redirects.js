/**
 * Lambda@Edge function para redireccionamientos API
 * Redirige /api/* a la API Gateway de AWS
 */

exports.handler = async (event) => {
  const request = event.Records[0].cf.request;

  // Redireccionar /api/* a la API Gateway
  if (request.uri.startsWith('/api/')) {
    const apiGatewayUrl = 'https://d5x2q3te3j.execute-api.us-east-1.amazonaws.com/dev';
    const targetUrl = `${apiGatewayUrl}${request.uri}`;

    return {
      status: '302',
      statusDescription: 'Found',
      headers: {
        'location': [{
          key: 'Location',
          value: targetUrl
        }],
        'cache-control': [{
          key: 'Cache-Control',
          value: 'no-cache, no-store, must-revalidate'
        }]
      }
    };
  }

  // Para rutas SPA, redirigir a index.html
  if (!request.uri.includes('.') && request.uri !== '/') {
    request.uri = '/index.html';
  }

  return request;
};
