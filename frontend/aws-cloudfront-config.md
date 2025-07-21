# 🚀 Configuración AWS S3 + CloudFront - EmotioXV2

## 📋 INFRAESTRUCTURA AWS

### **1. S3 Bucket**
```bash
# Crear bucket
aws s3 mb s3://emotioxv2-frontend

# Configurar para hosting estático
aws s3 website s3://emotioxv2-frontend --index-document index.html --error-document error.html
```

### **2. CloudFront Distribution**
```bash
# Crear distribución CloudFront
aws cloudfront create-distribution --distribution-config file://cloudfront-config.json
```

### **3. CloudFront Config (cloudfront-config.json)**
```json
{
  "CallerReference": "emotioxv2-frontend-$(date +%s)",
  "Comment": "EmotioXV2 Frontend",
  "DefaultRootObject": "index.html",
  "Origins": {
    "Quantity": 1,
    "Items": [
      {
        "Id": "S3-emotioxv2-frontend",
        "DomainName": "emotioxv2-frontend.s3.amazonaws.com",
        "S3OriginConfig": {
          "OriginAccessIdentity": ""
        }
      }
    ]
  },
  "DefaultCacheBehavior": {
    "TargetOriginId": "S3-emotioxv2-frontend",
    "ViewerProtocolPolicy": "redirect-to-https",
    "TrustedSigners": {
      "Enabled": false,
      "Quantity": 0
    },
    "ForwardedValues": {
      "QueryString": false,
      "Cookies": {
        "Forward": "none"
      }
    },
    "MinTTL": 0,
    "Compress": true
  },
  "CustomErrorResponses": {
    "Quantity": 1,
    "Items": [
      {
        "ErrorCode": 404,
        "ResponsePagePath": "/index.html",
        "ResponseCode": "200"
      }
    ]
  },
  "Enabled": true,
  "PriceClass": "PriceClass_100"
}
```

## 🔧 CONFIGURACIÓN MANUAL REQUERIDA

### **Redireccionamientos API (Lambda@Edge)**
```javascript
// Lambda function para redireccionamientos
exports.handler = async (event) => {
  const request = event.Records[0].cf.request;

  // Redireccionar /api/* a la API Gateway
  if (request.uri.startsWith('/api/')) {
    return {
      status: '302',
      statusDescription: 'Found',
      headers: {
        'location': [{
          key: 'Location',
          value: `https://d5x2q3te3j.execute-api.us-east-1.amazonaws.com/dev${request.uri}`
        }]
      }
    };
  }

  return request;
};
```

### **Headers de Seguridad (Lambda@Edge)**
```javascript
// Lambda function para headers de seguridad
exports.handler = async (event) => {
  const response = event.Records[0].cf.response;

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

  return response;
};
```

## ✅ VENTAJAS DE AWS

- ✅ **Control total** de la infraestructura
- ✅ **Escalabilidad** automática
- ✅ **CDN global** con CloudFront
- ✅ **SSL automático**
- ✅ **Costo muy bajo** ($0.023/GB + transferencia)

## ⚠️ DESVENTAJAS

- ⚠️ **Configuración manual** compleja
- ⚠️ **Lambda@Edge** para redireccionamientos
- ⚠️ **Mantenimiento** requerido
- ⚠️ **Tiempo de configuración:** 2-4 horas

## 🎯 COSTO ESTIMADO

- **S3:** ~$0.023/GB/mes
- **CloudFront:** ~$0.085/GB transferencia
- **Lambda@Edge:** ~$0.60/mes
- **Total:** ~$1-5/mes (dependiendo del tráfico)
