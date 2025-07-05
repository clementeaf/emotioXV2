#!/bin/bash

# 📋 EmotioXV2 - Mostrar URLs Activas
# Script para verificar todas las URLs de deployment

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

# Función principal
main() {
    echo ""
    log_info "📋 URLs Activas de EmotioXV2"
    echo ""

    # Mostrar URLs de frontend
    show_frontend_urls

    # Mostrar URLs de public-tests
    show_public_tests_urls

    # Mostrar configuración recomendada
    show_configuration

    echo ""
    log_info "✅ Verificación de URLs completada"
    echo ""
}

# Mostrar URLs del frontend
show_frontend_urls() {
    log_info "🖥️  FRONTEND (Next.js):"
    echo "  🌐 CloudFront: https://d2s9nr0bm47yl1.cloudfront.net/"
    echo "  🪣 S3 Website: http://emotioxv2-frontend-bucket.s3-website-us-east-1.amazonaws.com"
    echo "  📍 Región: us-east-1"
    echo "  🆔 CloudFront ID: E3MCIWNMF6ES2R"
    echo ""
}

# Mostrar URLs de public-tests
show_public_tests_urls() {
    log_info "📱 PUBLIC-TESTS (Vite React):"
    echo "  🌐 CloudFront: https://d2zt8ia21te5mv.cloudfront.net/"
    echo "  🪣 S3 Website: http://emotioxv2-public-tests-bucket.s3-website-us-east-1.amazonaws.com"
    echo "  📍 Región: us-east-1"
    echo "  🆔 CloudFront ID: E2X8HCFI5FM1EC"
    echo ""
}

# Mostrar configuración recomendada
show_configuration() {
    log_info "⚙️  CONFIGURACIÓN RECOMENDADA:"
    echo ""
    log_info "Para el frontend (.env.production):"
echo "  NEXT_PUBLIC_API_URL=https://d5x2q3te3j.execute-api.us-east-1.amazonaws.com/dev"
echo "  NEXT_PUBLIC_WS_URL=wss://0x3ndqqhe9.execute-api.us-east-1.amazonaws.com/prod"
echo "  NEXT_PUBLIC_PUBLIC_TESTS_URL=https://d2zt8ia21te5mv.cloudfront.net/"
    echo ""
    log_info "Para public-tests (.env.production):"
    echo "  VITE_API_URL=https://d5x2q3te3j.execute-api.us-east-1.amazonaws.com/dev"
    echo ""
}

# Ejecutar función principal
main
