#!/bin/bash

# 🚀 Script de deploy limpio para public-tests (Vite React)
# Limpia el bucket S3, borra dist/, build, sube y luego invalida CloudFront

set -euo pipefail

# Configuración - usar variables de entorno o valores por defecto
BUCKET="${BUCKET:-emotioxv2-public-tests-041238861016}"
DISTRIBUTION_ID="${CLOUDFRONT_DISTRIBUTION_ID:-none}"
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

# No limpiar el bucket antes - usar sync con --delete para evitar downtime
# El sync con --delete solo elimina archivos que no están en el nuevo build
log_info "Preparando deploy a S3: $BUCKET ..."

# 🆕 SINCRONIZAR ENDPOINTS DINÁMICOS ANTES DEL BUILD
log_info "🔄 Verificando endpoints dinámicos..."
if [ -f "public-tests/src/config/endpoints.js" ]; then
    log_success "✅ Endpoints dinámicos encontrados"
else
    log_warning "⚠️ Endpoints dinámicos no encontrados, usando configuración por defecto"
fi

# El build ya fue hecho por el workflow de GitHub Actions
log_info "Verificando build existente..."
if [ ! -d "public-tests/$BUILD_DIR" ]; then
    log_error "Directorio de build no encontrado. El workflow debe hacer el build antes de este script."
    exit 1
fi
log_success "Build encontrado y verificado."

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
if [ "$DISTRIBUTION_ID" != "none" ] && [ -n "$DISTRIBUTION_ID" ]; then
    if aws cloudfront get-distribution --id "$DISTRIBUTION_ID" --region "$REGION" >/dev/null 2>&1; then
        if aws cloudfront create-invalidation --distribution-id "$DISTRIBUTION_ID" --paths "/*" --region "$REGION" >/dev/null 2>&1; then
            log_success "CloudFront invalidado."
        else
            log_warning "Error al invalidar CloudFront, pero continuando deployment"
        fi
    else
        log_warning "⚠️ Distribución CloudFront no encontrada ($DISTRIBUTION_ID), saltando invalidación"
        log_info "🔄 El contenido será accesible directamente desde S3"
    fi
else
    log_info "⚠️ CloudFront Distribution ID no configurado - usando solo S3"
fi

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
