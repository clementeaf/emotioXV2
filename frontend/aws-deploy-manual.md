# 🚀 Deploy Manual a AWS S3/CloudFront - EmotioXV2

## 📋 PREREQUISITOS

### **1. Configurar AWS CLI**
```bash
# Instalar AWS CLI si no está instalado
brew install awscli

# Configurar credenciales
aws configure
# AWS Access Key ID: [tu-access-key]
# AWS Secret Access Key: [tu-secret-key]
# Default region name: us-east-1
# Default output format: json
```

### **2. Verificar credenciales**
```bash
aws sts get-caller-identity
```

## 🔧 PASO 1: CREAR S3 BUCKET

### **Crear bucket:**
```bash
aws s3 mb s3://emotioxv2-frontend --region us-east-1
```

### **Configurar bucket para hosting estático:**
```bash
aws s3 website s3://emotioxv2-frontend --index-document index.html --error-document error.html
```

### **Configurar política de bucket:**
```bash
aws s3api put-bucket-policy --bucket emotioxv2-frontend --policy file://bucket-policy.json
```

### **bucket-policy.json:**
```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "PublicReadGetObject",
      "Effect": "Allow",
      "Principal": "*",
      "Action": "s3:GetObject",
      "Resource": "arn:aws:s3:::emotioxv2-frontend/*"
    }
  ]
}
```

## 🔧 PASO 2: BUILD Y DEPLOY

### **Build con variables de entorno:**
```bash
# Configurar variables de entorno
export NEXT_PUBLIC_API_URL="https://d5x2q3te3j.execute-api.us-east-1.amazonaws.com/dev"
export NEXT_PUBLIC_WS_URL="wss://d5x2q3te3j.execute-api.us-east-1.amazonaws.com/dev"
export NEXT_PUBLIC_ENV="production"

# Build
npm run build

# Deploy a S3
aws s3 sync out/ s3://emotioxv2-frontend --delete
```

## 🔧 PASO 3: CONFIGURAR CLOUDFRONT

### **Crear distribución CloudFront:**
```bash
aws cloudfront create-distribution --distribution-config file://cloudfront-config.json
```

### **cloudfront-config.json:**
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

## 🔧 PASO 4: CONFIGURAR REDIRECCIONAMIENTOS

### **Crear Lambda@Edge para redireccionamientos API:**
```javascript
// lambda-redirects.js
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

### **Crear Lambda@Edge para headers de seguridad:**
```javascript
// lambda-headers.js
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

## 🔧 PASO 5: AUTOMATIZAR CON GITHUB ACTIONS

### **Configurar secrets en GitHub:**
- `AWS_ACCESS_KEY_ID`
- `AWS_SECRET_ACCESS_KEY`
- `S3_BUCKET` = `emotioxv2-frontend`
- `CLOUDFRONT_DISTRIBUTION_ID`
- `NEXT_PUBLIC_API_URL`
- `NEXT_PUBLIC_WS_URL`

### **El workflow ya está creado:** `aws-s3-deploy.yml`

## ✅ VERIFICACIÓN

### **1. Verificar S3:**
```bash
aws s3 ls s3://emotioxv2-frontend
```

### **2. Verificar CloudFront:**
```bash
aws cloudfront list-distributions
```

### **3. Verificar URL:**
- **S3:** `http://emotioxv2-frontend.s3-website-us-east-1.amazonaws.com`
- **CloudFront:** `https://[distribution-id].cloudfront.net`

## 🎯 COSTO ESTIMADO

- **S3:** ~$0.023/GB/mes
- **CloudFront:** ~$0.085/GB transferencia
- **Lambda@Edge:** ~$0.60/mes
- **Total:** ~$1-5/mes

## ⚠️ LIMITACIONES

- ⚠️ **Redireccionamientos API** requieren Lambda@Edge
- ⚠️ **Headers de seguridad** requieren Lambda@Edge
- ⚠️ **Configuración manual** compleja
- ⚠️ **Mantenimiento** requerido
