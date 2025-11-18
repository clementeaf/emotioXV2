# EmotioXV2

Sistema completo de investigación y análisis de emociones con eye-tracking.

## 🌐 URLs de Producción

### Frontend
- **CloudFront:** https://d26ykfabt39qmf.cloudfront.net
- **S3 Website:** http://emotioxv2-frontend-041238861016.s3-website-us-east-1.amazonaws.com
- **Distribution ID:** `E2S057L9JBBIWL`

### Public Tests
- **CloudFront:** https://d35071761848hm.cloudfront.net
- **S3 Website:** http://emotioxv2-public-tests-041238861016.s3-website-us-east-1.amazonaws.com
- **Distribution ID:** `E3KFNJVCTHRPO9`

## 📁 Estructura del Proyecto

```
emotioXV2/
├── frontend/          # Next.js 14 - Panel de administración
├── backendV2/         # AWS Lambda Serverless - API
├── public-tests/      # Vite React - Tests públicos
└── shared/            # Interfaces TypeScript compartidas
```

## 🚀 Inicio Rápido

### Prerequisitos
- Node.js 20+
- npm o yarn
- AWS CLI configurado (para deployment)

### Desarrollo Local

```bash
# Frontend
cd frontend
npm install
npm run dev
# http://localhost:3000

# Public Tests
cd public-tests
npm install
npm run dev
# http://localhost:5173

# Backend
cd backendV2
npm install
serverless offline
```

## 🔧 Deployment

### Frontend
Los cambios en `frontend/**` se despliegan automáticamente a S3/CloudFront mediante GitHub Actions.

### Public Tests
Los cambios en `public-tests/**` se despliegan automáticamente a S3/CloudFront mediante GitHub Actions.

### Backend
```bash
cd backendV2
serverless deploy
```

## 📊 Infraestructura AWS

### S3 Buckets
- **Frontend:** `emotioxv2-frontend-041238861016`
- **Public Tests:** `emotioxv2-public-tests-041238861016`

### CloudFront Distributions
- **Frontend:** `E2S057L9JBBIWL` → `d26ykfabt39qmf.cloudfront.net`
- **Public Tests:** `E3KFNJVCTHRPO9` → `d35071761848hm.cloudfront.net`

### Región
- **AWS Region:** `us-east-1`

## 🔐 Secrets de GitHub

Los siguientes secrets deben estar configurados en GitHub:

- `AWS_ACCESS_KEY_ID`
- `AWS_SECRET_ACCESS_KEY`
- `FRONTEND_CLOUDFRONT_DISTRIBUTION_ID` → `E2S057L9JBBIWL`
- `PUBLIC_TESTS_CLOUDFRONT_DISTRIBUTION_ID` → `E3KFNJVCTHRPO9`
- `NEXT_PUBLIC_PUBLIC_TESTS_URL` → `https://d35071761848hm.cloudfront.net`
- `VITE_API_BASE_URL`
- `VITE_PUBLIC_TESTS_URL`

## 📚 Documentación

- [Configuración de CloudFront para Frontend](./docs/cloudfront-frontend-setup.md)
- [Reglas de Desarrollo](./.cursorrules)
- [Arquitectura del Proyecto](./docs/architecture.md)

## 🛠️ Scripts Útiles

```bash
# Crear distribución de CloudFront para frontend
./scripts/create-frontend-cloudfront.sh

# Deploy manual de frontend
cd frontend && npm run build && aws s3 sync ./out/ s3://emotioxv2-frontend-041238861016 --delete

# Deploy manual de public-tests
cd public-tests && npm run build && aws s3 sync ./dist/ s3://emotioxv2-public-tests-041238861016 --delete
```

## 🔄 CI/CD

### GitHub Actions Workflows

- **`.github/workflows/ci.yml`** - Verificación de TypeScript, linting y tests
- **`.github/workflows/deploy-frontend.yml`** - Deploy automático de frontend a S3/CloudFront
- **`.github/workflows/deploy-public-tests-s3.yml`** - Deploy automático de public-tests a S3/CloudFront

### Triggers
- **Frontend:** Push a `main` con cambios en `frontend/**`
- **Public Tests:** Push a `main` con cambios en `public-tests/**`

## 📝 Notas

- El frontend usa Next.js con export estático para S3/CloudFront
- Public-tests usa Vite para build optimizado
- Ambos proyectos invalidan automáticamente CloudFront después de cada deploy
- Las distribuciones de CloudFront están configuradas para SPA (Single Page Application) con custom error responses

## 🐛 Troubleshooting

### CloudFront no se actualiza
- Verifica que el secret `FRONTEND_CLOUDFRONT_DISTRIBUTION_ID` esté configurado
- Revisa los logs del workflow en GitHub Actions
- Verifica el estado de la distribución: `aws cloudfront get-distribution --id E2S057L9JBBIWL`

### S3 Website no accesible
- Verifica que el bucket tenga website hosting habilitado
- Verifica los permisos del bucket (debe ser público para lectura)

## 📧 Contacto

Para más información, consulta la documentación en `docs/` o revisa los workflows en `.github/workflows/`.

