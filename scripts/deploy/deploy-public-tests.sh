#!/bin/bash

# 🚀 Script de deploy limpio para public-tests (Vite React)
# Limpia el bucket S3, borra dist/, build, sube y luego invalida CloudFront

set -e

# Configuración - usar variables de entorno o valores por defecto
BUCKET="${BUCKET:-emotioxv2-public-tests}"
DISTRIBUTION_ID="${CLOUDFRONT_DISTRIBUTION_ID:-E1J2YXOVM8QFOG}"
REGION="${REGION:-us-east-1}"
BUILD_DIR="dist"

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

log_info() { echo -e "${BLUE}[INFO]${NC} $1"; }
log_success() { echo -e "${GREEN}[SUCCESS]${NC} $1"; }
log_warning() { echo -e "${YELLOW}[WARNING]${NC} $1"; }
log_error() { echo -e "${RED}[ERROR]${NC} $1"; }

log_info "Limpiando bucket S3: $BUCKET ..."
aws s3 rm s3://$BUCKET --recursive --region $REGION || { log_error "Error al limpiar el bucket S3"; exit 1; }
log_success "Bucket S3 limpio."

log_info "Borrando build anterior (dist/)..."
rm -rf public-tests/$BUILD_DIR
log_success "Directorio dist/ eliminado."

# 🆕 SINCRONIZAR ENDPOINTS DINÁMICOS ANTES DEL BUILD
log_info "🔄 Sincronizando endpoints dinámicos desde backendV2..."
if [ -f "config/endpoints/sync-script.sh" ]; then
    ./config/endpoints/sync-script.sh --stage prod --verbose
    log_success "✅ Endpoints dinámicos sincronizados"
else
    log_warning "⚠️ Script de sincronización no encontrado, usando endpoints por defecto"
fi

log_info "Construyendo public-tests (Vite)..."
npm --prefix public-tests install
npm --prefix public-tests run build || { log_error "Error en el build de Vite"; exit 1; }
log_success "Build completado."

log_info "Subiendo archivos a S3..."
aws s3 sync public-tests/$BUILD_DIR s3://$BUCKET --delete --region $REGION || { log_error "Error al subir archivos a S3"; exit 1; }
log_success "Archivos subidos a S3."

# 🆕 COPIAR ENDPOINTS DINÁMICOS AL BUCKET
log_info "Copiando endpoints dinámicos al bucket..."
# Crear directorio config si no existe
aws s3api put-object --bucket $BUCKET --key config/ --region $REGION 2>/dev/null || true

# Copiar endpoints dinámicos si existen
if [ -f "config/endpoints/dynamic-endpoints.js" ]; then
    aws s3 cp config/endpoints/dynamic-endpoints.js s3://$BUCKET/config/endpoints.js --region $REGION
    log_success "Endpoints dinámicos copiados a S3."
else
    log_warning "No se encontró endpoints dinámicos, se usará la configuración por defecto."
fi

log_info "Invalidando CloudFront..."
aws cloudfront create-invalidation --distribution-id $DISTRIBUTION_ID --paths "/*" --region $REGION || { log_error "Error al invalidar CloudFront"; exit 1; }
log_success "CloudFront invalidado."

log_info "Verificando deployment..."
sleep 10
if curl -s -o /dev/null -w "%{http_code}" "https://emotioxv2-public-tests.s3.amazonaws.com" | grep -q "200\|302"; then
    log_success "✅ Deployment verificado - Public-tests accesible"
else
    log_warning "⚠️ Deployment puede estar propagándose - Verificar en unos minutos"
fi

log_success "🎉 Deployment de public-tests completado exitosamente!"
log_info "🌐 URL: https://emotioxv2-public-tests.s3.amazonaws.com"
log_info "📁 Bucket: s3://$BUCKET"
log_info "🔄 CloudFront Distribution: $DISTRIBUTION_ID"
