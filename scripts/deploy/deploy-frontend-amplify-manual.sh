#!/bin/bash

# 🚀 Script para despliegue manual del frontend a Amplify
# Usa el build local para hacer deploy inmediato

set -e

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

log_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

log_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

log_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

log_error() {
    echo -e "${RED}❌ $1${NC}"
}

# Configuración
APP_ID="diq999se9lnd8"
BRANCH_NAME="main"
REGION="us-east-1"

# Verificar que estamos en el directorio correcto
if [ ! -f "frontend/package.json" ]; then
    log_error "No se encuentra frontend/package.json. Ejecuta desde el directorio raíz del proyecto."
    exit 1
fi

# Build del frontend
log_info "Construyendo frontend..."
cd frontend

# Instalar dependencias si no están
if [ ! -d "node_modules" ]; then
    log_info "Instalando dependencias..."
    npm install
fi

# Hacer build
log_info "Ejecutando build de Next.js..."
npm run build

cd ..

# Crear archivo de configuración para Amplify
log_info "Creando configuración de build para Amplify..."

cat > frontend/amplify.yml << 'EOF'
version: 1
frontend:
  phases:
    preBuild:
      commands:
        - npm ci
    build:
      commands:
        - npm run build
  artifacts:
    baseDirectory: .next
    files:
      - '**/*'
  cache:
    paths:
      - node_modules/**/*
EOF

log_success "Configuración de build creada"

# Crear un archivo ZIP con el build
log_info "Creando archivo de despliegue..."
cd frontend
zip -r ../frontend-build.zip .next package.json package-lock.json amplify.yml
cd ..

# Subir el archivo a S3 temporalmente
log_info "Subiendo build a S3 temporal..."
BUCKET_NAME="emotioxv2-temp-builds"
BUILD_KEY="frontend-build-$(date +%Y%m%d-%H%M%S).zip"

# Crear bucket temporal si no existe
aws s3 mb s3://$BUCKET_NAME --region $REGION 2>/dev/null || true

# Subir archivo
aws s3 cp frontend-build.zip s3://$BUCKET_NAME/$BUILD_KEY --region $REGION

# Obtener URL firmada
SIGNED_URL=$(aws s3 presign s3://$BUCKET_NAME/$BUILD_KEY --expires-in 3600 --region $REGION)

log_success "Build subido: $SIGNED_URL"

# Crear deployment en Amplify
log_info "Creando deployment en Amplify..."
DEPLOYMENT_RESPONSE=$(aws amplify create-deployment \
    --app-id $APP_ID \
    --branch-name $BRANCH_NAME \
    --source-url $SIGNED_URL \
    --region $REGION \
    --output json)

DEPLOYMENT_ID=$(echo $DEPLOYMENT_RESPONSE | jq -r '.jobSummary.jobId')

log_success "Deployment creado: $DEPLOYMENT_ID"

# Iniciar el deployment
log_info "Iniciando deployment..."
aws amplify start-deployment \
    --app-id $APP_ID \
    --branch-name $BRANCH_NAME \
    --job-id $DEPLOYMENT_ID \
    --region $REGION

log_success "Deployment iniciado"

# Monitorear el estado
log_info "Monitoreando estado del deployment..."
for i in {1..30}; do
    STATUS=$(aws amplify get-job \
        --app-id $APP_ID \
        --branch-name $BRANCH_NAME \
        --job-id $DEPLOYMENT_ID \
        --region $REGION \
        --query 'job.summary.status' \
        --output text)

    log_info "Estado: $STATUS"

    if [ "$STATUS" = "SUCCEED" ]; then
        log_success "✅ Deployment completado exitosamente!"
        break
    elif [ "$STATUS" = "FAILED" ]; then
        log_error "❌ Deployment falló"
        exit 1
    fi

    sleep 10
done

# Limpiar archivos temporales
log_info "Limpiando archivos temporales..."
rm -f frontend-build.zip
aws s3 rm s3://$BUCKET_NAME/$BUILD_KEY --region $REGION

log_success "=== DESPLIEGUE COMPLETADO ==="
echo ""
echo "🌐 URL de la app: https://$APP_ID.amplifyapp.com"
echo "📱 App ID: $APP_ID"
echo "🔗 Branch: $BRANCH_NAME"
echo ""
echo "La app debería estar disponible en unos minutos."
