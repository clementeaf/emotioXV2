#!/bin/bash

# ⚙️ EmotioXV2 - Configuración de Deployment
# Archivo centralizado con todas las configuraciones

# ======================================================================
# 🏗️ CONFIGURACIÓN DE INFRAESTRUCTURA AWS
# ======================================================================

# Región AWS
export AWS_REGION="us-east-1"

# ======================================================================
# 🖥️ CONFIGURACIÓN DEL FRONTEND
# ======================================================================

# Directorio del frontend
export FRONTEND_DIR="frontend"

# Directorio de build del frontend
export FRONTEND_BUILD_DIR="out"

# Bucket S3 del frontend
export FRONTEND_BUCKET_NAME="emotioxv2-frontend-041238861016"

# ID de distribución CloudFront del frontend
export FRONTEND_CLOUDFRONT_DIST_ID="E3MCIWNMF6ES2R"

# URL CloudFront del frontend
export FRONTEND_CLOUDFRONT_URL="https://d2s9nr0bm47yl1.cloudfront.net/"

# URL S3 del frontend
export FRONTEND_S3_URL="http://emotioxv2-frontend-041238861016.s3-website-us-east-1.amazonaws.com"

# ======================================================================
# 📱 CONFIGURACIÓN DE PUBLIC-TESTS
# ======================================================================

# Directorio de public-tests
export PUBLIC_TESTS_DIR="public-tests"

# Directorio de build de public-tests
export PUBLIC_TESTS_BUILD_DIR="dist"

# Bucket S3 de public-tests
export PUBLIC_TESTS_BUCKET_NAME="emotioxv2-public-tests-041238861016"

# ID de distribución CloudFront de public-tests
export PUBLIC_TESTS_CLOUDFRONT_DIST_ID="E2X8HCFI5FM1EC"

# URL CloudFront de public-tests
export PUBLIC_TESTS_CLOUDFRONT_URL="https://d2zt8ia21te5mv.cloudfront.net/"

# URL S3 de public-tests
export PUBLIC_TESTS_S3_URL="http://emotioxv2-public-tests-041238861016.s3-website-us-east-1.amazonaws.com"

# ======================================================================
# 🔗 CONFIGURACIÓN DE APIs
# ======================================================================

# URL de la API de desarrollo
export DEV_API_URL="https://d5x2q3te3j.execute-api.us-east-1.amazonaws.com/dev"

# URL de la API de producción
export PROD_API_URL="https://8tgodyuvfj.execute-api.us-east-1.amazonaws.com/prod"

# URL del WebSocket de desarrollo
export DEV_WS_URL="wss://d5x2q3te3j.execute-api.us-east-1.amazonaws.com/dev"

# URL del WebSocket de producción
export PROD_WS_URL="wss://0x3ndqqhe9.execute-api.us-east-1.amazonaws.com/prod"

# ======================================================================
# ⚡ CONFIGURACIÓN DE DEPLOYMENT
# ======================================================================

# Tiempo de espera para propagación de CloudFront (en segundos)
export CLOUDFRONT_PROPAGATION_TIME=900

# Tiempo de timeout para validaciones (en segundos)
export VALIDATION_TIMEOUT=10

# Número de reintentos para validaciones
export VALIDATION_RETRIES=3

# ======================================================================
# 🎨 CONFIGURACIÓN DE LOGGING
# ======================================================================

# Colores para output
export RED='\033[0;31m'
export GREEN='\033[0;32m'
export YELLOW='\033[1;33m'
export BLUE='\033[0;34m'
export NC='\033[0m'

# ======================================================================
# 📋 FUNCIONES DE UTILIDAD
# ======================================================================

# Función para logging
log_info() { echo -e "${BLUE}[INFO]${NC} $1"; }
log_success() { echo -e "${GREEN}[SUCCESS]${NC} $1"; }
log_warning() { echo -e "${YELLOW}[WARNING]${NC} $1"; }
log_error() { echo -e "${RED}[ERROR]${NC} $1"; }

# Función para validar que las variables están definidas
validate_config() {
    local required_vars=(
        "AWS_REGION"
        "FRONTEND_DIR"
        "FRONTEND_BUCKET_NAME"
        "FRONTEND_CLOUDFRONT_DIST_ID"
        "PUBLIC_TESTS_DIR"
        "PUBLIC_TESTS_BUCKET_NAME"
        "PUBLIC_TESTS_CLOUDFRONT_DIST_ID"
    )

    for var in "${required_vars[@]}"; do
        if [ -z "${!var}" ]; then
            log_error "Variable de configuración faltante: $var"
            return 1
        fi
    done

    log_success "Configuración validada correctamente"
    return 0
}

# Función para mostrar configuración actual
show_config() {
    echo ""
    log_info "⚙️ Configuración actual:"
    echo ""
    echo "🌍 Región AWS: $AWS_REGION"
    echo ""
    echo "🖥️ Frontend:"
    echo "  Directorio: $FRONTEND_DIR"
    echo "  Build: $FRONTEND_BUILD_DIR"
    echo "  Bucket: $FRONTEND_BUCKET_NAME"
    echo "  CloudFront: $FRONTEND_CLOUDFRONT_URL"
    echo ""
    echo "📱 Public-Tests:"
    echo "  Directorio: $PUBLIC_TESTS_DIR"
    echo "  Build: $PUBLIC_TESTS_BUILD_DIR"
    echo "  Bucket: $PUBLIC_TESTS_BUCKET_NAME"
    echo "  CloudFront: $PUBLIC_TESTS_CLOUDFRONT_URL"
    echo ""
}

# Exportar funciones para que estén disponibles en otros scripts
export -f log_info
export -f log_success
export -f log_warning
export -f log_error
export -f validate_config
export -f show_config
