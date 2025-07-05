#!/bin/bash

# 🚀 EmotioXV2 - Script Principal de Deployment
# Menú interactivo para elegir el tipo de deployment

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
    log_info "🚀 EmotioXV2 - Script de Deployment"
    echo ""
    log_info "Selecciona el tipo de deployment:"
    echo ""
    echo "1) 🖥️  Deploy Frontend (3-4 min)"
    echo "2) 📱 Deploy Public-Tests (2-3 min)"
    echo "3) 🚀 Deploy Ambos (5-6 min)"
    echo "4) 📋 Mostrar URLs"
    echo "5) ✅ Validar Deployment"
    echo "6) ❌ Salir"
    echo ""

    read -p "Elige una opción (1-6): " choice

    case $choice in
        1)
            log_info "Ejecutando deploy del frontend..."
            bash scripts/deploy/deploy-frontend.sh
            ;;
        2)
            log_info "Ejecutando deploy de public-tests..."
            bash scripts/deploy/deploy-public-tests.sh
            ;;
        3)
            log_info "Ejecutando deploy completo..."
            bash scripts/deploy/deploy-both.sh
            ;;
        4)
            log_info "Mostrando URLs..."
            bash scripts/deploy/show-urls.sh
            ;;
        5)
            log_info "Validando deployment..."
            bash scripts/deploy/validate-deployment.sh
            ;;
        6)
            log_info "Saliendo..."
            exit 0
            ;;
        *)
            log_error "Opción inválida. Por favor, elige 1-6."
            main
            ;;
    esac
}

# Ejecutar función principal
main
