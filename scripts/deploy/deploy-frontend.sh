#!/bin/bash

# 🚀 EmotioXV2 - Deploy Frontend a S3/CloudFront
# Script optimizado para deployment rápido

set -e

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Funciones de logging
log_info() { echo -e "${BLUE}[INFO]${NC} $1"; }
log_success() { echo -e "${GREEN}[SUCCESS]${NC} $1"; }
log_warning() { echo -e "${YELLOW}[WARNING]${NC} $1"; }
log_error() { echo -e "${RED}[ERROR]${NC} $1"; }

# Configuración
FRONTEND_DIR="frontend"
BUILD_DIR="out"
BUCKET_NAME="emotioxv2-frontend-bucket"
CLOUDFRONT_DIST_ID="E3MCIWNMF6ES2R"
REGION="us-east-1"

# Función principal
main() {
    echo ""
    log_info "🚀 Iniciando deployment del frontend a S3/CloudFront..."
    echo ""

    # Verificar dependencias
    check_dependencies

    # Build del frontend
    build_frontend

    # Deploy a S3
    deploy_to_s3

    # Invalidar CloudFront
    invalidate_cloudfront

    # Mostrar resultados
    show_results

    echo ""
    log_success "✅ Deployment del frontend completado exitosamente!"
    echo ""
}

# Verificar dependencias
check_dependencies() {
    log_info "Verificando dependencias..."

    # Verificar AWS CLI
    if ! command -v aws &> /dev/null; then
        log_error "AWS CLI no está instalado"
        exit 1
    fi

    # Verificar credenciales AWS
    if ! aws sts get-caller-identity &> /dev/null; then
        log_error "AWS CLI no está configurado correctamente"
        exit 1
    fi

    # Verificar Node.js
    if ! command -v node &> /dev/null; then
        log_error "Node.js no está instalado"
        exit 1
    fi

    # Verificar npm
    if ! command -v npm &> /dev/null; then
        log_error "npm no está instalado"
        exit 1
    fi

    log_success "Todas las dependencias están disponibles"
}

# Build del frontend
build_frontend() {
    log_info "Construyendo el frontend..."

    # Ir al directorio del frontend
    cd "$FRONTEND_DIR"

    # Limpiar builds anteriores
    if [ -d "$BUILD_DIR" ]; then
        rm -rf "$BUILD_DIR"
        log_info "Build anterior eliminado"
    fi

    # Instalar dependencias si es necesario
    if [ ! -d "node_modules" ] || [ package.json -nt node_modules ]; then
        log_info "Instalando dependencias..."
        npm ci --silent
        log_success "Dependencias instaladas"
    else
        log_info "Dependencias ya están actualizadas"
    fi

    # Build del proyecto
    log_info "Compilando el proyecto..."
    npm run build --silent

    # Verificar que el build fue exitoso
    if [ ! -d "$BUILD_DIR" ]; then
        log_error "Build falló - directorio '$BUILD_DIR' no fue creado"
        exit 1
    fi

    log_success "Build completado exitosamente"

    # Volver al directorio raíz
    cd ..
}

# Deploy a S3
deploy_to_s3() {
    log_info "Desplegando archivos a S3..."

    # Verificar que el bucket existe
    if ! aws s3 ls "s3://$BUCKET_NAME" &> /dev/null; then
        log_error "El bucket $BUCKET_NAME no existe"
        exit 1
    fi

    # Sincronizar archivos con S3
    aws s3 sync "$FRONTEND_DIR/$BUILD_DIR" "s3://$BUCKET_NAME" --delete --quiet

    log_success "Archivos desplegados a S3 correctamente"
}

# Invalidar CloudFront
invalidate_cloudfront() {
    log_info "Invalidando caché de CloudFront..."

    # Crear invalidación
    aws cloudfront create-invalidation \
        --distribution-id "$CLOUDFRONT_DIST_ID" \
        --paths "/*" \
        --quiet

    log_success "Caché de CloudFront invalidada"
}

# Mostrar resultados
show_results() {
    echo ""
    log_info "📋 Información del deployment:"
    echo "  🪣 S3 Bucket: $BUCKET_NAME"
    echo "  🌐 CloudFront ID: $CLOUDFRONT_DIST_ID"
    echo "  📍 Región: $REGION"
    echo ""
    log_info "🔗 URLs disponibles:"
    echo "  S3 Website: http://$BUCKET_NAME.s3-website-$REGION.amazonaws.com"
    echo "  CloudFront: https://d2s9nr0bm47yl1.cloudfront.net/"
    echo ""
    log_warning "⏱️  La propagación de CloudFront puede tomar hasta 15 minutos"
}

# Ejecutar función principal
main
