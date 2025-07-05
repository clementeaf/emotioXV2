#!/bin/bash

# 🚀 EmotioXV2 - Script Principal de Deployment
# Redirección a scripts organizados

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
    log_info "Redirigiendo a scripts organizados..."
    echo ""

    # Verificar que existe el script organizado
    if [ ! -f "scripts/deploy.sh" ]; then
        log_error "Script organizado no encontrado: scripts/deploy.sh"
        log_info "Ejecutando script de limpieza..."
        bash scripts/deploy/cleanup-old-scripts.sh
        exit 1
    fi

    # Ejecutar el script organizado
    bash scripts/deploy.sh
}

# Ejecutar función principal
main
