#!/bin/bash

# 🚀 Script de deploy limpio para frontend (Next.js)
# Limpia el bucket S3, borra .next/, build, sube y luego invalida CloudFront

set -e

# Configuración
BUCKET="emotioxv2-frontend-bucket"
DISTRIBUTION_ID="E3MCIWNMF6ES2R"
REGION="us-east-1"
BUILD_DIR=".next"

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

log_info "Borrando build anterior (.next/)..."
rm -rf frontend/$BUILD_DIR
log_success "Directorio .next/ eliminado."

# 🆕 SINCRONIZAR ENDPOINTS DINÁMICOS ANTES DEL BUILD
log_info "🔄 Sincronizando endpoints dinámicos desde backendV2..."
if [ -f "config/endpoints/sync-script.sh" ]; then
    ./config/endpoints/sync-script.sh --stage prod --verbose
    log_success "✅ Endpoints dinámicos sincronizados"
else
    log_warning "⚠️ Script de sincronización no encontrado, usando endpoints por defecto"
fi

log_info "Construyendo frontend (Next.js)..."
npm --prefix frontend install
npm --prefix frontend run build || { log_error "Error en el build de Next.js"; exit 1; }
log_success "Build completado."

log_info "Subiendo archivos a S3..."
aws s3 sync frontend/$BUILD_DIR s3://$BUCKET --delete --region $REGION || { log_error "Error al subir archivos a S3"; exit 1; }
log_success "Archivos subidos a S3."

# 🆕 COPIAR ENDPOINTS DINÁMICOS AL BUCKET
log_info "Copiando endpoints dinámicos al bucket..."
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
if curl -s -o /dev/null -w "%{http_code}" "https://d2s9nr0bm47yl1.cloudfront.net" | grep -q "200\|302"; then
    log_success "✅ Deployment verificado - Frontend accesible"
else
    log_warning "⚠️ Deployment puede estar propagándose - Verificar en unos minutos"
fi

log_success "🎉 Deployment de frontend completado exitosamente!"
log_info "🌐 URL: https://d2s9nr0bm47yl1.cloudfront.net"
log_info "📁 Bucket: s3://$BUCKET"
log_info "🔄 CloudFront Distribution: $DISTRIBUTION_ID"
