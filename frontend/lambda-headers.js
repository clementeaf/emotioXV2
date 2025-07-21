/**
 * Lambda@Edge function para headers de seguridad
 * Aplica headers de seguridad a todas las respuestas
 */

exports.handler = async (event) => {
  const response = event.Records[0].cf.response;

  // Headers de seguridad
  response.headers['x-content-type-options'] = [{
    key: 'X-Content-Type-Options',
    value: 'nosniff'
  }];

  response.headers['x-frame-options'] = [{
    key: 'X-Frame-Options',
    value: 'DENY'
  }];

  response.headers['x-xss-protection'] = [{
    key: 'X-XSS-Protection',
    value: '1; mode=block'
  }];

  response.headers['referrer-policy'] = [{
    key: 'Referrer-Policy',
    value: 'strict-origin-when-cross-origin'
  }];

  response.headers['permissions-policy'] = [{
    key: 'Permissions-Policy',
    value: 'camera=(), microphone=(), geolocation=()'
  }];

  // Headers de CORS para API calls
  response.headers['access-control-allow-origin'] = [{
    key: 'Access-Control-Allow-Origin',
    value: '*'
  }];

  response.headers['access-control-allow-methods'] = [{
    key: 'Access-Control-Allow-Methods',
    value: 'GET, POST, PUT, DELETE, OPTIONS'
  }];

  response.headers['access-control-allow-headers'] = [{
    key: 'Access-Control-Allow-Headers',
    value: 'Content-Type, Authorization, X-Requested-With'
  }];

  return response;
};
