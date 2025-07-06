#!/bin/bash

# 🚀 Script de deploy limpio para public-tests (Vite React)
# Limpia el bucket S3, borra dist/, build, sube y luego invalida CloudFront

set -e

# Configuración
BUCKET="emotioxv2-public-tests-bucket"
DISTRIBUTION_ID="E2X8HCFI5FM1EC"
REGION="us-east-1"
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

log_info "Construyendo public-tests (Vite)..."
npm --prefix public-tests install
npm --prefix public-tests run build || { log_error "Error en el build de Vite"; exit 1; }
log_success "Build completado."

log_info "Subiendo archivos a S3..."
aws s3 sync public-tests/$BUILD_DIR s3://$BUCKET --delete --region $REGION || { log_error "Error al subir archivos a S3"; exit 1; }
log_success "Archivos subidos a S3."

log_info "Invalidando caché de CloudFront..."
aws cloudfront create-invalidation --distribution-id $DISTRIBUTION_ID --paths "/*" || { log_warning "No se pudo invalidar CloudFront automáticamente. Hazlo manual si ves problemas de caché."; }
log_success "Deploy limpio completado."
